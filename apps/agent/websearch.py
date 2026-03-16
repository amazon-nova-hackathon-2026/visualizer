import os
import json
import boto3
from typing import Dict
from tavily import TavilyClient
from dotenv import load_dotenv

from constants import SECRETS_MANAGER_SECRET_NAME

if os.environ.get("LOCAL_DEV") == "1":
    load_dotenv()

class WebSearchClient:
    def __init__(self):
        if os.environ.get("LOCAL_DEV") == "1":
            self.tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        else:
            client = boto3.client("secretsmanager", region_name="us-west-2")
            response = client.get_secret_value(SecretId=SECRETS_MANAGER_SECRET_NAME)
            secret_dict = json.loads(response["SecretString"])
            self.tavily_client = TavilyClient(api_key=secret_dict["TAVILY_API_KEY"])

    def search(self, query):
        visual = self.tavily_client.search(
            query=f"{query} diagram explained",
            max_results=5,
            include_images=True
        )

        wiki = self.tavily_client.search(
            query=f"{query} wikipedia",
            max_results=5,
        )

        return {
            "visual": self._results(visual),
            "wiki": self._results(wiki),
            "images": visual.get("images", [])[:5]
        }
    
    def _results(self, content: Dict):
        return [
            {
                "url": r["url"],
                "title": r["title"],
                "content": r["content"],
            }
            for r in content["results"]
        ]
