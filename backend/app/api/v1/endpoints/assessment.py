"""Assessment API — Fetch and manage AI-generated interview scorecards."""
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_supabase
from app.schemas.schemas import AssessmentResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/{interview_id}", response_model=AssessmentResponse)
async def get_assessment(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch the AI-generated scorecard for an interview."""
    supabase = get_supabase()
    
    result = supabase.table("assessments").select("*").eq("interview_id", interview_id).single().execute()
    
    if not result.data:
        # Check if interview is still processing
        interview = supabase.table("interviews").select("status").eq("id", interview_id).single().execute()
        if interview.data and interview.data["status"] == "completed":
            raise HTTPException(status_code=202, detail="Assessment is being generated. Please check back in a minute.")
        raise HTTPException(status_code=404, detail="Assessment not found.")
    
    return result.data


@router.get("/", response_model=list[AssessmentResponse])
async def list_assessments(
    job_id: str = None,
    current_user: dict = Depends(get_current_user),
):
    """List all assessments for a recruiter's jobs."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    
    query = supabase.table("assessments").select(
        "*, interviews(*, applications(*, users(name, email), jobs(title)))"
    )
    
    result = query.order("created_at", desc=True).execute()
    return result.data
