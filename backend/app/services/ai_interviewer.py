"""
AI Interviewer Service
Orchestrates the OpenAI Realtime API for voice-based interviews.
Manages the state machine: Intro -> Technical -> Behavioral -> Salary
"""
import json
import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_redis
import logging

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class InterviewPhase(str, Enum):
    INTRO = "intro"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SALARY = "salary"
    COMPLETED = "completed"


PHASE_PROMPTS = {
    InterviewPhase.INTRO: """
You are HireAI, a professional AI interviewer. You are conducting the INTRODUCTION ROUND.
Goals:
1. Welcome the candidate warmly and professionally
2. Verify their identity and the role they applied for
3. Ask about their background, career journey, and motivations
4. Assess cultural fit and communication skills
5. Transition naturally to the Technical Round after 8-10 minutes

Tone: Warm, professional, encouraging. Make the candidate feel comfortable.
Keep questions open-ended. Listen actively and probe on interesting points.
""",

    InterviewPhase.TECHNICAL: """
You are HireAI conducting the TECHNICAL ASSESSMENT ROUND.
Candidate Resume Data: {resume_data}
Job Requirements: {job_requirements}

Goals:
1. Assess technical depth in: {key_skills}
2. Ask progressively harder questions - start at medium difficulty
3. Give scenario-based problems, not just definitions
4. Follow up based on their answers — probe claims of expertise
5. Cover at least 4-5 distinct technical areas from the JD
6. Transition to Behavioral Round after 20-25 minutes

Guidelines:
- If candidate struggles: simplify and give partial credit
- If candidate excels: go deeper into advanced concepts
- Ask about real projects they've worked on
- Evaluate problem-solving approach, not just correctness
""",

    InterviewPhase.BEHAVIORAL: """
You are HireAI conducting the BEHAVIOURAL & HR ROUND.
Goals:
1. Use STAR method (Situation, Task, Action, Result) for scenario questions
2. Assess: Leadership, Teamwork, Conflict resolution, Ownership, Adaptability
3. Ask about past failures and what they learned
4. Evaluate communication clarity and emotional intelligence
5. Transition to Salary Negotiation after 8-10 minutes

Sample questions to use (pick 3-4 most relevant):
- Tell me about a time you disagreed with your manager
- Describe a project where you had to lead without authority
- Share a significant failure and what you learned
- How do you handle tight deadlines with incomplete information?
""",

    InterviewPhase.SALARY: """
You are HireAI conducting the SALARY NEGOTIATION phase.
Company budget for this role: {salary_min} to {salary_max} LPA
Candidate's expected salary (from resume/profile): {expected_salary} LPA

Goals:
1. Discuss the candidate's salary expectations if not already known
2. Present the company's range professionally
3. Negotiate within the approved band - you CANNOT exceed {salary_max} LPA
4. Discuss other benefits: joining bonus, ESOPs, flexible work, learning budget
5. Reach a mutual agreement or note the gap
6. Wrap up the interview professionally

Be respectful and transparent. This is a negotiation, not a confrontation.
""",
}


