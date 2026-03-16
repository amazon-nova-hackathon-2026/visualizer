import redis
import uuid
import json

from config.config import Config
from config.logging import get_logger

logger = get_logger(__name__)


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
        logger.info("Session created: %s (TTL=%ds)", session_id, Config.REDIS_TTL)
        return session_id

    def get_session(self, session_id: str) -> dict | None:
        session_key_value = f"Session:{session_id}"
        session_data = self.redis.get(session_key_value)

        if session_data is None:
            logger.warning("Session not found in Redis: %s", session_id)
            return {}

        logger.debug("Raw session data for %s: %s", session_id, session_data)

        if isinstance(session_data, bytes):
            session_data = session_data.decode("utf-8", errors="ignore")

        if isinstance(session_data, str) and session_data:
            try:
                return json.loads(session_data)
            except json.JSONDecodeError:
                logger.warning(
                    "Failed to parse session data for %s, falling back to raw value",
                    session_id,
                )
                if session_data == "active":
                    return {"status": "active"}
                return {}
        return {}

    def save_plan(self, session_id: str, plan: dict) -> None:
        if self.validate_session(session_id):
            self.redis.setex(
                f"Session:{session_id}", Config.REDIS_TTL, json.dumps(plan)
            )
            logger.info("Plan saved for session %s", session_id)
        else:
            logger.warning("Attempted to save plan for invalid session %s", session_id)

    def validate_session(self, session_id: str) -> bool:
        if not session_id:
            return False

        session_key_value = f"Session:{session_id}"
        return self.redis.exists(session_key_value) == 1
