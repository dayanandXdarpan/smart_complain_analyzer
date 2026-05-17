"""Email Accounts CRUD API — Admin manages SMTP credentials."""

from fastapi import APIRouter, HTTPException
from backend.database import get_supabase_client
from backend.schemas.workflow import EmailAccountCreate, EmailAccountUpdate
from backend.agents.email_dispatcher import send_test_email
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/email-accounts")
def list_email_accounts():
    supabase = get_supabase_client()
    try:
        res = supabase.table("email_accounts").select(
            "id, label, email_address, smtp_server, smtp_port, is_active, created_at"
        ).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error listing email accounts: {e}")
        raise HTTPException(status_code=500, detail="Failed to list email accounts")


@router.post("/email-accounts")
def create_email_account(payload: EmailAccountCreate):
    supabase = get_supabase_client()
    try:
        data = payload.model_dump()
        res = supabase.table("email_accounts").insert(data).execute()
        # Return without password
        result = res.data[0]
        result.pop("smtp_password", None)
        return result
    except Exception as e:
        logger.error(f"Error creating email account: {e}")
        raise HTTPException(status_code=500, detail="Failed to create email account")


@router.put("/email-accounts/{account_id}")
def update_email_account(account_id: str, payload: EmailAccountUpdate):
    supabase = get_supabase_client()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        res = supabase.table("email_accounts").update(update_data).eq("id", account_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Email account not found")
        result = res.data[0]
        result.pop("smtp_password", None)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating email account: {e}")
        raise HTTPException(status_code=500, detail="Failed to update email account")


@router.delete("/email-accounts/{account_id}")
def delete_email_account(account_id: str):
    supabase = get_supabase_client()
    try:
        supabase.table("email_accounts").delete().eq("id", account_id).execute()
        return {"message": "Email account deleted"}
    except Exception as e:
        logger.error(f"Error deleting email account: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete email account")


@router.post("/email-accounts/{account_id}/test")
def test_email_account(account_id: str):
    """Send a test email to verify SMTP credentials."""
    supabase = get_supabase_client()
    res = supabase.table("email_accounts").select("*").eq("id", account_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Email account not found")

    config = res.data[0]
    success = send_test_email(config)
    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email. Check credentials.")