class InterviewStateMachine:
    """Manages the interview state for a single interview session."""

    def __init__(self, interview_id: str, resume_data: Dict, job_data: Dict):
        self.interview_id = interview_id
        self.resume_data = resume_data
        self.job_data = job_data
        self.current_phase = InterviewPhase.INTRO
        self.transcript: List[Dict] = []
        self.phase_start_times: Dict[str, datetime] = {InterviewPhase.INTRO: datetime.utcnow()}
        self.phase_scores: Dict[str, Optional[float]] = {}
        self.questions_asked: List[str] = []

    def get_system_prompt(self) -> str:
        """Build the system prompt for the current interview phase."""
        template = PHASE_PROMPTS.get(self.current_phase, "")
        
        return template.format(
            resume_data=json.dumps(self.resume_data, indent=2),
            job_requirements=self.job_data.get("requirements", []),
            key_skills=", ".join(self.job_data.get("required_skills", [])),
            salary_min=self.job_data.get("salary_min", 0) // 100000,
            salary_max=self.job_data.get("salary_max", 0) // 100000,
            expected_salary=self.resume_data.get("expected_salary", "unknown"),
        )

    def advance_phase(self) -> InterviewPhase:
        """Move to the next interview phase."""
        phase_order = [
            InterviewPhase.INTRO,
            InterviewPhase.TECHNICAL,
            InterviewPhase.BEHAVIORAL,
            InterviewPhase.SALARY,
            InterviewPhase.COMPLETED,
        ]
        idx = phase_order.index(self.current_phase)
        if idx < len(phase_order) - 1:
            self.current_phase = phase_order[idx + 1]
            self.phase_start_times[self.current_phase] = datetime.utcnow()
        return self.current_phase

    def add_transcript(self, speaker: str, text: str):
        self.transcript.append({
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
            "phase": self.current_phase,
        })

    def to_dict(self) -> Dict:
        return {
            "interview_id": self.interview_id,
            "current_phase": self.current_phase,
            "transcript": self.transcript,
            "resume_data": self.resume_data,
            "job_data": self.job_data,
            "phase_start_times": {k: v.isoformat() for k, v in self.phase_start_times.items()},
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "InterviewStateMachine":
        instance = cls(
            interview_id=data["interview_id"],
            resume_data=data["resume_data"],
            job_data=data["job_data"],
        )
        instance.current_phase = InterviewPhase(data["current_phase"])
        instance.transcript = data.get("transcript", [])
        return instance


class AIInterviewerService:
    """Core service for AI interview orchestration."""

    async def get_or_create_session(
        self, interview_id: str, resume_data: Dict, job_data: Dict
    ) -> InterviewStateMachine:
        """Retrieve existing session from Redis or create a new one."""
        redis = await get_redis()
        cache_key = f"interview:session:{interview_id}"
        
        cached = None
        if redis:
            try:
                cached = await redis.get(cache_key)
            except Exception as e:
                logger.warning(f"Failed to read from Redis: {e}")
        
        if cached:
            return InterviewStateMachine.from_dict(json.loads(cached))
        
        session = InterviewStateMachine(interview_id, resume_data, job_data)
        await self._save_session(session)
        return session

    async def _save_session(self, session: InterviewStateMachine):
        """Persist session state to Redis."""
        redis = await get_redis()
        if not redis:
            return
            
        cache_key = f"interview:session:{session.interview_id}"
        try:
            await redis.setex(
                cache_key,
                settings.INTERVIEW_ROOM_EXPIRY,
                json.dumps(session.to_dict()),
            )
        except Exception as e:
            logger.warning(f"Failed to write to Redis: {e}")

    async def generate_response(
        self,
        session: InterviewStateMachine,
        candidate_message: str,
        check_phase_transition: bool = True,
    ) -> Dict[str, Any]:
        """Generate AI interviewer response using GPT-4o."""
        
        session.add_transcript("candidate", candidate_message)

        phase_changed = False
        # Check if we should advance to next phase
        if check_phase_transition:
            should_advance = await self._should_advance_phase(session, candidate_message)
            if should_advance:
                session.advance_phase()
                phase_changed = True
                if session.current_phase == InterviewPhase.COMPLETED:
                    await self._save_session(session)
                    return {
                        "text": "Thank you so much for your time today, {name}. It was a pleasure speaking with you. Our team will be in touch shortly with next steps. Have a wonderful day!".format(
                            name=session.resume_data.get("name", "")
                        ),
                        "phase_changed": True,
                        "new_phase": InterviewPhase.COMPLETED,
                        "should_end": True,
                    }

        # Build conversation history for context
        messages = self._build_messages(session)

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            
            ai_text = response.choices[0].message.content
            session.add_transcript("ai", ai_text)
            await self._save_session(session)

            return {
                "text": ai_text,
                "phase": session.current_phase,
                "phase_changed": phase_changed,
                "new_phase": session.current_phase if phase_changed else None
            }

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                "text": "I apologize for the brief interruption. Could you please repeat your last response?",
                "error": str(e),
            }

    def _build_messages(self, session: InterviewStateMachine) -> List[Dict]:
        """Build the message history for the OpenAI API call."""
        messages = [{"role": "system", "content": session.get_system_prompt()}]
        
        # Add last 10 transcript entries for context (avoid token overflow)
        recent = session.transcript[-10:]
        for entry in recent:
            role = "assistant" if entry["speaker"] == "ai" else "user"
            messages.append({"role": role, "content": entry["text"]})
        
        return messages

    async def _should_advance_phase(
        self, session: InterviewStateMachine, latest_message: str
    ) -> bool:
        """Use AI to determine if we should move to the next phase."""
        if session.current_phase == InterviewPhase.COMPLETED:
            return False
        
        phase_transcript = [
            t for t in session.transcript 
            if t.get("phase") == session.current_phase
        ]
        
        # Minimum questions before advancing
        ai_turns = sum(1 for t in phase_transcript if t["speaker"] == "ai")
        
        min_turns = {
            InterviewPhase.INTRO: 2,
            InterviewPhase.TECHNICAL: 4,
            InterviewPhase.BEHAVIORAL: 2,
            InterviewPhase.SALARY: 2,
        }
        
        # TEST MODE: Advance after 60 seconds regardless of turns
        start_time = session.phase_start_times.get(session.current_phase)
        if start_time:
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            if elapsed >= 60:
                logger.info(f"TEST MODE: Advancing phase {session.current_phase} after {elapsed}s")
                return True

        if ai_turns < min_turns.get(session.current_phase, 4):
            return False
        
        # Ask GPT to judge if phase is complete
        check_prompt = f"""
You are evaluating whether the {session.current_phase.value} round of an interview is complete.
Based on the following transcript, should we advance to the next round?
Answer with only "YES" or "NO".

Transcript:
{json.dumps(phase_transcript[-6:], indent=2)}
"""
        try:
            resp = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": check_prompt}],
                max_tokens=5,
                temperature=0,
            )
            return "YES" in resp.choices[0].message.content.upper()
        except Exception:
            return False

    async def end_interview(self, session: InterviewStateMachine) -> Dict:
        """End the interview and return the full transcript."""
        session.current_phase = InterviewPhase.COMPLETED
        await self._save_session(session)
        
        return {
            "interview_id": session.interview_id,
            "total_duration_seconds": (
                datetime.utcnow() - 
                datetime.fromisoformat(
                    list(session.phase_start_times.values())[0].isoformat() 
                    if isinstance(list(session.phase_start_times.values())[0], datetime)
                    else list(session.phase_start_times.values())[0]
                )
            ).seconds,
            "transcript": session.transcript,
            "phases_completed": list(session.phase_start_times.keys()),
        }


# Singleton instance
ai_interviewer = AIInterviewerService()
