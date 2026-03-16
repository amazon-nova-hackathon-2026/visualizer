import os
import time
import base64
import asyncio
import threading
import subprocess
from fastapi import WebSocket
from nova_act import NovaAct, ActAgentError, ActClientError, ActExecutionError, ActServerError
from config.config import Config
from config.logging import get_logger

logger = get_logger(__name__)

DISPLAY = ":99"
SCREEN_WIDTH = 1600
SCREEN_HEIGHT = 813


class NovaRunner:
    def __init__(self, ws: WebSocket, session_id: str, plan: dict):
        self.ws = ws
        self.steps = plan.get("steps", [])
        self.config = Config()
        self.loop = asyncio.get_event_loop()
        self.polling = False

    def _send(self, data: dict):
        asyncio.run_coroutine_threadsafe(self.ws.send_json(data), self.loop).result()

    def _receive(self, timeout: float = 30.0):
        return asyncio.run_coroutine_threadsafe(
            asyncio.wait_for(self.ws.receive_json(), timeout=timeout), self.loop
        ).result()

    def _poll(self):
        while self.polling:
            start = time.time()
            result = subprocess.run(["scrot", "-", "--display", DISPLAY], capture_output=True)
            if result.returncode == 0:
                self._send({"type": "frame", "data": base64.b64encode(result.stdout).decode()})
            time.sleep(max(0, 0.1 - (time.time() - start)))

    def _run(self):
        if os.path.exists(f"/tmp/.X{DISPLAY.replace(':', '')}-lock"):
            os.remove(f"/tmp/.X{DISPLAY.replace(':', '')}-lock")

        xvfb = subprocess.Popen(["Xvfb", DISPLAY, "-screen", "0", f"{SCREEN_WIDTH}x{SCREEN_HEIGHT}x24"])
        os.environ["DISPLAY"] = DISPLAY
        time.sleep(1)

        with NovaAct(
            starting_page=self.config.STARTING_PAGE,
            nova_act_api_key=self.config.NOVA_ACT_API_KEY,
            headless=False,
            tty=False,
            screen_width=SCREEN_WIDTH,
            screen_height=SCREEN_HEIGHT,
        ) as nova:
            self.polling = True
            poll_thread = threading.Thread(target=self._poll, daemon=True)
            poll_thread.start()

            try:
                for i, step in enumerate(self.steps):
                    query = step.get("query", "").strip()
                    if not query:
                        continue
                    try:
                        nova.act(query)
                    except (ActAgentError, ActClientError) as e:
                        self._send({"type": "error", "step": i, "message": str(e), "retriable": True})
                        break
                    except (ActExecutionError, ActServerError) as e:
                        self._send({"type": "error", "step": i, "message": str(e), "retriable": False})
                        break

                    if step.get("narration"):
                        self._send({"type": "narration", "step": i, "total": len(self.steps), "narration": step["narration"]})
                        try:
                            self._receive(timeout=30.0)
                        except TimeoutError:
                            self._send({"type": "error", "message": "ACK timeout"})
                            break
            finally:
                self.polling = False
                poll_thread.join()
                xvfb.terminate()

        self._send({"type": "done"})

    async def run(self):
        await asyncio.to_thread(self._run)