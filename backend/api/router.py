from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import random
import uuid
import redis
from backend.core.config import settings
from backend.services.email_service import send_otp_email
from backend.database import get_supabase_client
from backend.schemas.ticket import ComplaintSubmit, VerifyOTP

router = APIRouter()
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("/complaints/soft-submit")
def soft_submit_complaint(complaint: ComplaintSubmit):
    # 1. Generate Ticket ID (using UUID for DB compatibility)
    ticket_id = str(uuid.uuid4())
    
    # 2. Save soft-submit state to Redis instead of DB to prevent junk rows
    # Storing complete payload in redis hash
    payload = {
        "title": complaint.title,
        "description": complaint.description,
        "email": complaint.email,
        "suggested_category": complaint.suggested_category or ""
    }
    redis_client.hset(f"ticket_payload:{ticket_id}", mapping=payload)
    redis_client.expire(f"ticket_payload:{ticket_id}", 300) # 5 min expiry
    
    # 3. Generate OTP
    otp = str(random.randint(100000, 999999))
    redis_client.setex(f"otp:{ticket_id}", 300, otp)
    
    # 4. Send Email
    email_sent = send_otp_email(complaint.email, otp)
    if not email_sent:
        # For development without email setup, we print it
        print(f"DEVELOPMENT OTP for {complaint.email}: {otp}")
        
    return {"message": "OTP sent successfully", "ticket_id": ticket_id}

@router.post("/auth/verify-otp")
def verify_otp(verify_data: VerifyOTP):
    ticket_id = verify_data.ticket_id
    stored_otp = redis_client.get(f"otp:{ticket_id}")
    
    if not stored_otp or stored_otp != verify_data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Get payload
    payload = redis_client.hgetall(f"ticket_payload:{ticket_id}")
    if not payload:
        raise HTTPException(status_code=400, detail="Ticket data expired")
        
    supabase = get_supabase_client()
    
    # Check if user exists, else create
    email = payload['email']
    user_res = supabase.table('users').select('*').eq('email', email).execute()
    
    if user_res.data and len(user_res.data) > 0:
        user_id = user_res.data[0]['id']
    else:
        new_user = supabase.table('users').insert({"email": email}).execute()
        user_id = new_user.data[0]['id']
        
    # Create ticket in DB
    ticket_data = {
        "id": ticket_id,
        "title": payload['title'],
        "description": payload['description'],
        "status": "QUEUED",
        "user_id": user_id
    }
    
    new_ticket = supabase.table('tickets').insert(ticket_data).execute()
    
    # Clean up Redis
    redis_client.delete(f"otp:{ticket_id}")
    redis_client.delete(f"ticket_payload:{ticket_id}")
    
    # Trigger Celery Task
    from backend.worker import process_complaint_task
    process_complaint_task.delay(ticket_id)
    
    return {"message": "Verified successfully", "ticket_id": ticket_id, "status": "QUEUED"}

@router.get("/tickets/{ticket_id}")
def get_ticket_status(ticket_id: str):
    supabase = get_supabase_client()
    res = supabase.table('tickets').select(
        '*, users(email), departments(name, email)'
    ).eq('id', ticket_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return res.data[0]

