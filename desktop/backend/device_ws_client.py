"""
device_ws_client.py — WebSocket client to ESP32 control-plane with auto-reconnect.
Bridges state & config to frontend, persists last-used IP across backend restarts.
"""
import asyncio
import json
import os
import time
import websockets

# Persist last ESP32 IP so backend can auto-reconnect after restart
_STATE_FILE = os.path.join(os.path.dirname(__file__), ".esp32_last_ip")


def _load_last_ip() -> str | None:
    try:
        if os.path.exists(_STATE_FILE):
            with open(_STATE_FILE) as f:
                ip = f.read().strip()
                return ip if ip else None
    except Exception:
        pass
    return None


def _save_last_ip(ip: str):
    try:
        with open(_STATE_FILE, "w") as f:
            f.write(ip)
    except Exception:
        pass


class DeviceWSClient:
    def __init__(self, broadcast_callback=None):
        self.esp32_ip = None
        self.ws = None
        self.broadcast_callback = broadcast_callback
        self.running = False
        self.task = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected and self.ws is not None

    async def connect(self, esp32_ip: str):
        """Connect to ESP32 WebSocket with unlimited auto-reconnect & exponential backoff."""
        self.esp32_ip = esp32_ip
        ws_url = f"ws://{esp32_ip}/ws"

        INITIAL_DELAY = 2      # seconds before first retry
        MAX_DELAY     = 30     # maximum backoff cap
        delay         = INITIAL_DELAY
        current_task  = asyncio.current_task()

        while self.running and (self.task is None or self.task is current_task):
            try:
                print(f"[DeviceWSClient] Connecting to {ws_url} ...")
                async with websockets.connect(
                    ws_url,
                    open_timeout=8,
                    ping_interval=20,
                    ping_timeout=10,
                ) as websocket:
                    if self.task is not None and self.task is not current_task:
                        return

                    self.ws = websocket
                    self._connected = True
                    delay = INITIAL_DELAY   # reset backoff on successful connect
                    print(f"[DeviceWSClient] [OK] Connected to ESP32 at {ws_url}")

                    # Fetch config on connect
                    await self.send({"type": "get_config"})

                    # Notify frontend about connection state
                    if self.broadcast_callback:
                        await self.broadcast_callback({
                            "type": "esp32_status",
                            "connected": True,
                            "ip": esp32_ip
                        })

                    async for message in websocket:
                        if self.task is not None and self.task is not current_task:
                            return
                        try:
                            data = json.loads(message)
                            if self.broadcast_callback:
                                await self.broadcast_callback(data)
                        except json.JSONDecodeError:
                            pass

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[DeviceWSClient] [ERR] Connection lost: {e}. Retrying in {delay}s...")
            finally:
                if self.task is None or self.task is current_task:
                    self.ws = None
                    self._connected = False

            if not self.running or (self.task is not None and self.task is not current_task):
                break

            if self.broadcast_callback:
                try:
                    await self.broadcast_callback({
                        "type": "esp32_status",
                        "connected": False,
                        "ip": esp32_ip
                    })
                except Exception:
                    pass

            await asyncio.sleep(delay)
            delay = min(delay * 2, MAX_DELAY)

    async def send(self, data: dict) -> bool:
        if self.ws and self._connected:
            try:
                await self.ws.send(json.dumps(data))
                return True
            except Exception as e:
                print(f"[DeviceWSClient] Send error: {e}")
                self.ws = None
                self._connected = False
        return False

    def start_connection(self, esp32_ip: str):
        """Start (or restart) the connection loop for the given IP. Persists IP across restarts."""
        _save_last_ip(esp32_ip)

        # If already connected to this IP, no need to tear down
        if self.is_connected and self.esp32_ip == esp32_ip:
            print(f"[DeviceWSClient] Already connected to {esp32_ip}")
            return

        self.esp32_ip = esp32_ip

        if self.task and not self.task.done():
            self.task.cancel()

        self.running = True
        try:
            loop = asyncio.get_running_loop()
            self.task = loop.create_task(self.connect(esp32_ip))
        except RuntimeError:
            loop = asyncio.get_event_loop()
            self.task = loop.create_task(self.connect(esp32_ip))

    def stop(self):
        self.running = False
        if self.task and not self.task.done():
            self.task.cancel()


def get_last_ip() -> str | None:
    """Return the last-used ESP32 IP (for auto-connect on startup)."""
    return _load_last_ip()
