import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from config.logging import get_logger, setup_logging
from services.session_manager import SessionManager
from core.ws_handler import handle_explain

setup_logging()

logger = get_logger(__name__)
app = FastAPI()
session_manager = SessionManager()


@app.post("/uni/create-session")
async def create_session_for_user():
    session_id = session_manager.create_session()
    logger.info("Created session %s", session_id)
    return {"session_id": session_id}


@app.get("/uni/validate-session/{session_id}")
async def validate_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        logger.error("Session validation failed for %s", session_id)
        return {"code": 404, "error": "Session not found"}

    logger.info("Validated session %s", session_id)
    return {"session_id": session_id, "session": session}


@app.websocket("/uni/explain/{session_id}")
async def explain(ws: WebSocket, session_id: str):
    if not session_manager.validate_session(session_id):
        logger.error("Invalid or expired session for WebSocket connection: %s", session_id)
        await ws.close(code=1008, reason="Invalid or expired session")
        return

    await ws.accept()
    logger.info("WebSocket connected for session %s", session_id)

    try:
        data = await ws.receive_json()
        prompt = data.get("prompt")

        if not prompt:
            logger.error("Missing prompt for session %s", session_id)
            await ws.send_json({"type": "error", "message": "No prompt provided"})
            return

        logger.info("Starting explain flow for session %s", session_id)
        await handle_explain(ws, session_id, prompt)
        logger.info("Completed explain flow for session %s", session_id)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session %s", session_id)
    except Exception:
        logger.exception(
            "Unhandled error during explain flow for session %s", session_id
        )
        await ws.send_json({"type": "error", "message": "Internal server error"})


if __name__ == "__main__":
    logger.info("Starting backend server")
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)
