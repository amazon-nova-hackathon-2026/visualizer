import asyncio
from config.config import Config
from nova_act import ActAgentError, ActClientError, NovaAct


class NovaRunner:
    def __init__(self, ws, session_id: str, plan: dict):
        self.ws = ws
        self.session_id = session_id
        self.steps = plan.get("steps", [])
        self.config = Config()

    async def _handle_frame(self, event):
        await self.ws.send_json({"type": "frame", "data": event["data"]})
        self.cdp.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

    async def run(self):
        with NovaAct(
            starting_page=self.config.STARTING_PAGE, headless=True, tty=False
        ) as nova:
            page = nova.page
            self.cdp = page.context.new_cdp_session(page)

            self.cdp.send(
                "Page.startScreencast",
                {"format": "jpeg", "quality": 60, "everyNthFrame": 3},
            )

            self.cdp.on("Page.screencastFrame", self._handle_frame)

            for i, step in enumerate(self.steps):
                try:
                    nova.act(step["query"])
                except Exception as e:
                    await self.ws.send_json(
                        {
                            "type": "error",
                            "step": i,
                            "message": str(e),
                            "retriable": isinstance(e, (ActAgentError, ActClientError)),
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
                        await self.ws.send_json(
                            {"type": "error", "message": "ACK timeout"}
                        )
                        break

            self.cdp.send("Page.stopScreencast")
            await self.ws.send_json({"type": "done"})
