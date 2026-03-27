"""
WebSocket Interview Handler
Real-time bidirectional audio streaming for AI-powered voice interviews.
Integrates OpenAI Realtime API for ultra-low-latency speech-to-speech.
"""
import json
import asyncio
import uuid
import base64
import tempfile
import os
from datetime import datetime
from typing import Dict, Optional, Any, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.database import get_supabase, get_redis
from app.services.ai_interviewer import InterviewStateMachine, InterviewPhase, ai_interviewer
from app.schemas.schemas import InterviewRound

router = APIRouter()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Track active interview sessions
active_sessions: Dict[str, dict] = {}


class InterviewSession:
    """
    Manages one candidate's interview session:
    - WebSocket connection
    - State machine (round tracking)
    - Transcript accumulation
    - Redis session state
    """
    
    def __init__(self, interview_id: str, websocket: WebSocket):
        self.interview_id = interview_id
        self.websocket = websocket
        self.state_machine: Optional[InterviewStateMachine] = None
        self.transcript: List[Dict[str, Any]] = []
        self.current_phase = InterviewPhase.INTRO
        self.started_at = datetime.utcnow()
        self.is_processing = False
        self.audio_queue = asyncio.Queue()
        self.processing_lock = asyncio.Lock()
        self.processor_task = None
        self.monitor_task = None
    
    async def initialize(self):
        """Load interview data and initialize state machine."""
        supabase = get_supabase()
        redis_client = await get_redis()
        
        if self.interview_id in ['test', 'test-interview']:
            # Mock data for local testing
            candidate_name = "Test Candidate"
            job_title = "Senior Frontend Engineer"
            job_description = "A great role for a React expert."
            job_requirements = ["React", "TypeScript", "Tailwind"]
            parsed_resume = {"skills": job_requirements}
        else:
            # Load interview + application + job data
            interview = supabase.table("interviews").select(
                "*, applications(*, jobs(*), users(*))"
            ).eq("id", self.interview_id).single().execute()
            
            if not interview.data:
                raise ValueError(f"Interview {self.interview_id} not found")
            
            data = interview.data
            application = data["applications"]
            job = application["jobs"]
            candidate = application["users"]
            candidate_name = candidate["name"]
            job_title = job["title"]
            job_description = job["description"]
            job_requirements = job.get("requirements", [])
            parsed_resume = application.get("parsed_data", {})
        
        # Initialize AI state machine
        is_test = self.interview_id in ['test', 'test-interview']
        self.state_machine = InterviewStateMachine(
            interview_id=self.interview_id,
            resume_data=parsed_resume,
            job_data=job if not is_test else {
                "requirements": ["React"], 
                "required_skills": ["React"], 
                "title": "Senior Frontend Engineer", 
                "description": "A great role for a React expert."
            },
        )
        
        # Restore session from Redis if reconnecting
        if redis_client:
            session_key = f"interview:session:{self.interview_id}"
            cached = await redis_client.get(session_key)
            if cached:
                session_data = json.loads(cached)
                self.current_phase = InterviewPhase(session_data.get("current_round", "intro"))
                self.transcript = session_data.get("transcript", [])
        else:
            print("Redis not available, starting fresh in-memory session.")
        
        # Mark interview as in_progress
        is_test = self.interview_id in ['test', 'test-interview']
        if not is_test:
            supabase.table("interviews").update({
                "status": "in_progress",
                "started_at": self.started_at.isoformat(),
            }).eq("id", self.interview_id).execute()
        
        # Start background processor and round monitor
        self.processor_task = asyncio.create_task(self.audio_processor_loop())
        self.monitor_task = asyncio.create_task(self.auto_round_monitor())

    async def auto_round_monitor(self):
        """Background task to force round changes every 60s for testing."""
        while True:
            await asyncio.sleep(5) # Check every 5 seconds
            if not self.state_machine:
                continue
                
            start_time = self.state_machine.phase_start_times.get(self.state_machine.current_phase)
            if start_time:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed >= 60:
                    print(f"Monitor: Forcing round change for {self.interview_id} after {elapsed}s")
                    # Advance phase
                    prev_phase = self.state_machine.current_phase
                    new_phase = self.state_machine.advance_phase()
                    
                    if prev_phase != new_phase:
                        self.current_phase = new_phase
                        # Notify frontend
                        await self.websocket.send_json({
                            "type": "round_change",
                            "data": {"round": new_phase.value},
                        })
                        
                        # Generate a "transition" question automatically
                        transition_msg = f"Moving to the {new_phase.value} round. Let's continue. "
                        if new_phase == InterviewPhase.TECHNICAL:
                            transition_msg += "I'd like to dive into some technical aspects now."
                        elif new_phase == InterviewPhase.BEHAVIORAL:
                            transition_msg += "Let's talk about some of your past experiences and behaviors."
                        elif new_phase == InterviewPhase.SALARY:
                            transition_msg += "Finally, let's discuss your compensation expectations."
                        
                        audio_b64 = await self.generate_voice(transition_msg)
                        await self.websocket.send_json({
                            "type": "ai_response",
                            "data": {
                                "text": transition_msg,
                                "audio_b64": audio_b64,
                                "round": new_phase.value
                            }
                        })
                        
                        if new_phase == InterviewPhase.COMPLETED:
                            break # Session ended

    async def audio_processor_loop(self):
        """Continuously process audio chunks from the queue."""
        while True:
            try:
                audio_b64 = await self.audio_queue.get()
                if audio_b64 is None:
                    break
                async with self.processing_lock:
                    await self.handle_audio_chunk(audio_b64, self.websocket)
                self.audio_queue.task_done()
            except Exception as e:
                print(f"Error in audio processor loop: {e}")
                await asyncio.sleep(0.1)
    
    async def save_state(self):
        """Persist session state to Redis."""
        redis_client = await get_redis()
        if not redis_client:
            return

        session_key = f"interview:session:{self.interview_id}"
        await redis_client.setex(
            session_key,
            settings.INTERVIEW_ROOM_EXPIRY,
            json.dumps({
                "current_round": self.current_phase.value,
                "transcript": self.transcript[-50:],  # Keep last 50 turns
                "started_at": self.started_at.isoformat(),
            }),
        )
    
    async def generate_voice(self, text: str) -> Optional[str]:
        """Generate TTS audio from AI text response."""
        try:
            response = await openai_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text,
            )
            # OpenAI's speech.create returns a response object with a .content method
            # for the binary audio data (MP3 by default)
            audio_data = response.content
            return base64.b64encode(audio_data).decode('utf-8')
        except Exception as e:
            print(f"TTS Error: {e}")
            return None

    async def handle_audio_chunk(self, audio_b64: str, websocket: WebSocket) -> Optional[str]:
        """
        Process incoming audio from candidate:
        1. Transcribe using Whisper
        2. Feed to AI state machine
        3. Get AI response text
        4. Send for TTS → return audio b64
        """
        if not audio_b64:
            return None

        self.is_processing = True
        print(f"Received audio chunk: {len(audio_b64)} bytes")
        try:
            # Convert base64 to binary
            audio_data = base64.b64decode(audio_b64)
            
            # Save to temporary file (OpenAI requires a file-like object with a name)
            # The frontend sends audio/webm. Whisper officially supports webm.
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            try:
                # 1. Transcribe using Whisper
                with open(tmp_path, "rb") as audio_file:
                    transcript = await openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                    )
                
                text = transcript.text.strip()
                print(f"Transcribed text: '{text}'")
                
                # Expanded Whisper hallucination filter
                WHISPER_HALLUCINATIONS = {
                    "thank you.", "thanks for watching.", "thank you for watching.",
                    "subscribe", "bye.", "you", "hmm", "uh", "um", "oh",
                    "thanks.", "thank you so much.", "please subscribe.",
                    "like and subscribe.", "see you next time.",
                    "music", "applause", "laughter", "silence",
                    "[music]", "[applause]", "[silence]",
                    "...", "i don't know.", "okay.", "okay",
                    "bye", "thanks", "thank you", "yeah", "yes", "no",
                    "so", "the", "a", "i", "it", "is",
                    "you know", "right", "well",
                }
                text_lower = text.lower().strip().rstrip('.')
                if (not text
                    or len(text) < 4
                    or text_lower in WHISPER_HALLUCINATIONS
                    or len(text.split()) < 2):
                    print(f"Filtered hallucination: '{text}'")
                    return None
                    
                # Send the candidate's transcribed text to the frontend immediately
                await websocket.send_json({
                    "type": "transcript_update",
                    "data": {"speaker": "candidate", "text": text}
                })
                
                # 2. Process text through state machine
                ai_response = await self.handle_transcript(text, "candidate")
                
                # 3. Send AI text and audio immediately so UI displays it
                if ai_response:
                    new_phase = ai_response.get("new_phase")
                    phase_val = new_phase.value if hasattr(new_phase, 'value') else new_phase if new_phase else self.current_phase.value
                    
                    await websocket.send_json({
                        "type": "ai_response",
                        "data": {
                            "text": ai_response.get("text"),
                            "audio_b64": ai_response.get("audio_b64"),
                            "round": phase_val
                        }
                    })
                    
                    if ai_response.get("phase_changed"):
                        await websocket.send_json({
                            "type": "round_change",
                            "data": {"round": phase_val},
                        })
                    
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        finally:
            self.is_processing = False
        
        return None

    async def handle_transcript(self, text: str, speaker: str) -> dict:
        """Process text transcript and get AI response."""
        if not self.state_machine:
            return {}
        
        # Add to transcript
        turn = {
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
            "round": self.current_phase.value,
        }
        self.transcript.append(turn)
        
        if speaker == "candidate":
            # Get AI response from state machine
            ai_response = await ai_interviewer.generate_response(
                session=self.state_machine,
                candidate_message=text,
            )
            
            # Check for round transition
            if ai_response.get("phase_changed"):
                self.current_phase = ai_response.get("new_phase", self.current_phase)
            
            # Add AI turn to transcript
            ai_text = ai_response.get("text", "")
            ai_turn = {
                "speaker": "ai",
                "text": ai_text,
                "timestamp": datetime.utcnow().isoformat(),
                "round": self.current_phase.value,
            }
            self.transcript.append(ai_turn)
            
            # Generate voice for the AI response
            audio_b64 = await self.generate_voice(ai_text)
            ai_response["audio_b64"] = audio_b64
            
            await self.save_state()
            return ai_response
        
        return {}
    
    async def end_interview(self):
        """Finalize interview — trigger assessment generation."""
        if self.interview_id == "test-interview":
            print("Skipping DB update for test-interview.")
            return

        supabase = get_supabase()
        
        try:
            # Save full transcript to DB
            supabase.table("interviews").update({
                "status": "completed",
            }).eq("id", self.interview_id).execute()
            
            # Trigger async assessment generation
            from app.services.assessment_generator import generate_assessment
            asyncio.create_task(
                generate_assessment(self.interview_id, self.transcript)
            )
        except Exception as e:
            print(f"Error ending interview: {e}")


