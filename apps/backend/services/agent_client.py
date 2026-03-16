import boto3
import json
from config.config import Config
from config.logging import get_logger

logger = get_logger(__name__)


class AgentClient:
    def __init__(self):
        self.client = boto3.client("bedrock-agentcore", region_name=Config.AWS_REGION)
        logger.debug(
            "AgentClient initialised (region=%s, arn=%s)",
            Config.AWS_REGION,
            Config.AGENT_RUNTIME_ARN,
        )

    def invoke(self, prompt: str, session_id: str) -> dict:
        logger.info("Invoking agent runtime for session %s", session_id)
        payload = json.dumps({"prompt": prompt})

        kwargs = {
            "agentRuntimeArn": Config.AGENT_RUNTIME_ARN,
            "runtimeSessionId": session_id,
            "payload": payload,
        }

        try:
            response = self.client.invoke_agent_runtime(**kwargs)
            body = response["response"].read()
            result = json.loads(body)
            logger.info(
                "Agent runtime responded for session %s with %d steps",
                session_id,
                len(result.get("steps", [])),
            )
            return result
        except Exception:
            logger.exception(
                "Agent runtime invocation failed for session %s", session_id
            )
            raise
