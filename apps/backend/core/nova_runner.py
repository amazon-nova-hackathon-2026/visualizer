import asyncio

from fastapi import WebSocket
from config.config import Config
from config.logging import get_logger
from nova_act import ActAgentError, ActClientError, NovaAct

logger = get_logger(__name__)


class NovaRunner:
    def __init__(self, ws: WebSocket, session_id: str, plan: dict):
        self.ws = ws
        self.session_id = session_id
        self.steps = plan.get("steps", [])
        self.config = Config()

    async def _handle_frame(self, event):
        await self.ws.send_json({"type": "frame", "data": event["data"]})
        self.cdp.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

    async def run(self):
        logger.info("Starting Nova runner for session %s with %d steps", self.session_id, len(self.steps))
        with NovaAct(
            starting_page=self.config.STARTING_PAGE,
            nova_act_api_key=self.config.NOVA_ACT_API_KEY,
            headless=True,
            tty=False,
        ) as nova:
            logger.info("NovaAct browser session started for session %s", self.session_id)
            page = nova.page
            self.cdp = page.context.new_cdp_session(page)

            self.cdp.send(
                "Page.startScreencast",
                {"format": "jpeg", "quality": 60, "everyNthFrame": 3},
            )

            self.cdp.on("Page.screencastFrame", self._handle_frame)

            for i, step in enumerate(self.steps):
                logger.info("Executing step %d/%d for session %s: %s", i + 1, len(self.steps), self.session_id, step.get("query", ""))
                try:
                    await asyncio.to_thread(nova.act, step["query"])
                    logger.info("Step %d completed for session %s", i + 1, self.session_id)
                except Exception as e:
                    retriable = isinstance(e, (ActAgentError, ActClientError))
                    logger.error("Step %d failed for session %s (retriable=%s): %s", i + 1, self.session_id, retriable, e)
                    await self.ws.send_json(
                        {
                            "type": "error",
                            "step": i,
                            "message": str(e),
                            "retriable": retriable,
                        }
                    )
                    break

                if step.get("narration"):
                    await self.ws.send_json(
                        {
                            "type": "narration",
                            "step": i,
                            "total": len(self.steps),
                            "narration": step["narration"],
                        }
                    )
                    try:
                        await asyncio.wait_for(self.ws.receive_json(), timeout=60.0)
                    except asyncio.TimeoutError:
                        logger.warning("ACK timeout at step %d for session %s", i + 1, self.session_id)
                        await self.ws.send_json(
                            {"type": "error", "message": "ACK timeout"}
                        )
                        break

            self.cdp.send("Page.stopScreencast")
            logger.info("Nova runner finished for session %s", self.session_id)
            await self.ws.send_json({"type": "done"})
