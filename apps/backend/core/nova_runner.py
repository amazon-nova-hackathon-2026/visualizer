import os
import time
import base64
import asyncio
import threading
import subprocess
from fastapi import WebSocket, WebSocketDisconnect
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
        self.session_id = session_id
        self.steps = plan.get("steps", [])
        self.config = Config()
        self.loop = asyncio.get_event_loop()
        self.polling = False
        self.stop_event = threading.Event()
        self.xvfb = None

    def stop(self, reason: str = ""):
        if reason:
            logger.info("Stopping Nova runner for session %s: %s", self.session_id, reason)
        self.stop_event.set()
        self.polling = False

        if self.xvfb and self.xvfb.poll() is None:
            self.xvfb.terminate()

    def _send(self, data: dict):
        if self.stop_event.is_set():
            return

        try:
            asyncio.run_coroutine_threadsafe(self.ws.send_json(data), self.loop).result()
        except Exception as e:
            self.stop(f"websocket send failed: {e}")
            raise

    def _receive(self, timeout: float = 30.0):
        if self.stop_event.is_set():
            raise WebSocketDisconnect(code=1001)

        try:
            return asyncio.run_coroutine_threadsafe(
                asyncio.wait_for(self.ws.receive_json(), timeout=timeout), self.loop
            ).result()
        except Exception as e:
            self.stop(f"websocket receive failed: {e}")
            raise

    def _poll(self):
        while self.polling and not self.stop_event.is_set():
            start = time.time()
            result = subprocess.run(["scrot", "-", "--display", DISPLAY], capture_output=True)
            if result.returncode == 0:
                try:
                    self._send({"type": "frame", "data": base64.b64encode(result.stdout).decode()})
                except Exception:
                    break
            time.sleep(max(0, 0.1 - (time.time() - start)))

    def _run(self):
        if os.path.exists(f"/tmp/.X{DISPLAY.replace(':', '')}-lock"):
            os.remove(f"/tmp/.X{DISPLAY.replace(':', '')}-lock")

        self.xvfb = subprocess.Popen(["Xvfb", DISPLAY, "-screen", "0", f"{SCREEN_WIDTH}x{SCREEN_HEIGHT}x24"])
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
                    if self.stop_event.is_set():
                        logger.info("Stopping step loop for session %s", self.session_id)
                        break

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
                        except WebSocketDisconnect:
                            self.stop("websocket disconnected while waiting for ACK")
                            break
            finally:
                self.polling = False
                poll_thread.join()
                if self.xvfb and self.xvfb.poll() is None:
                    self.xvfb.terminate()

        if not self.stop_event.is_set():
            self._send({"type": "done"})

    async def run(self):
        await asyncio.to_thread(self._run)