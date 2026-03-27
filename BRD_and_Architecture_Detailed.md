# Comprehensive Business Requirements Document (BRD) & System Architecture

## 1. Project Overview
**Name:** AI Interviewer & Skill Assessment Platform (Video + Voice)
**Objective:** To build an end-to-end automated recruitment platform that handles candidate onboarding, resume parsing, JD matching, scheduling, and conducts fully autonomous, multi-round AI-driven video and voice interviews. The platform will also generate comprehensive skill assessments and conduct salary negotiations.
**Role:** Chief Architect & Senior Developer

---

## 2. Detailed System Behavior & Workflows

### 2.1. Candidate Onboarding & Resume Parsing
*   **Action:** Candidate visits the platform and applies for a specific job.
*   **Data Collection:** Candidate fills in basic details (Name, Email, Phone Number) and uploads a resume (PDF/DOCX).
*   **Processing:**
    *   The system uses an AI-based parser (LangChain + OpenAI) to extract structured data: Education, Experience, Skills, Projects, Certifications.
    *   The extracted data is embedded and semantically matched against the Job Description (JD) using vector search (Supabase pgvector).
*   **Decision:** If the match score > threshold (e.g., 75%), the system automatically triggers an email invite to the candidate.

### 2.2. Interview Scheduling
*   **Action:** Candidate clicks the link in the email invite.
*   **Process:**
    *   Candidate is presented with available time slots (integrated with Recruiter/Company Calendar).
    *   Candidate selects a slot.
    *   System generates a unique interview room link and sends calendar invites to both candidate and recruiter.

### 2.3. Multi-Round AI Interview (Video + Voice)
*   **Action:** Candidate joins the interview link at the scheduled time.
*   **Technology:** WebRTC for real-time video/audio streaming. OpenAI Realtime API (Speech-to-Speech) for ultra-low latency conversational AI.
*   **Rounds:**
    1.  **Introduction Round:** AI introduces itself, verifies candidate identity, asks basic background questions, and checks cultural fit.
    2.  **Technical Round:** AI dynamically generates technical questions based on the candidate's parsed resume and the specific JD. It can ask follow-up questions based on the candidate's real-time answers.
    3.  **HR / Behavioural Round:** AI asks scenario-based questions (STAR method) to evaluate soft skills, leadership, and conflict resolution.
    4.  **Salary Negotiation:** AI discusses expected CTC, compares it with the company's budget for the role, and negotiates within predefined limits.

### 2.4. Assessment & Reporting
*   **Action:** Once the interview concludes, the system processes the entire transcript and video analysis.
*   **Output:** Generates a detailed scorecard for the recruiter:
    *   **Behavioural Score:** Confidence, communication, tone.
    *   **Technical Score:** Accuracy of technical answers, depth of knowledge.
    *   **Core Skills Score:** Alignment with JD requirements.
    *   **Final Verdict:** Hire / No Hire recommendation with negotiated salary details.

---

## 3. Technology Stack & Infrastructure

### 3.1. Frontend (Client Layer)
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Real-time:** WebRTC / Socket.io client for streaming audio/video.

### 3.2. Backend (API & Orchestration Layer)
*   **Framework:** Python FastAPI (Chosen for high performance, async support, and native Python AI ecosystem compatibility).
*   **AI Integrations:**
    *   **LLM:** OpenAI GPT-4o (for parsing, matching, assessment generation).
    *   **Voice:** OpenAI Realtime API (Speech-to-Speech) or Whisper (STT) + GPT-4o + TTS.
*   **Task Queue:** Celery with Redis broker (for background tasks like heavy PDF parsing and final report generation).

### 3.3. Database & Storage
*   **Primary Database:** Supabase (PostgreSQL).
*   **Vector DB:** Supabase pgvector (for Resume vs JD semantic matching).
*   **Authentication:** Supabase Auth.
*   **File Storage:** Supabase Storage or AWS S3 (for Resumes and Interview Recordings).

### 3.4. Infrastructure & Caching (AWS)
*   **Compute:** AWS ECS (Elastic Container Service) with Fargate or AWS EKS for scalable backend containers.
*   **Caching:** AWS ElastiCache (Redis) for caching JDs, active interview session states, and rate limiting.
*   **CDN / Static Hosting:** AWS CloudFront / Vercel (for Next.js frontend).
*   **Email:** AWS SES (Simple Email Service).

---

## 4. Database Schema Design (High-Level)

*   **Users Table:** `id`, `role` (candidate/recruiter), `name`, `email`, `phone`, `created_at`
*   **Jobs Table:** `id`, `title`, `description`, `requirements_embedding` (vector), `budget_min`, `budget_max`, `created_by`
*   **Applications Table:** `id`, `job_id`, `candidate_id`, `resume_url`, `parsed_data` (JSONB), `match_score`, `status` (applied, invited, scheduled, interviewed, rejected, hired)
*   **Interviews Table:** `id`, `application_id`, `scheduled_at`, `status`, `unique_link`
*   **Assessments Table:** `id`, `interview_id`, `intro_score`, `tech_score`, `hr_score`, `negotiated_salary`, `detailed_report` (JSONB)

---

## 5. API Endpoints (FastAPI)

### 5.1. Candidate & Application
*   `POST /api/v1/applications/apply` - Upload resume, parse, match, and return status.
*   `GET /api/v1/applications/{id}/status` - Check application status.

