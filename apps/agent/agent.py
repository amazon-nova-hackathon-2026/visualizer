import os
import json
from dotenv import load_dotenv
from strands import Agent
from strands.models import BedrockModel

from prompts import SYSTEM_PROMPT
from websearch import WebSearchClient

load_dotenv()

class VisualExplainerAgent:
    def __init__(self):
        self.model = BedrockModel(
            model_id=os.getenv("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0"),
            region_name=os.getenv("BEDROCK_REGION_NAME"),
            streaming=False
        )
        self.agent = Agent(
            model=self.model,
            system_prompt=SYSTEM_PROMPT,
        )
        self.web_search_client = WebSearchClient()
    
    def _format_llm_output(self, raw):
        if "```json" in raw:
            raw = raw.split("```json")[1]
            raw = raw.split("```")[0]
            raw = raw.strip()
        elif "```" in raw:
            raw = raw.split("```")[1]
            raw = raw.split("```")[0]
            raw = raw.strip()
        return json.loads(raw)

    def generate_plan(self, topic):
        search_results = self.web_search_client.search(topic)
        
        context = f"Search results for '{topic}':\n\n"
        
        for category, results in search_results.items():
            context += f"{category.upper()}:\n"
            context += f"{results}\n\n"

        response = self.agent(context)
        return self._format_llm_output(str(response))