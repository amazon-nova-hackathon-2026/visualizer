import os
from typing import Dict
from tavily import TavilyClient
from dotenv import load_dotenv

class WebSearchClient:
    def __init__(self):
        load_dotenv()
        self.tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

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