### 5.2. Scheduling
*   `GET /api/v1/schedule/slots` - Get available slots.
*   `POST /api/v1/schedule/book` - Book a slot and send calendar invites.

### 5.3. Interview (Real-time)
*   `WebSocket /ws/v1/interview/{interview_id}` - Real-time bidirectional stream for audio chunks and interview state management.

### 5.4. Recruiter Dashboard
*   `POST /api/v1/jobs` - Create a new job posting.
*   `GET /api/v1/jobs/{job_id}/candidates` - List candidates and their match scores.
*   `GET /api/v1/assessments/{interview_id}` - Fetch the detailed AI-generated scorecard.

---

## 6. Detailed Project Skeleton

The project is structured as a monorepo for ease of development, but can be split into separate repositories for production.

```text
ai-interviewer-platform/
│
├── frontend/                              # Next.js Application
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                           # Next.js App Router
│   │   │   ├── (auth)/                    # Authentication routes (login/register)
│   │   │   ├── candidate/                 # Candidate portal
│   │   │   │   ├── apply/[jobId]/         # Job application page
│   │   │   │   ├── schedule/[appId]/      # Slot booking page
│   │   │   │   └── room/[interviewId]/    # WebRTC Interview Room
│   │   │   └── recruiter/                 # Recruiter portal
│   │   │       ├── jobs/                  # Job management
│   │   │       └── candidates/[jobId]/    # Candidate review & assessments
│   │   ├── components/
│   │   │   ├── ui/                        # Reusable Tailwind components (Buttons, Modals)
│   │   │   ├── interview/                 # Video player, Audio visualizer, Chat fallback
│   │   │   └── dashboard/                 # Assessment charts, Data tables
│   │   ├── hooks/
│   │   │   ├── useWebRTC.ts               # Custom hook for WebRTC connection
│   │   │   └── useAudioStream.ts          # Hook for handling microphone/speaker
│   │   ├── lib/
│   │   │   └── supabaseClient.ts          # Supabase initialization
│   │   ├── services/
│   │   │   └── api.ts                     # Axios/Fetch wrappers for backend calls
│   │   └── types/                         # Shared TypeScript interfaces
│
├── backend/                               # Python FastAPI Backend
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                        # FastAPI entry point & middleware setup
│   │   ├── core/
│   │   │   ├── config.py                  # Environment variables (Pydantic BaseSettings)
│   │   │   ├── security.py                # JWT validation
│   │   │   └── database.py                # Supabase/PostgreSQL connection pool
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── jobs.py
│   │   │       │   ├── applications.py    # Resume parsing & matching logic trigger
│   │   │       │   ├── schedule.py
│   │   │       │   ├── interview_ws.py    # WebSocket handler for Realtime AI
│   │   │       │   └── assessment.py
│   │   ├── models/                        # SQLAlchemy ORM Models
│   │   ├── schemas/                       # Pydantic schemas for Request/Response validation
│   │   ├── services/                      # Core Business Logic
│   │   │   ├── resume_parser.py           # LangChain + OpenAI PDF extraction
│   │   │   ├── matching_engine.py         # Vector embeddings & cosine similarity
│   │   │   ├── ai_interviewer.py          # OpenAI Realtime API orchestration & state machine
│   │   │   ├── assessment_generator.py    # Post-interview LLM analysis
│   │   │   └── email_service.py           # AWS SES integration
│   │   ├── crud/                          # Database CRUD operations
│   │   └── utils/                         # Helper functions (logging, formatting)
│
├── infra/                                 # Infrastructure as Code
│   ├── docker-compose.yml                 # Local dev setup (Backend, Redis, PostgreSQL)
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── vpc.tf
│   │   ├── ecs.tf                         # Fargate cluster for FastAPI
│   │   ├── elasticache.tf                 # Redis for caching
│   │   └── s3.tf                          # Storage buckets
│
└── README.md                              # Project setup and run instructions
```

---

## 7. Caching Strategy (Redis / ElastiCache)
1.  **Job Descriptions:** JDs are read-heavy. Cache them in Redis to speed up the semantic matching process when multiple candidates apply simultaneously.
2.  **Interview State Machine:** During the live interview, the AI needs to know the current round (Intro -> Tech -> HR), previous questions asked, and candidate's parsed resume. This state is highly mutable and requires low latency, making Redis the perfect store for active interview sessions.
3.  **Rate Limiting:** Protect public endpoints (like `/apply`) from spam using Redis-based rate limiting.

## 8. Development Phases & Milestones
*   **Phase 1: Foundation (Weeks 1-2)**
    *   Initialize monorepo, setup Supabase, build basic UI components.
    *   Develop Job Posting and Candidate Application workflows.
*   **Phase 2: AI Parsing & Matching (Weeks 3-4)**
    *   Implement Python backend for parsing PDFs.
    *   Setup pgvector and implement the JD matching algorithm.
    *   Integrate Email sending for invites.
*   **Phase 3: Real-time Interview Engine (Weeks 5-8)**
    *   *Critical Path:* Implement WebRTC on frontend.
    *   Build FastAPI WebSocket endpoints.
    *   Integrate OpenAI Realtime API.
    *   Develop the prompt state machine to handle transitions between Intro, Tech, HR, and Salary rounds.
*   **Phase 4: Assessment & Deployment (Weeks 9-10)**
    *   Build the Assessment Generator service.
    *   Create Recruiter dashboards to view scorecards.
    *   Write Terraform scripts and deploy to AWS.