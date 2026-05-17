# Smart Complaint Analyzer PRD

## Vision
To transform chaotic, manual grievance management into an automated, AI-driven intelligence system using agentic workflows.

## Version
1.0 (MVP + AI-Core)

## 1. Problem Statement
Current grievance systems in colleges, societies, and government offices are plagued by manual sorting errors, slow response times, and a total lack of accountability. There is no automated way to prioritize urgent issues or prevent duplicate submissions, leading to administrative burnout and user frustration.

## 2. Solution Overview
A multi-tenant SaaS platform where users can submit complaints with zero friction. The system uses a LangGraph-powered multi-agent engine to analyze, categorize, and route issues to the correct department automatically. It features a deferred authentication model (OTP after submission) to maximize user engagement.

## 3. User Personas
*   **Deepu (The Complainant):** Needs a fast way to report a campus issue without a complex signup process.
*   **Department Head:** Needs to receive only relevant, categorized issues with a pre-assigned priority.
*   **System Admin:** Needs an overview of system performance, word-count analytics on queries, and a way to manually intervene when the AI is uncertain.

## 4. Functional Requirements

### 4.1 Frictionless Submission Flow (User Side)
*   **Public Form:** Fields for Title, Description, Category (suggested), and Email.
*   **Deferred Verification:** Upon clicking "Submit," the user is redirected to an OTP verification page. The complaint is held in a temporary state.
*   **Verification & Commitment:** Once the 6-digit OTP is verified, the user account is created/confirmed, and the ticket is officially injected into the processing queue.
*   **Tracking:** User receives an automated email with a Ticket ID and a link to track the real-time status.

### 4.2 The AI Intelligence Engine (LangGraph & LangChain)
The core logic utilizes a multi-agent workflow to process every verified ticket:
*   **Classification Agent:** Uses LLMs to identify the specific field of the complaint (e.g., Infrastructure, IT, Academic).
*   **Priority Agent:** Analyzes sentiment and urgency (e.g., a "Water Leak" near electrical equipment is auto-flagged as 'Urgent').
*   **Duplicate Detection Agent:** Uses vector similarity (ChromaDB) to check if a similar complaint was recently filed to prevent redundant work.
*   **Routing Agent:** Maps the classification to a specific department email or dashboard.

### 4.3 Admin Dashboard & Analytics
*   **Pending Queue:** A workspace for the Admin to handle "low-confidence" AI routings.
*   **Manual Override:** Option to forward any complaint to a specific Gmail address with one click.
*   **Query Analytics:** A visual breakdown of word counts across queries to identify trending issues (e.g., frequent mentions of "Wi-Fi" or "Cafeteria").
*   **Priority Heatmap:** A view showing how many "High" vs "Low" priority tickets are active.

## 5. Professional System Design
The system is built on a decoupled, asynchronous architecture to ensure the UI remains fast while the AI agents perform complex reasoning.

### 5.1 The Logic Flow
*   **Frontend (React 19 + Vite):** Captures user data and handles the OTP UI logic.
*   **API Layer (FastAPI):** Manages the "Soft Submit" and verifies the OTP against Redis (where codes are stored with a 5-minute expiry).
*   **Task Queue (Celery + Redis):** Once verified, the ticket is pushed to Celery. This prevents the user from waiting while the AI "thinks."
*   **Agentic Workflow (LangGraph):** The Celery worker invokes the LangGraph state machine.

### 5.2 Data Modeling (Prisma & PostgreSQL)
*   **Tickets:** Stores title, description, status, and AI-generated metadata (sentiment, reasoning).
*   **Analytics:** Stores word frequency and priority trends for the admin dashboard.
*   **Organizations:** Supports multi-tenancy (separate data for different colleges/societies).

## 6. UI/UX Strategy
To achieve a "Best-in-Class" professional feel:
*   **Design System:** Use Shadcn UI for a clean, modern, and accessible interface.
*   **Layout:** A sidebar-based dashboard for Admins with "Glassmorphism" touches and subtle animations using Framer Motion.
*   **State Feedback:** Real-time "toast" notifications for every action (e.g., "AI is analyzing your complaint...", "Ticket successfully routed to IT").
*   **Clarity:** Use high-contrast typography and clear status badges (e.g., Queued, AI Processing, Resolved).

## 7. Technical Stack
*   **Frontend:** React 19, Vite, Tailwind CSS, Shadcn UI, TanStack Query.
*   **Backend:** FastAPI (Python), Prisma ORM (Python client).
*   **AI Engine:** LangGraph, LangChain, OpenAI/Gemini Pro.
*   **Database:** PostgreSQL (Primary), Redis (OTP & Queue), ChromaDB (Vector Search).
*   **Infrastructure:** Dockerized services for horizontal scaling.

## 8. Success Metrics
*   **Automation Rate:** % of tickets routed without admin intervention.
*   **Resolution Time:** Average time from submission to "Resolved" status.
*   **User Friction:** % of users who complete the OTP step after filling the form.
*   **System Accuracy:** Admin override frequency (the goal is <5%).
