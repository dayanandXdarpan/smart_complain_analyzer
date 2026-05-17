"""
Static AI Workflow (Fallback)
=============================
Retained as a fallback if no dynamic workflow is configured.
The orchestrator will call this if the workflows table is empty.
"""

import logging
from typing import Dict, Any, TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.config import settings

logger = logging.getLogger(__name__)


class TicketState(TypedDict):
    ticket_id: str
    title: str
    description: str
    department: str
    priority: str
    sentiment: str
    confidence: float
    is_duplicate_of: str
    status: str


def get_llm():
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "dummy":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-pro", temperature=0)
    elif settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "dummy":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    else:
        return None


def classification_agent(state: TicketState) -> TicketState:
    llm = get_llm()
    if not llm:
        state["department"] = "General"
        return state

    system_prompt = """You are a classification agent for a complaint system. 
    Categorize the complaint into one of the following departments:
    - IT Support
    - Maintenance
    - Academics
    - HR
    - General
    
    Output ONLY the department name. If unsure, output 'General'."""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Title: {state['title']}\nDescription: {state['description']}")
    ])
    
    state["department"] = response.content.strip()
    return state


def priority_agent(state: TicketState) -> TicketState:
    llm = get_llm()
    if not llm:
        state["priority"] = "MEDIUM"
        state["sentiment"] = "Neutral"
        state["confidence"] = 0.7
        return state

    system_prompt = """You are a priority assessment agent. 
    Analyze the urgency and sentiment of the complaint.
    Output EXACTLY in this format: Priority: <LOW|MEDIUM|HIGH|URGENT> | Sentiment: <Positive|Neutral|Negative>"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Title: {state['title']}\nDescription: {state['description']}")
    ])
    
    try:
        parts = response.content.split("|")
        priority = parts[0].split(":")[1].strip().upper()
        sentiment = parts[1].split(":")[1].strip()
        state["priority"] = priority
        state["sentiment"] = sentiment
        state["confidence"] = 0.9
    except Exception as e:
        logger.error(f"Error parsing priority: {e}")
        state["priority"] = "MEDIUM"
        state["sentiment"] = "Neutral"
        state["confidence"] = 0.5
        
    return state


def routing_agent(state: TicketState) -> TicketState:
    if state["confidence"] >= settings.AI_CONFIDENCE_THRESHOLD and not state["is_duplicate_of"]:
        state["status"] = "ROUTED"
    else:
        state["status"] = "MANUAL_REVIEW"
    return state


def run_ai_workflow_static(ticket_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run the static (non-dynamic) AI pipeline as a fallback."""
    state = TicketState(
        ticket_id=ticket_data["id"],
        title=ticket_data["title"],
        description=ticket_data["description"],
        department="",
        priority="",
        sentiment="",
        confidence=0.0,
        is_duplicate_of="",
        status="AI_PROCESSING"
    )
    
    state = classification_agent(state)
    state = priority_agent(state)
    state = routing_agent(state)
    
    return dict(state)
