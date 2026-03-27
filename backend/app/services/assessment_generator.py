"""
Assessment Generator Service
Analyzes full interview transcripts to produce comprehensive scorecards.
"""
from datetime import datetime
import uuid
import json
from typing import Any, Dict, List
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_supabase
from app.schemas.schemas import HireVerdict, InterviewStatus, ApplicationStatus
from app.services.email_service import send_assessment_ready
import logging
import asyncio

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


ASSESSMENT_PROMPT = """
You are an expert talent assessment AI. Analyze this complete interview transcript and generate a comprehensive candidate evaluation.

Job Title: {job_title}
Candidate Name: {candidate_name}
Interview Duration: {duration} minutes

Full Transcript:
{transcript}

Generate a detailed JSON assessment with this exact schema:
{{
  "overall_score": float (0-100),
  "technical_score": float (0-100),
  "behavioral_score": float (0-100),
  "communication_score": float (0-100),
  "cultural_fit_score": float (0-100),
  "problem_solving_score": float (0-100),
  
  "verdict": "strong_hire" | "hire" | "no_hire" | "strong_no_hire",
  "verdict_reasoning": "2-3 sentence explanation",
  
  "key_strengths": ["list", "of", "3-5", "strengths"],
  "areas_of_improvement": ["list", "of", "2-3", "areas"],
  
  "technical_highlights": ["specific technical claims that were accurate"],
  "technical_concerns": ["specific gaps or incorrect claims"],
  
  "behavioral_highlights": ["strong behavioral examples given"],
  
  "expected_salary": integer (in INR, extract from negotiation if discussed),
  "negotiated_salary": integer (in INR, final agreed amount if discussed),
  "salary_notes": "string",
  
  "round_summaries": [
    {{
      "round": "intro|technical|behavioral|salary",
      "score": float,
      "duration_estimate_mins": integer,
      "key_takeaways": ["list"],
      "red_flags": ["list, empty if none"]
    }}
  ],
  
  "hiring_recommendation": "detailed paragraph for recruiter",
  "suggested_onboarding_notes": "what this candidate might need support with"
}}

Be objective, specific, and cite actual moments from the transcript.
Return ONLY valid JSON.
"""


class AssessmentGeneratorService:
    """Generates post-interview assessments using GPT-4o analysis."""

    async def generate_assessment(
        self,
        interview_id: str,
        transcript: List[Dict],
        job_data: Dict,
        resume_data: Dict,
        duration_minutes: int,
    ) -> Dict[str, Any]:
        """Generate a full candidate assessment from the interview transcript."""

        # Format transcript for analysis
        formatted_transcript = "\n\n".join([
            f"[{entry['phase'].upper()} | {entry['speaker'].upper()}]: {entry['text']}"
            for entry in transcript
        ])

        prompt = ASSESSMENT_PROMPT.format(
            job_title=job_data.get("title", "Unknown Role"),
            candidate_name=resume_data.get("name", "Candidate"),
            duration=duration_minutes,
            transcript=formatted_transcript[:12000],  # Token limit safety
        )

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3000,
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            assessment = json.loads(raw)
            assessment["interview_id"] = interview_id
            
            # Validate and clamp scores
            for score_key in ["overall_score", "technical_score", "behavioral_score",
                              "communication_score", "cultural_fit_score"]:
                if score_key in assessment:
                    try:
                        val = float(assessment[score_key])
                        assessment[score_key] = max(0.0, min(100.0, val))
                    except (ValueError, TypeError):
                        assessment[score_key] = 50.0
            
            # Validate verdict
            valid_verdicts = {v.value for v in HireVerdict}
            if assessment.get("verdict") not in valid_verdicts:
                assessment["verdict"] = self._compute_verdict_from_score(
                    assessment.get("overall_score", 50)
                )
            
            return assessment

        except Exception as e:
            logger.error(f"Assessment generation failed: {e}")
            return self._fallback_assessment(interview_id, transcript)

    def _compute_verdict_from_score(self, score: float) -> str:
        """Compute verdict from overall score as fallback."""
        if score >= 85:
            return HireVerdict.STRONG_HIRE.value
        elif score >= 70:
            return HireVerdict.HIRE.value
        elif score >= 50:
            return HireVerdict.NO_HIRE.value
        else:
            return HireVerdict.STRONG_NO_HIRE.value

    def _fallback_assessment(self, interview_id: str, transcript: List[Dict]) -> Dict:
        """Return a minimal assessment if AI generation fails."""
        return {
            "interview_id": interview_id,
            "overall_score": 50.0,
            "technical_score": 50.0,
            "behavioral_score": 50.0,
            "communication_score": 50.0,
            "cultural_fit_score": 50.0,
            "problem_solving_score": 50.0,
            "verdict": HireVerdict.NO_HIRE.value,
            "verdict_reasoning": "Assessment generation failed. Manual review required.",
            "key_strengths": [],
            "areas_of_improvement": [],
            "technical_highlights": [],
            "technical_concerns": [],
            "behavioral_highlights": [],
            "expected_salary": None,
            "negotiated_salary": None,
            "salary_notes": "",
            "round_summaries": [],
            "hiring_recommendation": "Manual review required.",
            "suggested_onboarding_notes": "",
        }

    async def generate_email_summary(
        self, assessment: Dict, candidate_name: str, job_title: str
    ) -> str:
        """Generate a recruiter-friendly email summary of the assessment."""
        verdict_map = {
            "strong_hire": "✅ Strong Hire",
            "hire": "✅ Hire",
            "no_hire": "❌ No Hire",
            "strong_no_hire": "❌ Strong No Hire",
        }
        
        verdict_label = verdict_map.get(assessment.get("verdict", ""), "Pending")
        
        return f"""
HireAI Assessment Report — {candidate_name}
Role: {job_title}

VERDICT: {verdict_label}
Overall Score: {assessment.get('overall_score', 0):.0f}/100

Score Breakdown:
• Technical: {assessment.get('technical_score', 0):.0f}/100
• Behavioral: {assessment.get('behavioral_score', 0):.0f}/100
• Communication: {assessment.get('communication_score', 0):.0f}/100
• Cultural Fit: {assessment.get('cultural_fit_score', 0):.0f}/100

Key Strengths:
{chr(10).join(f"• {s}" for s in assessment.get('key_strengths', []))}

Hiring Recommendation:
{assessment.get('hiring_recommendation', '')}

View full report: https://hireai.com/recruiter/assessments/{assessment.get('interview_id')}
"""


