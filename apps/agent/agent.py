import os
import json
from dotenv import load_dotenv
from strands import Agent
from strands.models import BedrockModel
from bedrock_agentcore.runtime import BedrockAgentCoreApp

from prompts import SYSTEM_PROMPT
from websearch import WebSearchClient

load_dotenv()
app = BedrockAgentCoreApp()

model = BedrockModel(
    model_id=os.getenv("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0"),
    region_name=os.getenv("BEDROCK_REGION_NAME"),
    streaming=False
)
agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
)
web_search_client = WebSearchClient()
    
def _format_llm_output(raw):
    if "```json" in raw:
        raw = raw.split("```json")[1]
        raw = raw.split("```")[0]
        raw = raw.strip()
    elif "```" in raw:
        raw = raw.split("```")[1]
        raw = raw.split("```")[0]
        raw = raw.strip()
    return json.loads(raw)
    
@app.entrypoint
def generate_plan(topic):
    search_results = web_search_client.search(topic)
    
    context = f"Search results for '{topic}':\n\n"
    
    for category, results in search_results.items():
        context += f"{category.upper()}:\n"
        context += f"{results}\n\n"

    response = agent(context)
    return _format_llm_output(str(response))

if __name__ == "__main__":
    app.run()