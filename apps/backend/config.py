import os


class Config:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_TTL = 3600

    AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
    AGENT_RUNTIME_ARN = os.getenv("AGENT_RUNTIME_ARN", "vizagent007-Xi1KwyB2c9")
    AGENT_QUALIFIER = os.getenv("AGENT_QUALIFIER", None)

    SESSION_ID_MIN_LENGTH = 33

    STARTING_PAGE = os.getenv("STARTING_PAGE", "https://www.google.com/")
