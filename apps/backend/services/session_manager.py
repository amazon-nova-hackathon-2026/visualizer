import redis
import uuid
import json
from typing import cast

from config.config import Config


class SessionManager:
    def __init__(self):
        self.redis = redis.Redis(
            host=Config.REDIS_HOST, port=Config.REDIS_PORT, decode_responses=True
        )

    def create_session(self) -> str:
        pass

    def get_session(self, session_id: str) -> dict | None:
        pass

    def save_plan(self, session_id: str, plan: dict) -> None:
        pass

    def validate_session(self, session_id: str) -> bool:
        pass
