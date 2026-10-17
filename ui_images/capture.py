import asyncio
import json
import os
import subprocess
import time
import urllib.request
import base64
import websockets

output_dir = r"C:\blockchain\suyog\One-Sensor\ui_images"
os.makedirs(output_dir, exist_ok=True)

# Terminate any leftover edge instances
subprocess.run(["taskkill", "/F", "/IM", "msedge.exe"], capture_output=True)

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
user_data_dir = r"C:\Users\Mahesh\AppData\Local\Temp\edge_cdp_profile_screens_v4"

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

async def run_capture():
    try:
        targets = []
        for _ in range(15):
            try:
                with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=2) as resp:
                    targets = json.loads(resp.read().decode())
                if targets:
                    break
            except Exception:
                await asyncio.sleep(0.5)
        
        ws_url = None
        for t in targets:
            if "localhost:3000" in t.get("url", ""):
                ws_url = t.get("webSocketDebuggerUrl")
                break
        if not ws_url:
            for t in targets:
                if t.get("type") == "page":
                    ws_url = t.get("webSocketDebuggerUrl")
                    break
        
        print("Connecting to ws:", ws_url)
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

            await send_cmd("Page.navigate", {"url": "http://localhost:3000"})
            await asyncio.sleep(2.5)

            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1600,
                "height": 1050,
                "deviceScaleFactor": 1,
                "mobile": False
            })

            async def click_selector(selector):
                js = f'''(() => {{
                    const el = document.querySelector("{selector}");
                    if (el) {{ el.click(); return true; }}
                    return false;
                }})()'''
                res = await send_cmd("Runtime.evaluate", {"expression": js})
                return res.get("result", {}).get("value")

            async def click_nav_item(label):
                js = f'''(() => {{
                    const btns = Array.from(document.querySelectorAll('.sidebar-nav-item'));
                    const btn = btns.find(b => b.innerText.includes("{label}"));
                    if (btn) {{ btn.click(); return true; }}
                    return false;
                }})()'''
                res = await send_cmd("Runtime.evaluate", {"expression": js})
                return res.get("result", {}).get("value")

            async def capture_png(filename):
                shot = await send_cmd("Page.captureScreenshot", {"format": "png", "quality": 100})
                data = base64.b64decode(shot["data"])
                filepath = os.path.join(output_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(data)
                print(f"Captured {filename}: {len(data)} bytes")

            # 0a. Landing Page Hero (State A)
            print("Taking 00_landing_page.png...")
            await asyncio.sleep(1.0)
            await capture_png("00_landing_page.png")

            # 0b. Landing Capabilities (State A) - center in view to show full dark section & cards
            print("Taking 00_landing_capabilities.png...")
            await send_cmd('Runtime.evaluate', {'expression': 'document.getElementById("capabilities")?.scrollIntoView({behavior: "instant", block: "start"})'})
            await asyncio.sleep(1.5)
            await capture_png("00_landing_capabilities.png")

            # 0c. Landing Workflow (State A) - capture connected engineering timeline
            print("Taking 00_landing_workflow.png...")
            await send_cmd('Runtime.evaluate', {'expression': 'document.getElementById("how-it-works")?.scrollIntoView({behavior: "instant", block: "start"})'})
            await asyncio.sleep(1.2)
            await capture_png("00_landing_workflow.png")

            # 0d. Landing Final CTA (State A) - capture deep-navy final entry section & footer
            print("Taking 00_landing_final_cta.png...")
            await send_cmd('Runtime.evaluate', {'expression': 'document.querySelector(".landing-final-entry-section")?.scrollIntoView({behavior: "instant", block: "start"})'})
            await asyncio.sleep(1.2)
            await capture_png("00_landing_final_cta.png")

            # Transition to Workbench using the primary action button
            print("Transitioning into Workbench via .btn-final-enter or .btn-primary-action...")
            clicked = await click_selector(".btn-final-enter")
            if not clicked:
                clicked = await click_selector(".btn-primary-action")
            print("Button clicked:", clicked)
            # Wait for 380ms transition bridge to mount State B
            await asyncio.sleep(2.0)

            # 1. Overview (State B)
            print("Taking 01_overview.png...")
            await click_nav_item("Overview")
            await asyncio.sleep(2.0)
            await capture_png("01_overview.png")

            # 2. Live Sensors (Focused)
            print("Taking 02_live_sensors_focused.png...")
            await click_nav_item("Live Sensors")
            await asyncio.sleep(1.5)
            await click_selector(".toggle-option:first-child")
            await asyncio.sleep(1.2)
            await capture_png("02_live_sensors_focused.png")

            # 3. Live Sensors (Grid)
            print("Taking 03_live_sensors_grid.png...")
            await click_selector(".toggle-option:last-child")
            await asyncio.sleep(1.5)
            await capture_png("03_live_sensors_grid.png")

            # 4. Scenarios
            print("Taking 04_scenarios.png...")
            await click_nav_item("Scenarios")
            await asyncio.sleep(1.5)
            await capture_png("04_scenarios.png")

            # 5. Fault Lab
            print("Taking 05_fault_lab.png...")
            await click_nav_item("Fault Lab")
            await asyncio.sleep(1.5)
            await capture_png("05_fault_lab.png")

            # 6. Devices & 3D
            print("Taking 06_devices_3d.png...")
            await click_nav_item("Devices & 3D")
            await asyncio.sleep(2.5) # Allow 3D canvas to render
            await capture_png("06_devices_3d.png")

            # 7. Configuration
            print("Taking 07_configuration.png...")
            await click_nav_item("Configuration")
            await asyncio.sleep(1.5)
            await capture_png("07_configuration.png")

            # 8. Firmware
            print("Taking 08_firmware.png...")
            await click_nav_item("Firmware")
            await asyncio.sleep(1.5)
            await capture_png("08_firmware.png")

            # 9. Serial Console
            print("Taking 09_serial_console.png...")
            await click_nav_item("Serial Console")
            await asyncio.sleep(1.5)
            await capture_png("09_serial_console.png")

            # 10. Device Setup
            print("Taking 10_device_setup.png...")
            await click_nav_item("Device Setup")
            await asyncio.sleep(1.5)
            await capture_png("10_device_setup.png")

            # 11. Command Palette
            print("Taking 11_command_palette.png...")
            await send_cmd("Runtime.evaluate", {
                "expression": "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))"
            })
            await asyncio.sleep(1.0)
            await capture_png("11_command_palette.png")

            print("All captures completed successfully!")

    except Exception as e:
        print("Error during capture:", e)
    finally:
        try:
            proc.terminate()
        except:
            pass

asyncio.run(run_capture())
