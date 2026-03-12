from flask import jsonify
import redis
import uuid
import json

from config.config import Config
class SessionManager:
    SESSION_TTL = 3600
    def __init__(self):
        self.redis = redis.Redis(
            host=Config.REDIS_HOST, port=Config.REDIS_PORT, decode_responses=True
        )

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        session_key_value = f"Session:{session_id}"
        self.redis.setex(session_key_value, self.SESSION_TTL, "active")
        return session_id

    def get_session(self, session_id: str) -> dict | None:
        session_key_value = f"Session:{session_id}";
        session_data = self.redis.get(session_key_value)
        if session_data:
            return json.loads(session_data)
        return {}
        
    def save_plan(self, session_id: str, plan: dict) -> None:
        if self.validate_session(session_id):
            self.redis.setex(f"Session:{session_id}", self.SESSION_TTL, json.dumps(plan))

    def validate_session(self, session_id: str) -> bool:
        return session_id is not None and session_id != ""
