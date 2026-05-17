from fastapi import APIRouter, HTTPException
from backend.database import get_supabase_client
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tickets")
def get_all_tickets():
    supabase = get_supabase_client()
    try:
        res = supabase.table('tickets').select(
            '*, users(email), departments(name, email)'
        ).order('created_at', desc=True).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching tickets: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tickets")


@router.get("/tickets/{ticket_id}")
def get_ticket_detail(ticket_id: str):
    """Get full ticket detail including AI reasoning and activity."""
    supabase = get_supabase_client()
    try:
        # Get ticket with relations
        ticket_res = supabase.table('tickets').select(
            '*, users(email), departments(name, email)'
        ).eq('id', ticket_id).execute()
        
        if not ticket_res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket = ticket_res.data[0]
        
        # Get activities
        activities_res = supabase.table('ticket_activities').select('*').eq(
            'ticket_id', ticket_id
        ).order('created_at', desc=False).execute()
        
        ticket['activities'] = activities_res.data if activities_res.data else []
        
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ticket detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ticket")


@router.get("/analytics")
def get_analytics():
    supabase = get_supabase_client()
    try:
        res = supabase.table('tickets').select('status, priority, department_id').execute()
        tickets = res.data
        
        analytics = {
            "total": len(tickets),
            "pending": len([t for t in tickets if t['status'] in ['PENDING_OTP', 'QUEUED']]),
            "processing": len([t for t in tickets if t['status'] == 'AI_PROCESSING']),
            "routed": len([t for t in tickets if t['status'] == 'ROUTED']),
            "manual_review": len([t for t in tickets if t['status'] == 'MANUAL_REVIEW']),
            "resolved": len([t for t in tickets if t['status'] == 'RESOLVED']),
            # Priority distribution
            "priority_distribution": {
                "LOW": len([t for t in tickets if t.get('priority') == 'LOW']),
                "MEDIUM": len([t for t in tickets if t.get('priority') == 'MEDIUM']),
                "HIGH": len([t for t in tickets if t.get('priority') == 'HIGH']),
                "URGENT": len([t for t in tickets if t.get('priority') == 'URGENT']),
            },
        }
        return analytics
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


@router.get("/departments")
def list_departments():
    """List all departments."""
    supabase = get_supabase_client()
    try:
        res = supabase.table('departments').select('*').order('name').execute()
        return res.data
    except Exception as e:
        logger.error(f"Error listing departments: {e}")
        raise HTTPException(status_code=500, detail="Failed to list departments")


class DepartmentCreate(BaseModel):
    name: str
    email: str
    description: Optional[str] = None
    auto_assign: bool = True


@router.post("/departments")
def create_department(payload: DepartmentCreate):
    supabase = get_supabase_client()
    try:
        res = supabase.table('departments').insert(payload.model_dump()).execute()
        return res.data[0]
    except Exception as e:
        logger.error(f"Error creating department: {e}")
        raise HTTPException(status_code=500, detail="Failed to create department")


@router.delete("/departments/{dept_id}")
def delete_department(dept_id: str):
    supabase = get_supabase_client()
    try:
        supabase.table('departments').delete().eq('id', dept_id).execute()
        return {"message": "Department deleted"}
    except Exception as e:
        logger.error(f"Error deleting department: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete department")


class RouteOverride(BaseModel):
    department_id: str
    status: str = "ROUTED"


@router.post("/tickets/{ticket_id}/route")
def manual_route_ticket(ticket_id: str, payload: RouteOverride):
    supabase = get_supabase_client()
    try:
        res = supabase.table('tickets').update({
            "department_id": payload.department_id,
            "status": payload.status
        }).eq('id', ticket_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Log the manual route
        supabase.table("ticket_activities").insert({
            "ticket_id": ticket_id,
            "activity_type": "manual_route",
            "actor": "Admin",
            "details": {
                "department_id": payload.department_id,
                "status": payload.status,
            },
        }).execute()
            
        return {"message": "Ticket routed successfully", "ticket": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error overriding route: {e}")
        raise HTTPException(status_code=500, detail="Failed to route ticket")


class StatusUpdate(BaseModel):
    status: str  # RESOLVED | IN_PROGRESS | ESCALATED


@router.patch("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, payload: StatusUpdate):
    """Update ticket status (resolve, escalate, etc.)."""
    supabase = get_supabase_client()
    try:
        res = supabase.table('tickets').update({
            "status": payload.status
        }).eq('id', ticket_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Log the status change
        supabase.table("ticket_activities").insert({
            "ticket_id": ticket_id,
            "activity_type": "status_change",
            "actor": "Admin",
            "details": {"new_status": payload.status},
        }).execute()

        return {"message": f"Ticket status updated to {payload.status}", "ticket": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating ticket status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update ticket status")

