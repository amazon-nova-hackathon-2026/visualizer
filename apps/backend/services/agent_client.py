import boto3
import json
from config.config import Config


class AgentClient:
    def __init__(self):
        self.client = boto3.client("bedrock-agentcore", region_name=Config.AWS_REGION)

    def invoke(self, prompt: str, session_id: str) -> dict:
        payload = json.dumps({"prompt": prompt})

        kwargs = {
            "agentRuntimeArn": Config.AGENT_RUNTIME_ARN,
            "runtimeSessionId": session_id,
            "payload": payload,
        }

        response = self.client.invoke_agent_runtime(**kwargs)
        body = response["response"].read()
        return json.loads(body)