# Singleton instance
assessment_generator = AssessmentGeneratorService()


async def generate_assessment(interview_id: str, transcript: List[Dict]):
    """
    Background Task: 
    1. Fetch interview/job/candidate data
    2. Run AI assessment analysis
    3. Save results to Supabase 'assessments' table
    4. Update application/interview status
    5. Notify recruiter via email
    """
    supabase = get_supabase()
    
    try:
        # 1. Fetch data with relationships
        res = supabase.table("interviews").select(
            "*, applications(*, jobs(*, creator:users!created_by(*)), users(*))"
        ).eq("id", interview_id).single().execute()
        
        if not res.data:
            logger.error(f"Interview {interview_id} not found for assessment")
            return

        data = res.data
        application = data["applications"]
        job = application["jobs"]
        candidate = application["users"]
        recruiter = job.get("creator", {})
        
        # Calculate duration
        started_at = datetime.fromisoformat(data.get("started_at", datetime.utcnow().isoformat()))
        duration_mins = int((datetime.utcnow() - started_at).total_seconds() / 60)
        
        # 2. Run AI generation
        assessment_data = await assessment_generator.generate_assessment(
            interview_id=interview_id,
            transcript=transcript,
            job_data=job,
            resume_data=application.get("parsed_data", {}),
            duration_minutes=duration_mins
        )
        
        # 3. Persist to DB
        # Convert Pydantic models/enums to serializable format if needed
        # Supabase/PostgREST handles dicts/enums usually, but let's be safe
        verdict = assessment_data.get("verdict", "hire")
        
        assessment_id = str(uuid.uuid4())
        supabase.table("assessments").insert({
            "id": assessment_id,
            "interview_id": interview_id,
            "technical_score": assessment_data.get("technical_score", 0),
            "behavioral_score": assessment_data.get("behavioral_score", 0),
            "communication_score": assessment_data.get("communication_score", 0),
            "cultural_fit_score": assessment_data.get("cultural_fit_score", 0),
            "overall_score": assessment_data.get("overall_score", 0),
            "expected_salary": assessment_data.get("expected_salary"),
            "negotiated_salary": assessment_data.get("negotiated_salary"),
            "verdict": verdict,
            "verdict_reasoning": assessment_data.get("verdict_reasoning", ""),
            "key_strengths": assessment_data.get("key_strengths", []),
            "areas_of_improvement": assessment_data.get("areas_of_improvement", []),
            "round_summaries": assessment_data.get("round_summaries", []),
            "detailed_report": assessment_data
        }).execute()
        
        # 4. Update statuses
        supabase.table("interviews").update({
            "status": InterviewStatus.COMPLETED.value
        }).eq("id", interview_id).execute()
        
        supabase.table("applications").update({
            "status": ApplicationStatus.INTERVIEWED.value
        }).eq("id", data["application_id"]).execute()
        
        # 5. Notify Recruiter (SES)
        if recruiter and recruiter.get("email"):
            dashboard_link = f"{settings.FRONTEND_URL}/recruiter/assessments/{interview_id}"
            await send_assessment_ready(
                to_email=recruiter["email"],
                recruiter_name=recruiter.get("name", "Recruiter"),
                candidate_name=candidate.get("name", "Candidate"),
                job_title=job.get("title", "Unknown Role"),
                overall_score=int(assessment_data.get("overall_score", 0)),
                verdict=verdict,
                dashboard_link=dashboard_link
            )
            
        logger.info(f"✅ Assessment completed and notified for interview {interview_id}")
        
    except Exception as e:
        logger.error(f"❌ Background assessment task failed: {e}")
