import asyncio

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from services.session_manager import SessionManager
from core.ws_handler import handle_explain

app = FastAPI()
session_manager = SessionManager()


@app.post("/uni/create-session")
async def create_session_for_user():
    session_id = session_manager.create_session()
    return {"session_id": session_id}


@app.get("/uni/validate-session/{session_id}")
async def validate_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        return {"code": 404, "error": "Session not found"}
    return {"session_id": session_id, "session": session}


@app.websocket("/uni/explain/{session_id}")
async def explain(ws: WebSocket, session_id: str):
    await ws.accept()
    try:
        data = await ws.receive_json()
        prompt = data.get("prompt")

        if not prompt:
            await ws.send_json({"type": "error", "message": "No prompt provided"})
            return

        await handle_explain(ws, session_id, prompt)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session: {session_id}")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)
