"""Workflow CRUD API — Admin manages visual workflow definitions."""

from fastapi import APIRouter, HTTPException
from backend.database import get_supabase_client
from backend.schemas.workflow import WorkflowCreate, WorkflowUpdate
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/workflows")
def list_workflows():
    supabase = get_supabase_client()
    try:
        res = supabase.table("workflows").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error listing workflows: {e}")
        raise HTTPException(status_code=500, detail="Failed to list workflows")


@router.get("/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    supabase = get_supabase_client()
    res = supabase.table("workflows").select("*").eq("id", workflow_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return res.data[0]


@router.post("/workflows")
def create_workflow(payload: WorkflowCreate):
    supabase = get_supabase_client()
    try:
        data = {
            "name": payload.name,
            "description": payload.description,
            "graph_data": payload.graph_data.model_dump() if payload.graph_data else {"nodes": [], "edges": []},
        }
        res = supabase.table("workflows").insert(data).execute()
        return res.data[0]
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to create workflow")


@router.put("/workflows/{workflow_id}")
def update_workflow(workflow_id: str, payload: WorkflowUpdate):
    supabase = get_supabase_client()
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.is_active is not None:
        update_data["is_active"] = payload.is_active
    if payload.graph_data is not None:
        update_data["graph_data"] = payload.graph_data.model_dump()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        res = supabase.table("workflows").update(update_data).eq("id", workflow_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workflow")


@router.delete("/workflows/{workflow_id}")
def delete_workflow(workflow_id: str):
    supabase = get_supabase_client()
    try:
        supabase.table("workflows").delete().eq("id", workflow_id).execute()
        return {"message": "Workflow deleted"}
    except Exception as e:
        logger.error(f"Error deleting workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete workflow")


@router.post("/workflows/{workflow_id}/activate")
def activate_workflow(workflow_id: str):
    """Set this workflow as the only active workflow."""
    supabase = get_supabase_client()
    try:
        # Deactivate all workflows first
        supabase.table("workflows").update({"is_active": False}).neq("id", "").execute()
        # Activate the selected one
        res = supabase.table("workflows").update({"is_active": True}).eq("id", workflow_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"message": "Workflow activated", "workflow": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to activate workflow")
