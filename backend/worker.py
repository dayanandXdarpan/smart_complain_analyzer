"""
Celery Worker — Processes complaint tickets through the dynamic orchestrator.
"""

from celery import Celery
from backend.core.config import settings
from backend.database import get_supabase_client
from backend.agents.orchestrator import execute_workflow
import json
import logging

logger = logging.getLogger(__name__)

celery_app = Celery(
    "smart_complain_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task(name="process_complaint_task")
def process_complaint_task(ticket_id: str):
    """
    Main task: process a ticket through the dynamic AI orchestrator.
    
    Flow:
    1. Fetch ticket from DB
    2. Update status to AI_PROCESSING
    3. Execute the active workflow via the orchestrator
    4. Update ticket with AI results (department, priority, sentiment, etc.)
    5. Log all activities
    """
    logger.info(f"🚀 Starting AI processing for ticket: {ticket_id}")
    supabase = get_supabase_client()
    
    try:
        # Fetch ticket details
        res = supabase.table('tickets').select('*').eq('id', ticket_id).execute()
        if not res.data:
            logger.error(f"Ticket {ticket_id} not found")
            return {"status": "error", "message": "Ticket not found"}
            
        ticket_data = res.data[0]
        
        # Update status to AI Processing
        supabase.table('tickets').update({"status": "AI_PROCESSING"}).eq('id', ticket_id).execute()
        
        # Log processing start
        try:
            supabase.table("ticket_activities").insert({
                "ticket_id": ticket_id,
                "activity_type": "processing_started",
                "actor": "System",
                "details": json.dumps({"message": "AI orchestrator started processing"}),
            }).execute()
        except Exception:
            pass
        
        # ── Execute Dynamic Orchestrator ──
        final_state = execute_workflow(ticket_data)
        
        # Find department ID based on classification
        dept_name = final_state.get('department', '')
        dept_id = final_state.get('department_id')
        if not dept_id and dept_name:
            dept_res = supabase.table('departments').select('id').eq('name', dept_name).execute()
            if dept_res.data:
                dept_id = dept_res.data[0]['id']
        
        # Update DB with full AI results
        update_data = {
            "status": final_state.get('status', 'MANUAL_REVIEW'),
            "priority": final_state.get('priority'),
            "sentiment": final_state.get('sentiment'),
            "ai_confidence": final_state.get('confidence'),
            "ai_reasoning": final_state.get('ai_reasoning', ''),
            "department_id": dept_id,
            "routed_email": final_state.get('routed_email'),
            "email_thread_id": final_state.get('email_thread_id'),
            "workflow_id": final_state.get('workflow_id'),
        }
        
        supabase.table('tickets').update(update_data).eq('id', ticket_id).execute()
        
        # Log completion
        try:
            supabase.table("ticket_activities").insert({
                "ticket_id": ticket_id,
                "activity_type": "processing_completed",
                "actor": "AI Agent",
                "details": json.dumps({
                    "department": final_state.get('department'),
                    "priority": final_state.get('priority'),
                    "confidence": final_state.get('confidence'),
                    "status": final_state.get('status'),
                    "routed_to": final_state.get('routed_email'),
                }),
            }).execute()
        except Exception:
            pass
        
        logger.info(f"✅ Successfully processed ticket {ticket_id}: status={update_data['status']}")
        return {"status": "success", "state": {k: str(v) for k, v in final_state.items()}}
        
    except Exception as e:
        logger.error(f"❌ Error processing ticket {ticket_id}: {e}")
        # Revert status on failure
        supabase.table('tickets').update({"status": "MANUAL_REVIEW"}).eq('id', ticket_id).execute()
        
        # Log failure
        try:
            supabase.table("ticket_activities").insert({
                "ticket_id": ticket_id,
                "activity_type": "processing_failed",
                "actor": "System",
                "details": json.dumps({"error": str(e)}),
            }).execute()
        except Exception:
            pass
        
        return {"status": "error", "message": str(e)}
