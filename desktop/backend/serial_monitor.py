"""
serial_monitor.py — Multi-port async serial monitor.
Supports running ESP32 and Arduino monitors simultaneously, each broadcasting
with their own source tag so the frontend can display them in separate panels.
"""
import asyncio
import serial


class SerialMonitorInstance:
    """A single serial monitor for one port."""

    def __init__(self, source_tag: str, broadcast_callback=None):
        self.source_tag = source_tag          # e.g. "esp32_serial" or "arduino_serial"
        self.port = None
        self.baudrate = 115200
        self.running = False
        self.task = None
        self.broadcast_callback = broadcast_callback
        self.serial_instance = None

    def start(self, port: str, baudrate: int = 115200) -> tuple[bool, str]:
        if self.running:
            self.stop()

        self.port = port
        self.baudrate = baudrate

        try:
            ser = serial.Serial(port, baudrate, timeout=0.2)
            # Prevent holding ESP32 in RESET — harmless for Arduino too
            ser.dtr = False
            ser.rts = False
            self.serial_instance = ser
        except Exception as e:
            return False, f"Failed to open port {port}: {e}"

        self.running = True
        try:
            loop = asyncio.get_running_loop()
            self.task = loop.create_task(self._reader_loop())
        except RuntimeError:
            loop = asyncio.get_event_loop()
            self.task = loop.create_task(self._reader_loop())

        return True, f"Monitoring {port} @ {baudrate} baud"

    def stop(self):
        self.running = False
        if self.serial_instance and self.serial_instance.is_open:
            try:
                self.serial_instance.close()
            except Exception:
                pass
        self.serial_instance = None
        if self.task and not self.task.done():
            self.task.cancel()

    async def _reader_loop(self):
        loop = asyncio.get_running_loop()
        print(f"[SerialMonitor:{self.source_tag}] Monitoring {self.port} @ {self.baudrate} baud")
        buffer = ""

        try:
            while self.running and self.serial_instance and self.serial_instance.is_open:
                def read_bytes():
                    if self.serial_instance and self.serial_instance.is_open:
                        return self.serial_instance.read(self.serial_instance.in_waiting or 1)
                    return b""

                raw_data = await loop.run_in_executor(None, read_bytes)
                if raw_data:
                    text = raw_data.decode("utf-8", errors="replace")
                    buffer += text

                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        clean_line = line.rstrip("\r")
                        if clean_line and self.broadcast_callback:
                            await self.broadcast_callback({
                                "type": "serial_log",
                                "source": self.source_tag,
                                "port": self.port,
                                "line": clean_line,
                            })

                await asyncio.sleep(0.01)

        except Exception as e:
            print(f"[SerialMonitor:{self.source_tag}] Error on {self.port}: {e}")
            if self.broadcast_callback:
                await self.broadcast_callback({
                    "type": "serial_log",
                    "source": self.source_tag,
                    "port": self.port,
                    "line": f"[Serial Monitor Error: {e}]",
                })
        finally:
            self.running = False
            if self.serial_instance and self.serial_instance.is_open:
                try:
                    self.serial_instance.close()
                except Exception:
                    pass
            self.serial_instance = None


class SerialMonitor:
    """
    Multi-port serial monitor manager.
    Maintains a named dict of SerialMonitorInstance objects so ESP32 and Arduino
    can be monitored simultaneously in the same dashboard session.
    """

    def __init__(self, broadcast_callback=None):
        self.broadcast_callback = broadcast_callback
        # Built-in named monitors — more can be added dynamically
        self._monitors: dict[str, SerialMonitorInstance] = {
            "esp32":   SerialMonitorInstance("esp32_serial",   broadcast_callback),
            "arduino": SerialMonitorInstance("arduino_serial", broadcast_callback),
        }

    def start(self, port: str, baudrate: int = 115200,
              device: str = "esp32") -> tuple[bool, str]:
        """Start monitor for the given device key ('esp32' or 'arduino')."""
        if device not in self._monitors:
            self._monitors[device] = SerialMonitorInstance(
                f"{device}_serial", self.broadcast_callback
            )
        return self._monitors[device].start(port, baudrate)

    def stop(self, device: str = "esp32"):
        """Stop monitor for the given device key."""
        if device in self._monitors:
            self._monitors[device].stop()

    def stop_all(self):
        for m in self._monitors.values():
            m.stop()

    def status(self) -> dict:
        return {
            key: {
                "running": m.running,
                "port": m.port,
                "baudrate": m.baudrate,
            }
            for key, m in self._monitors.items()
        }
