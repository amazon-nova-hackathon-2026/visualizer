import json
import os
import boto3
from dotenv import load_dotenv

from constants import SECRETS_MANAGER_SECRET_NAME

class Config:
    if os.environ.get("LOCAL_DEV") == "1":
        load_dotenv()

        REDIS_URL = os.getenv("REDIS_URL", "redis-host")
        REDIS_TTL = int(os.getenv("REDIS_TTL_SECONDS", 60))

        AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
        AGENT_RUNTIME_ARN = os.getenv("AGENT_RUNTIME_ARN", "agent")
    else:
        client = boto3.client("secretsmanager", region_name="us-west-2")
        response = client.get_secret_value(SecretId=SECRETS_MANAGER_SECRET_NAME)
        secret_dict = json.loads(response["SecretString"])

        REDIS_URL = secret_dict.get("REDIS_URL", "redis-host")
        REDIS_TTL = int(secret_dict.get("REDIS_TTL_SECONDS", 60))

        AWS_REGION = secret_dict.get("AWS_REGION", "us-west-2")
        AGENT_RUNTIME_ARN = secret_dict.get("AGENT_RUNTIME_ARN", "agent")

    STARTING_PAGE = os.getenv("STARTING_PAGE", "https://www.google.com/")
