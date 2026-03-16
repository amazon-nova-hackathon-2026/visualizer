from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from config.logging import get_logger
from services.agent_client import AgentClient
from core.nova_runner import NovaRunner
from services.session_manager import SessionManager

logger = get_logger(__name__)
agent_client = AgentClient()
session_manager = SessionManager()


async def handle_explain(ws: WebSocket, session_id: str, prompt: str) -> None:
    if not session_manager.validate_session(session_id):
        logger.error("Invalid or expired session for explain flow: %s", session_id)
        await ws.send_json({"type": "error", "message": "Invalid or expired session"})
        return

    logger.info("Generating visual plan for session %s", session_id)
    await ws.send_json({"type": "planning", "message": "Generating visual plan"})
    plan = agent_client.invoke(prompt, session_id)
    logger.info(
        "Received plan for session %s with %s steps",
        session_id,
        len(plan.get("steps", [])),
    )
    session_manager.save_plan(session_id, plan)
    logger.info("Saved plan for session %s", session_id)

    await ws.send_json(
        {
            "type": "plan",
            "topic": plan.get("topic"),
            "total_steps": len(plan.get("steps", [])),
        }
    )

    runner = NovaRunner(ws=ws, session_id=session_id, plan=plan)
    logger.info("Starting Nova runner for session %s", session_id)
    try:
        await runner.run()
        logger.info("Nova runner completed for session %s", session_id)
    except WebSocketDisconnect:
        runner.stop("websocket disconnected")
        logger.info("WebSocket disconnected; stopped Nova runner for session %s", session_id)
        raise
