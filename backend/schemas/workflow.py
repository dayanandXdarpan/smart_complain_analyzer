from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime


# ── Workflow ────────────────────────────────────────────────

class WorkflowNodeData(BaseModel):
    label: str
    # AI Agent node fields
    agentConfigName: Optional[str] = None
    outputField: Optional[str] = None
    # Email node fields
    emailTarget: Optional[str] = None  # 'department' | 'admin' | specific email
    subject: Optional[str] = None
    bodyTemplate: Optional[str] = None
    # Condition node fields
    field: Optional[str] = None
    operator: Optional[str] = None  # '>=', '<=', '==', '!='
    value: Optional[str] = None
    trueLabel: Optional[str] = None
    falseLabel: Optional[str] = None

class WorkflowNode(BaseModel):
    id: str
    type: str  # 'input' | 'aiAgent' | 'email' | 'condition'
    position: Dict[str, float]
    data: WorkflowNodeData

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None

class WorkflowGraph(BaseModel):
    nodes: List[WorkflowNode] = []
    edges: List[WorkflowEdge] = []

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph_data: WorkflowGraph = WorkflowGraph()

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    graph_data: Optional[WorkflowGraph] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    graph_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


# ── Email Account ───────────────────────────────────────────

class EmailAccountCreate(BaseModel):
    label: str
    email_address: EmailStr
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str

class EmailAccountUpdate(BaseModel):
    label: Optional[str] = None
    email_address: Optional[EmailStr] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    is_active: Optional[bool] = None

class EmailAccountResponse(BaseModel):
    id: str
    label: str
    email_address: str
    smtp_server: str
    smtp_port: int
    is_active: bool
    created_at: datetime


# ── Agent Config ────────────────────────────────────────────

class AgentConfigCreate(BaseModel):
    name: str
    system_prompt: str
    model_provider: str = "gemini"
    model_name: str = "gemini-pro"
    temperature: float = 0.0
    api_key_ref: Optional[str] = None

class AgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    system_prompt: Optional[str] = None
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    api_key_ref: Optional[str] = None

class AgentConfigResponse(BaseModel):
    id: str
    name: str
    system_prompt: str
    model_provider: str
    model_name: str
    temperature: float
    created_at: datetime


# ── Ticket Activity ─────────────────────────────────────────

class TicketActivityCreate(BaseModel):
    activity_type: str
    actor: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class TicketActivityResponse(BaseModel):
    id: str
    ticket_id: str
    activity_type: str
    actor: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


# ── Ticket Reply (inbound email simulation) ─────────────────

class TicketReply(BaseModel):
    message: str
    sender_email: str
    new_status: Optional[str] = None  # Optional status change
