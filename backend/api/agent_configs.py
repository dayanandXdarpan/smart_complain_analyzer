"""Agent Configs CRUD API — Admin manages AI agent system prompts & settings."""

from fastapi import APIRouter, HTTPException
from backend.database import get_supabase_client
from backend.schemas.workflow import AgentConfigCreate, AgentConfigUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/agent-configs")
def list_agent_configs():
    supabase = get_supabase_client()
    try:
        res = supabase.table("agent_configs").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error listing agent configs: {e}")
        raise HTTPException(status_code=500, detail="Failed to list agent configs")


@router.get("/agent-configs/{config_id}")
def get_agent_config(config_id: str):
    supabase = get_supabase_client()
    res = supabase.table("agent_configs").select("*").eq("id", config_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return res.data[0]


@router.post("/agent-configs")
def create_agent_config(payload: AgentConfigCreate):
    supabase = get_supabase_client()
    try:
        data = payload.model_dump()
        res = supabase.table("agent_configs").insert(data).execute()
        return res.data[0]
    except Exception as e:
        logger.error(f"Error creating agent config: {e}")
        raise HTTPException(status_code=500, detail="Failed to create agent config")


@router.put("/agent-configs/{config_id}")
def update_agent_config(config_id: str, payload: AgentConfigUpdate):
    supabase = get_supabase_client()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        res = supabase.table("agent_configs").update(update_data).eq("id", config_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Agent config not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update agent config")


@router.delete("/agent-configs/{config_id}")
def delete_agent_config(config_id: str):
    supabase = get_supabase_client()
    try:
        supabase.table("agent_configs").delete().eq("id", config_id).execute()
        return {"message": "Agent config deleted"}
    except Exception as e:
        logger.error(f"Error deleting agent config: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete agent config")
