"""
Dynamic Workflow Orchestrator
=============================
The core "brain" of the system. Loads an admin-configured workflow graph
from the database and executes it node-by-node to process a complaint ticket.

Node Types:
- input:     Entry point — passes ticket data forward
- aiAgent:   Calls an LLM with a configured system prompt
- condition:  Evaluates a field-based condition to branch the graph
- email:     Dispatches a context-rich email to the target
"""

import logging
import json
from typing import Dict, Any, List, Optional
from collections import defaultdict
from backend.database import get_supabase_client
from backend.agents.email_dispatcher import dispatch_ticket_email
from backend.core.config import settings

logger = logging.getLogger(__name__)


def get_llm_for_config(agent_config: Dict[str, Any]):
    """Create an LLM instance from an agent configuration record."""
    provider = agent_config.get("model_provider", settings.DEFAULT_MODEL_PROVIDER)
    model_name = agent_config.get("model_name", settings.DEFAULT_MODEL_NAME)
    temperature = float(agent_config.get("temperature", settings.DEFAULT_TEMPERATURE))

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        api_key = settings.GEMINI_API_KEY
        return ChatGoogleGenerativeAI(
            model=model_name, temperature=temperature, google_api_key=api_key
        )
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        api_key = settings.OPENAI_API_KEY
        return ChatOpenAI(
            model=model_name, temperature=temperature, openai_api_key=api_key
        )
    else:
        raise ValueError(f"Unknown model provider: {provider}")


