"""
Matching Engine Service
Semantic matching of candidate resumes against Job Descriptions
using OpenAI embeddings + cosine similarity.
"""
import json
import numpy as np
from typing import List
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_redis
from app.schemas.schemas import ParsedResumeData
import logging

logger = logging.getLogger(__name__)

# Weights for scoring components
SCORE_WEIGHTS = {
    "semantic_similarity": 0.40,
    "skills_overlap": 0.35,
    "experience_match": 0.15,
    "education_match": 0.10,
}


class MatchingEngine:
    """
    Multi-factor JD-Resume matching engine.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-3-small"

    async def compute_match_score(
        self,
        parsed_resume: ParsedResumeData,
        job_id: str,
        job_description: str,
        required_skills: List[str],
        min_experience: int,
    ) -> float:
        """
        Compute weighted match score between resume and job description.
        Returns a score between 0.0 and 1.0.
        """
        debug_log = f"c:/Users/ashish/Desktop/Profile_project/Hiring_AI/backend/matching_debug_{job_id}.log"
        
        def log(msg: str):
            from datetime import datetime
            with open(debug_log, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().isoformat()}] {msg}\n")
            print(f"MATCH_ENGINE: {msg}")

        log(f"--- START MATCHING for Job {job_id} ---")
        try:
            # 1. Semantic Similarity Score
            log("Step 1: Computing Semantic Similarity...")
            semantic_score = await self._semantic_similarity(
                resume_text=self._resume_to_text(parsed_resume),
                jd_text=job_description,
                job_id=job_id,
            )
            log(f"Semantic Score: {semantic_score}")
        except Exception as e:
            log(f"Semantic Similarity ERROR: {e}")
            logger.warning(f"Semantic similarity failed, using fallback: {e}")
            semantic_score = 0.5
        
        # 2. Skills Overlap Score
        log("Step 2: Computing Skills Overlap...")
        skills_score = self._compute_skills_overlap(
            candidate_skills=[s.lower() for s in parsed_resume.skills],
            required_skills=[s.lower() for s in required_skills],
        )
        log(f"Skills Score: {skills_score}")
        
        # 3. Experience Score
        log("Step 3: Computing Experience Score...")
        experience_score = self._compute_experience_score(
            candidate_years=parsed_resume.total_years_experience,
            required_min=min_experience,
        )
        log(f"Experience Score: {experience_score}")
        
        # 4. Education Score (simplified)
        education_score = 1.0 if parsed_resume.education else 0.5
        log(f"Education Score: {education_score}")
        
        # Weighted combination
        final_score = (
            semantic_score * SCORE_WEIGHTS["semantic_similarity"] +
            skills_score * SCORE_WEIGHTS["skills_overlap"] +
            experience_score * SCORE_WEIGHTS["experience_match"] +
            education_score * SCORE_WEIGHTS["education_match"]
        )
        
        log(f"--- FINAL WEIGHTED SCORE: {final_score} ---")
        
        logger.info(
            f"Match scores — Semantic: {semantic_score:.2f}, "
            f"Skills: {skills_score:.2f}, Exp: {experience_score:.2f}, "
            f"Education: {education_score:.2f} → Final: {final_score:.2f}"
        )
        
        return round(min(final_score, 1.0), 4)

    async def _semantic_similarity(
        self, resume_text: str, jd_text: str, job_id: str
    ) -> float:
        """Compute cosine similarity between resume and JD embeddings."""
        redis = await get_redis()
        cache_key = f"jd_embedding:{job_id}"
        
        jd_embedding = None
        
        # Try to get cached JD embedding (only if Redis is available)
        if redis is not None:
            try:
                cached = await redis.get(cache_key)
                if cached:
                    jd_embedding = np.array(json.loads(cached))
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        if jd_embedding is None:
            # Generate JD embedding
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=jd_text[:8000],
            )
            jd_embedding = np.array(response.data[0].embedding)
            
            # Cache it (only if Redis is available)
            if redis is not None:
                try:
                    await redis.set(cache_key, json.dumps(jd_embedding.tolist()), ex=86400)
                except Exception:
                    pass  # Caching failure is non-fatal
        
        # Generate resume embedding
        resume_response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=resume_text[:8000],
        )
        resume_embedding = np.array(resume_response.data[0].embedding)
        
        # Cosine similarity
        similarity = np.dot(resume_embedding, jd_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(jd_embedding)
        )
        
        return float(np.clip(similarity, 0, 1))

    def _compute_skills_overlap(
        self, candidate_skills: List[str], required_skills: List[str]
    ) -> float:
        """Compute skill overlap score."""
        if not required_skills:
            return 0.8
        
        matched = 0
        for req_skill in required_skills:
            for cand_skill in candidate_skills:
                if req_skill in cand_skill or cand_skill in req_skill:
                    matched += 1
                    break
        
        return matched / len(required_skills)

    def _compute_experience_score(
        self, candidate_years: float, required_min: int
    ) -> float:
        """Score experience alignment."""
        if required_min == 0:
            return 1.0
        
        if candidate_years >= required_min:
            return min(1.0, 0.8 + (candidate_years - required_min) * 0.05)
        else:
            return candidate_years / required_min

    def _resume_to_text(self, resume: ParsedResumeData) -> str:
        """Convert parsed resume to searchable text."""
        parts = [
            f"Skills: {', '.join(resume.skills)}",
            f"Total Experience: {resume.total_years_experience} years",
        ]
        
        if resume.summary:
            parts.append(f"Summary: {resume.summary}")
        
        for exp in resume.experience[:5]:
            parts.append(
                f"{exp.get('title', '')} at {exp.get('company', '')} — "
                f"{exp.get('description', '')}"
            )
        
        for edu in resume.education:
            parts.append(
                f"{edu.get('degree', '')} in {edu.get('field', '')} "
                f"from {edu.get('institution', '')}"
            )
        
        if resume.certifications:
            parts.append(f"Certifications: {', '.join(resume.certifications)}")
        
        return "\n".join(parts)


_engine_instance = None


def get_matching_engine() -> MatchingEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MatchingEngine()
    return _engine_instance
