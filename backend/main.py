from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Smart Complaint Analyzer — AI-Powered Orchestrator API"
    )

    # CORS settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, restrict this to the frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Public & Auth routes ──
    from backend.api.router import router as api_router
    app.include_router(api_router, prefix="/api", tags=["api"])

    # ── Admin routes ──
    from backend.api.admin import router as admin_router
    app.include_router(admin_router, prefix="/api/admin", tags=["admin"])

    # ── Workflow management ──
    from backend.api.workflows import router as workflows_router
    app.include_router(workflows_router, prefix="/api/admin", tags=["workflows"])

    # ── Email accounts ──
    from backend.api.email_accounts import router as email_accounts_router
    app.include_router(email_accounts_router, prefix="/api/admin", tags=["email-accounts"])

    # ── Agent configs ──
    from backend.api.agent_configs import router as agent_configs_router
    app.include_router(agent_configs_router, prefix="/api/admin", tags=["agent-configs"])

    # ── Ticket activities ──
    from backend.api.ticket_activities import router as activities_router
    app.include_router(activities_router, prefix="/api", tags=["activities"])

    @app.get("/health")
    def health_check():
        return {"status": "ok", "version": settings.VERSION}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
