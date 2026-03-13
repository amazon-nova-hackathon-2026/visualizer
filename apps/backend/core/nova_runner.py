import time
import asyncio
import base64
import threading
from fastapi import WebSocket
from config.config import Config
from config.logging import get_logger
from nova_act import (
    ActAgentError,
    ActClientError,
    ActExecutionError,
    ActServerError,
    NovaAct,
)

logger = get_logger(__name__)


class NovaRunner:
    def __init__(self, ws: WebSocket, session_id: str, plan: dict):
        self.ws = ws
        self.session_id = session_id
        self.steps = plan.get("steps", [])
        self.config = Config()
        self.loop = asyncio.get_event_loop()
        self.polling = False

    def _poll_screenshots(self, nova: NovaAct):
        interval = 1 / 10

        while self.polling:
            start = time.time()
            try:
                screenshot = nova.page.screenshot(type="jpeg", quality=60)
                frame = base64.b64encode(screenshot).decode()
                asyncio.run_coroutine_threadsafe(
                    self.ws.send_json({"type": "frame", "data": frame}), self.loop
                ).result()
            except Exception:
                break

            elapsed = time.time() - start
            time.sleep(max(0, interval - elapsed))

    def _run_all(self):
        with NovaAct(
            starting_page=self.config.STARTING_PAGE,
            nova_act_api_key=self.config.NOVA_ACT_API_KEY,
            headless=True,
            tty=False,
        ) as nova:
            self.polling = True
            poll_thread = threading.Thread(
                target=self._poll_screenshots, args=(nova,), daemon=True
            )
            poll_thread.start()

            try:
                for i, step in enumerate(self.steps):
                    success = self._execute_step(nova, step, i)
                    if not success:
                        break

                    if step.get("narration"):
                        if not self._narrate(step["narration"], i):
                            break
            finally:
                self.polling = False
                poll_thread.join()

        asyncio.run_coroutine_threadsafe(
            self.ws.send_json({"type": "done"}), self.loop
        ).result()

    def _execute_step(self, nova: NovaAct, step: dict, index: int) -> bool:
        try:
            nova.act(step["query"])
            return True
        except (ActAgentError, ActClientError, ActExecutionError, ActServerError) as e:
            retriable = isinstance(e, (ActAgentError, ActClientError))
            asyncio.run_coroutine_threadsafe(
                self.ws.send_json(
                    {
                        "type": "error",
                        "step": index,
                        "message": str(e),
                        "retriable": retriable,
                    }
                ),
                self.loop,
            ).result()
        return False

    def _narrate(self, narration: str, step_index: int) -> bool:
        asyncio.run_coroutine_threadsafe(
            self.ws.send_json(
                {
                    "type": "narration",
                    "step": step_index,
                    "total": len(self.steps),
                    "narration": narration,
                }
            ),
            self.loop,
        ).result()

        try:
            asyncio.run_coroutine_threadsafe(
                asyncio.wait_for(self.ws.receive_json(), timeout=30.0), self.loop
            ).result()
            return True
        except TimeoutError:
            asyncio.run_coroutine_threadsafe(
                self.ws.send_json({"type": "error", "message": "ACK timeout"}),
                self.loop,
            ).result()
            return False

    async def run(self):
        await asyncio.to_thread(self._run_all)