def log_activity(supabase, ticket_id: str, activity_type: str, actor: str, details: Dict[str, Any]):
    """Write an entry to the ticket_activities audit trail."""
    try:
        supabase.table("ticket_activities").insert({
            "ticket_id": ticket_id,
            "activity_type": activity_type,
            "actor": actor,
            "details": json.dumps(details) if isinstance(details, dict) else details,
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to log activity for ticket {ticket_id}: {e}")


def build_adjacency(graph_data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    """Build an adjacency list from the workflow graph edges."""
    adj: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for edge in graph_data.get("edges", []):
        adj[edge["source"]].append(edge)
    return adj


def get_node_map(graph_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create a lookup of node_id → node_data."""
    return {n["id"]: n for n in graph_data.get("nodes", [])}


def execute_ai_agent_node(
    node: Dict[str, Any],
    ticket_state: Dict[str, Any],
    supabase,
) -> Dict[str, Any]:
    """Execute an AI Agent node: load config, call LLM, update ticket state."""
    node_data = node.get("data", {})
    agent_name = node_data.get("agentConfigName", "")
    output_field = node_data.get("outputField", "result")

    # Load agent config from DB
    res = supabase.table("agent_configs").select("*").eq("name", agent_name).execute()
    if not res.data:
        logger.error(f"Agent config '{agent_name}' not found in database")
        ticket_state[output_field] = "General"
        ticket_state["confidence"] = 0.5
        return ticket_state

    agent_config = res.data[0]
    system_prompt = agent_config["system_prompt"]

    try:
        from langchain_core.messages import SystemMessage, HumanMessage

        llm = get_llm_for_config(agent_config)
        human_msg = f"Title: {ticket_state['title']}\nDescription: {ticket_state['description']}"

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg),
        ])

        raw_output = response.content.strip()
        logger.info(f"Agent '{agent_name}' output: {raw_output}")

        # Parse output based on the agent type
        if output_field == "department":
            ticket_state["department"] = raw_output
            ticket_state["confidence"] = 0.9  # base confidence

        elif output_field == "priority":
            # Expected format: "Priority: HIGH | Sentiment: Negative"
            try:
                parts = raw_output.split("|")
                priority = parts[0].split(":")[1].strip().upper()
                sentiment = parts[1].split(":")[1].strip() if len(parts) > 1 else "Neutral"
                ticket_state["priority"] = priority
                ticket_state["sentiment"] = sentiment
            except Exception:
                ticket_state["priority"] = raw_output.upper() if raw_output.upper() in ["LOW", "MEDIUM", "HIGH", "URGENT"] else "MEDIUM"
                ticket_state["sentiment"] = "Neutral"

        elif output_field == "routing_decision":
            ticket_state["routing_decision"] = raw_output.upper()

        else:
            ticket_state[output_field] = raw_output

        # Log this step
        log_activity(supabase, ticket_state["ticket_id"], f"ai_{output_field}", "AI Agent", {
            "agent": agent_name,
            "output_field": output_field,
            "result": raw_output,
            "model": agent_config.get("model_name", "unknown"),
        })

    except Exception as e:
        logger.error(f"Error executing agent '{agent_name}': {e}")
        ticket_state.setdefault(output_field, "General")
        ticket_state.setdefault("confidence", 0.5)

    return ticket_state


def evaluate_condition_node(
    node: Dict[str, Any],
    ticket_state: Dict[str, Any],
) -> bool:
    """Evaluate a condition node — returns True or False."""
    node_data = node.get("data", {})
    field = node_data.get("field", "confidence")
    operator = node_data.get("operator", ">=")
    threshold = node_data.get("value", "0.8")

    actual_value = ticket_state.get(field)
    if actual_value is None:
        return False

    try:
        # Try numeric comparison
        actual_num = float(actual_value)
        threshold_num = float(threshold)
        if operator == ">=":
            return actual_num >= threshold_num
        elif operator == "<=":
            return actual_num <= threshold_num
        elif operator == "==":
            return actual_num == threshold_num
        elif operator == "!=":
            return actual_num != threshold_num
        elif operator == ">":
            return actual_num > threshold_num
        elif operator == "<":
            return actual_num < threshold_num
    except (ValueError, TypeError):
        # String comparison
        if operator == "==":
            return str(actual_value).lower() == str(threshold).lower()
        elif operator == "!=":
            return str(actual_value).lower() != str(threshold).lower()

    return False


def execute_email_node(
    node: Dict[str, Any],
    ticket_state: Dict[str, Any],
    supabase,
) -> Dict[str, Any]:
    """Execute an email node: dispatch a context-rich email."""
    node_data = node.get("data", {})
    email_target = node_data.get("emailTarget", "department")
    subject_template = node_data.get("subject", "New Ticket: {{title}}")
    body_template = node_data.get("bodyTemplate", "A new complaint has been submitted.\n\n{{description}}")

    # Determine target email address
    target_email = None
    if email_target == "department":
        dept_name = ticket_state.get("department", "General")
        dept_res = supabase.table("departments").select("email, id").eq("name", dept_name).execute()
        if dept_res.data:
            target_email = dept_res.data[0]["email"]
            ticket_state["department_id"] = dept_res.data[0]["id"]
        else:
            # Fallback to General department
            dept_res = supabase.table("departments").select("email, id").eq("name", "General").execute()
            if dept_res.data:
                target_email = dept_res.data[0]["email"]
                ticket_state["department_id"] = dept_res.data[0]["id"]
    elif email_target == "admin":
        target_email = settings.ADMIN_EMAIL or settings.FROM_EMAIL
    else:
        # Direct email address
        target_email = email_target

    if not target_email:
        logger.warning("No target email resolved for email node")
        return ticket_state

    # Template variable replacement
    template_vars = {
        "title": ticket_state.get("title", ""),
        "description": ticket_state.get("description", ""),
        "priority": ticket_state.get("priority", "MEDIUM"),
        "department": ticket_state.get("department", "General"),
        "sentiment": ticket_state.get("sentiment", "Neutral"),
        "confidence": str(int(float(ticket_state.get("confidence", 0.5)) * 100)),
        "ticket_id": ticket_state.get("ticket_id", ""),
    }

    subject = subject_template
    body = body_template
    for key, val in template_vars.items():
        subject = subject.replace(f"{{{{{key}}}}}", val)
        body = body.replace(f"{{{{{key}}}}}", val)

    # Dispatch the email
    thread_id = dispatch_ticket_email(
        to_email=target_email,
        subject=subject,
        body=body,
        ticket_id=ticket_state["ticket_id"],
    )

    ticket_state["routed_email"] = target_email
    ticket_state["email_thread_id"] = thread_id

    # Log
    log_activity(supabase, ticket_state["ticket_id"], "email_sent", "System", {
        "to": target_email,
        "subject": subject,
        "thread_id": thread_id,
        "node": node.get("id"),
    })

    return ticket_state


def execute_workflow(ticket_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point: load the active workflow and execute it against a ticket.
    
    Returns the final ticket state with all AI analysis results.
    """
    supabase = get_supabase_client()
    ticket_id = ticket_data["id"]

    # Initialize ticket state
    ticket_state: Dict[str, Any] = {
        "ticket_id": ticket_id,
        "title": ticket_data.get("title", ""),
        "description": ticket_data.get("description", ""),
        "department": "",
        "priority": "",
        "sentiment": "",
        "confidence": 0.0,
        "status": "AI_PROCESSING",
        "department_id": None,
        "routed_email": None,
        "email_thread_id": None,
        "ai_reasoning": "",
    }

    # Load active workflow
    wf_res = supabase.table("workflows").select("*").eq("is_active", True).limit(1).execute()
    if not wf_res.data:
        logger.warning("No active workflow found — using fallback static pipeline")
        return _fallback_pipeline(ticket_state, supabase)

    workflow = wf_res.data[0]
    graph_data = workflow.get("graph_data", {})
    ticket_state["workflow_id"] = workflow["id"]

    node_map = get_node_map(graph_data)
    adjacency = build_adjacency(graph_data)

    # Find entry point (input node)
    input_nodes = [n for n in graph_data.get("nodes", []) if n.get("type") == "input"]
    if not input_nodes:
        logger.error("Workflow has no input node")
        return _fallback_pipeline(ticket_state, supabase)

    # BFS/DFS traversal of the workflow graph
    visited = set()
    queue = [input_nodes[0]["id"]]

    while queue:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)

        node = node_map.get(current_id)
        if not node:
            continue

        node_type = node.get("type", "")
        logger.info(f"Executing node: {current_id} (type={node_type})")

        if node_type == "input":
            # Pass-through, just proceed to children
            for edge in adjacency.get(current_id, []):
                queue.append(edge["target"])

        elif node_type == "aiAgent":
            ticket_state = execute_ai_agent_node(node, ticket_state, supabase)
            for edge in adjacency.get(current_id, []):
                queue.append(edge["target"])

        elif node_type == "condition":
            result = evaluate_condition_node(node, ticket_state)
            handle = "true" if result else "false"
            for edge in adjacency.get(current_id, []):
                if edge.get("sourceHandle") == handle:
                    queue.append(edge["target"])

        elif node_type == "email":
            ticket_state = execute_email_node(node, ticket_state, supabase)

    # Determine final status
    if ticket_state.get("routed_email"):
        ticket_state["status"] = "ROUTED"
    elif float(ticket_state.get("confidence", 0)) < settings.AI_CONFIDENCE_THRESHOLD:
        ticket_state["status"] = "MANUAL_REVIEW"
    else:
        ticket_state["status"] = "ROUTED"

    # Build AI reasoning summary
    ticket_state["ai_reasoning"] = (
        f"Classified as '{ticket_state.get('department', 'Unknown')}' with "
        f"{int(float(ticket_state.get('confidence', 0)) * 100)}% confidence. "
        f"Priority: {ticket_state.get('priority', 'N/A')}. "
        f"Sentiment: {ticket_state.get('sentiment', 'N/A')}. "
        f"{'Automatically routed' if ticket_state['status'] == 'ROUTED' else 'Sent for manual review'}."
    )

    return ticket_state


def _fallback_pipeline(ticket_state: Dict[str, Any], supabase) -> Dict[str, Any]:
    """Fallback static pipeline if no workflow is configured."""
    from backend.agents.workflow import run_ai_workflow_static
    result = run_ai_workflow_static({
        "id": ticket_state["ticket_id"],
        "title": ticket_state["title"],
        "description": ticket_state["description"],
    })
    ticket_state.update(result)
    return ticket_state
