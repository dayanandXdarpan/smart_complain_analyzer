"""Ticket Activities API — Full audit trail + inbound reply simulation."""

from fastapi import APIRouter, HTTPException
from backend.database import get_supabase_client
from backend.schemas.workflow import TicketReply
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tickets/{ticket_id}/activities")
def get_ticket_activities(ticket_id: str):
    """Get the full activity timeline for a ticket."""
    supabase = get_supabase_client()
    try:
        res = supabase.table("ticket_activities").select("*").eq(
            "ticket_id", ticket_id
        ).order("created_at", desc=False).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error fetching activities for ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities")


@router.post("/tickets/{ticket_id}/reply")
def reply_to_ticket(ticket_id: str, reply: TicketReply):
    """
    Simulate an inbound email reply that updates a ticket.
    In production, this would be called by a SendGrid/Mailgun inbound webhook.
    """
    supabase = get_supabase_client()

    # Verify ticket exists
    ticket_res = supabase.table("tickets").select("id, status").eq("id", ticket_id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Log the reply activity
    try:
        supabase.table("ticket_activities").insert({
            "ticket_id": ticket_id,
            "activity_type": "email_reply",
            "actor": reply.sender_email,
            "details": json.dumps({
                "message": reply.message,
                "new_status": reply.new_status,
            }),
        }).execute()
    except Exception as e:
        logger.error(f"Error logging reply activity: {e}")

    # Update ticket status if provided
    update_data = {}
    if reply.new_status:
        update_data["status"] = reply.new_status
    
    # Auto-detect status keywords in message
    msg_upper = reply.message.upper()
    if not reply.new_status:
        if "RESOLVED" in msg_upper:
            update_data["status"] = "RESOLVED"
        elif "IN PROGRESS" in msg_upper:
            update_data["status"] = "IN_PROGRESS"
        elif "ESCALATED" in msg_upper:
            update_data["status"] = "ESCALATED"

    if update_data:
        try:
            supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
            # Log status change
            supabase.table("ticket_activities").insert({
                "ticket_id": ticket_id,
                "activity_type": "status_change",
                "actor": reply.sender_email,
                "details": json.dumps(update_data),
            }).execute()
        except Exception as e:
            logger.error(f"Error updating ticket: {e}")

    return {"message": "Reply processed", "status_updated": bool(update_data)}
