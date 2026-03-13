import redis
import uuid
import json

from config.config import Config


class SessionManager:
    SESSION_TTL = 3600

    def __init__(self):
        self.redis = redis.from_url(Config.REDIS_URL, decode_responses=True)

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        session_key_value = f"Session:{session_id}"
        self.redis.setex(
            session_key_value,
            Config.REDIS_TTL,
            json.dumps({"status": "active"}),
        )
        return session_id

    def get_session(self, session_id: str) -> dict | None:
        session_key_value = f"Session:{session_id}"
        session_data = self.redis.get(session_key_value)

        print(session_data)

        if isinstance(session_data, bytes):
            session_data = session_data.decode("utf-8", errors="ignore")

        if isinstance(session_data, str) and session_data:
            try:
                return json.loads(session_data)
            except json.JSONDecodeError:
                if session_data == "active":
                    return {"status": "active"}
                return {}
        return {}

    def save_plan(self, session_id: str, plan: dict) -> None:
        if self.validate_session(session_id):
            self.redis.setex(
                f"Session:{session_id}", Config.REDIS_TTL, json.dumps(plan)
            )

    def validate_session(self, session_id: str) -> bool:
        return session_id is not None and session_id != ""