@router.websocket("/interview/{interview_id}")
async def interview_websocket(
    websocket: WebSocket,
    interview_id: str,
    token: str = Query(...),  # Auth token passed as query param for WS
):
    """
    Main WebSocket endpoint for live AI interviews.
    
    Message Types (client → server):
        - {"type": "audio_chunk", "data": {"audio_b64": "..."}}
        - {"type": "transcript", "data": {"text": "...", "speaker": "candidate"}}
        - {"type": "end_interview"}
        - {"type": "ping"}
    
    Message Types (server → client):
        - {"type": "ai_response", "data": {"text": "...", "audio_b64": "..."}}
        - {"type": "transcript_update", "data": {"turn": {...}}}
        - {"type": "round_change", "data": {"round": "technical"}}
        - {"type": "scores_update", "data": {"technical": 87, ...}}
        - {"type": "interview_ended", "data": {"message": "..."}}
        - {"type": "error", "data": {"message": "..."}}
    """
    await websocket.accept()
    
    session = InterviewSession(interview_id, websocket)
    
    try:
        # Initialize session
        await session.initialize()
        active_sessions[interview_id] = session
        
        # Send welcome message with opening question and voice
        candidate_name = session.state_machine.resume_data.get('name', 'Candidate') if session.state_machine else 'Candidate'
        opening = f"Hello {candidate_name}, I'm HireAI, your interviewer today. I've reviewed your resume and I'm excited to learn more about your experience. Could you start by briefly walking me through your background?"
        opening_audio = await session.generate_voice(opening)
        await websocket.send_json({
            "type": "ai_response",
            "data": {
                "text": opening,
                "audio_b64": opening_audio,
                "round": InterviewRound.INTRO.value,
            },
        })
        
        # Main message loop
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=settings.MAX_INTERVIEW_DURATION,
                )
            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "interview_ended",
                    "data": {"message": "Interview session timed out."},
                })
                break
            
            message = json.loads(raw)
            msg_type = message.get("type")
            data = message.get("data", {})
            
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif msg_type == "audio_chunk":
                # Add audio to queue for sequential processing
                audio_b64 = data.get("audio_b64", "")
                await session.audio_queue.put(audio_b64)
            
            elif msg_type == "transcript":
                # Text-mode fallback (or after STT processing)
                text = data.get("text", "")
                speaker = data.get("speaker", "candidate")
                
                if speaker == "ai_test":
                    # Bypass state machine for diagnostic test
                    audio_b64 = await session.generate_voice(text)
                    await websocket.send_json({
                        "type": "ai_response",
                        "data": {
                            "text": text,
                            "audio_b64": audio_b64,
                            "round": session.current_phase.value
                        }
                    })
                    continue

                ai_response = await session.handle_transcript(text, speaker)
                
                if ai_response:
                    new_phase = ai_response.get("new_phase")
                    phase_val = new_phase.value if hasattr(new_phase, 'value') else new_phase if new_phase else session.current_phase.value

                    await websocket.send_json({
                        "type": "ai_response",
                        "data": {
                            "text": ai_response.get("text", ""),
                            "audio_b64": ai_response.get("audio_b64"),
                            "round": phase_val,
                        },
                    })
                    
                    # Send live scores
                    scores = ai_response.get("live_scores", {})
                    if scores:
                        await websocket.send_json({
                            "type": "scores_update",
                            "data": scores,
                        })
                    
                    # Notify round change
                    if ai_response.get("phase_changed"):
                        await websocket.send_json({
                            "type": "round_change",
                            "data": {"round": phase_val},
                        })
            
            elif msg_type == "end_interview":
                print(f"Interview {interview_id} ending...")
                await session.end_interview()
                await websocket.send_json({
                    "type": "interview_ended",
                    "data": {
                        "message": "Interview completed. Your assessment report will be ready shortly.",
                        "interview_id": interview_id,
                    },
                })
                break
    
    except WebSocketDisconnect:
        await session.save_state()
    
    except Exception as e:
        print(f"WebSocket error for interview {interview_id}: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"message": "An unexpected error occurred."},
            })
        except Exception:
            pass
    
    finally:
        active_sessions.pop(interview_id, None)
        if session.processor_task:
            session.processor_task.cancel()
        if hasattr(session, 'monitor_task') and session.monitor_task:
            session.monitor_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass
