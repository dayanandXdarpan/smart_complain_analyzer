from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ComplaintSubmit(BaseModel):
    title: str
    description: str
    email: EmailStr
    suggested_category: Optional[str] = None

class VerifyOTP(BaseModel):
    ticket_id: str
    otp: str

class TicketResponse(BaseModel):
    id: str
    title: str
    status: str
    priority: Optional[str] = None
    ai_confidence: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
