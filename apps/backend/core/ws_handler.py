from fastapi import WebSocket
from services.agent_client import AgentClient
from core.nova_runner import NovaRunner
from services.session_manager import SessionManager

agent_client = AgentClient()
session_manager = SessionManager()


async def handle_explain(ws: WebSocket, session_id: str, prompt: str):
    if not session_manager.validate_session(session_id):
        await ws.send_json({"type": "error", "message": "Invalid or expired session"})
        return

    await ws.send_json({"type": "planning", "message": "Generating visual plan"})
    plan = agent_client.invoke(prompt, session_id)
    session_manager.save_plan(session_id, plan)

    await ws.send_json(
        {
            "type": "plan",
            "topic": plan.get("topic"),
            "total_steps": len(plan.get("steps", [])),
        }
    )

    runner = NovaRunner(ws=ws, session_id=session_id, plan=plan)
    await runner.run()
