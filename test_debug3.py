import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

subprocess.run(["taskkill", "/F", "/IM", "msedge.exe"], capture_output=True)

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
user_data_dir = r"C:\Users\Mahesh\AppData\Local\Temp\edge_debug_test3"

proc = subprocess.Popen([
    edge_exe,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1600,1050",
    f"--user-data-dir={user_data_dir}",
    "http://localhost:3000"
])

time.sleep(3)

async def run_test():
    try:
        with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=2) as resp:
            targets = json.loads(resp.read().decode())
        
        ws_url = None
        for t in targets:
            if "localhost:3000" in t.get("url", ""):
                ws_url = t.get("webSocketDebuggerUrl")
                break
        
        async with websockets.connect(ws_url, max_size=50_000_000) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == cid:
                        return res.get("result", {})

            await send_cmd("Runtime.enable")
            await send_cmd("Log.enable")
            
            await asyncio.sleep(1.0)
            
            # Click
            await send_cmd("Runtime.evaluate", {"expression": "document.querySelector('.btn-primary-action').click()"})
            
            # Listen to messages
            for _ in range(20):
                msg = json.loads(await ws.recv())
                if "entry" in msg.get("params", {}):
                    print("LOG ENTRY:", msg["params"]["entry"])
                elif "exceptionDetails" in msg.get("params", {}):
                    print("EXCEPTION:", msg["params"]["exceptionDetails"])
            
    finally:
        proc.terminate()

asyncio.run(run_test())
