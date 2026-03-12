import asyncio
from flask import Flask, json, jsonify
from flask_sock import Sock

from session_manager import SessionManager
from ws_handler import handle_explain

app = Flask("backend_app")
sock = Sock(app)
session_manager = SessionManager()


@app.route("/uni/create-session", methods=["POST"])
def create_session_for_user():
    session_id = session_manager.create_session()
    return (
        jsonify(
            {"session_id": session_id},
            {"message": "Session created successfully!"},
        ),
        201,
    )


@app.route("/uni/validate-session/<session_id>", methods=["GET"])
def validate_session(session_id):
    session = session_manager.get_session(session_id)
    if not session:
        return jsonify({"code": 404, "error": "Session not found"}), 404
    return jsonify({"session_id": session_id, "session": session})


@sock.route("/uni/explain/<session_id>")
def explain(ws, session_id):
    data = json.loads(ws.receive())
    prompt = data.get("prompt")

    if not prompt:
        ws.send(json.dumps({"type": "error", "message": "No prompt provided"}))
        return

    asyncio.run(handle_explain(ws, session_id, prompt))


if __name__ == "__main__":
    app.run(debug=True)
