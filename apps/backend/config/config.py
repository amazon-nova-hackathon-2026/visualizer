import os


# TODO: Implement Secrets Manager for deployment
class Config:
    REDIS_HOST = os.getenv("REDIS_HOST", "redis-host")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 1234))
    REDIS_TTL = int(os.getenv("REDIS_TTL_SECONDS", 60))

    AWS_REGION = os.getenv("AWS_REGION", "us-xxxx-x")
    AGENT_RUNTIME_ARN = os.getenv("AGENT_RUNTIME_ARN", "agent")

    STARTING_PAGE = os.getenv("STARTING_PAGE", "https://www.google.com/")
