# MASTER PROMPT — OneSensor Frontend Redesign + 3D Circuit Visualization

Paste this whole document into your IDE's AI assistant (Cursor / Claude Code / Copilot Chat / etc.) as the task brief.

---

## 0. Scope Lock (read this first)

You are working **ONLY on the frontend layer** of the OneSensor project. Do **NOT** modify, rename, or refactor any of the following, even if it seems related:

- `esp32/` — firmware (C++/PlatformIO), WebSocket server, LEDC/DAC channel logic, NVS config store
- `arduino/OneSensor/` — the Arduino C++ library and example sketches
- `desktop/backend/` — the FastAPI Python backend (serial flashing, port detection)
- Any wiring, pin assignment, or signal-decoding math (`ValueMapper`, `PwmDecoder`, `DacDecoder`)

You **may** treat the WebSocket JSON protocol as a fixed external API — read from it, send commands per its existing schema, but do not change the schema itself. If a new field would genuinely help the frontend, propose it in a comment rather than assuming the backend already supports it.

**Two frontend surfaces exist in this repo** — confirm with me which one(s) you're targeting before starting, or ask if unclear:
1. **Embedded Web Dashboard** — static HTML/CSS/JS served directly from ESP32 flash (must stay lightweight — this runs from a microcontroller's limited flash/RAM, so no huge JS bundles, no heavy build step, prefer CDN-loaded libraries or a small compiled bundle under a strict size budget, e.g. <500KB total).
2. **Desktop App Frontend** — `desktop/frontend/`, a React + Vite app with no such size constraint, this is where a full Three.js 3D scene belongs.

Default assumption unless told otherwise: **do the full UX overhaul + 3D visualization in the Desktop App (React + Vite)**, and keep the embedded dashboard as a lighter-weight, visually consistent but 2D-only fallback.

---

## 1. Project Context (for your reference, do not re-derive from scratch)

OneSensor simulates 5 sensors (temperature, humidity, gas, light, soil moisture) on an ESP32, which drives real PWM/DAC signals into an Arduino Uno over jumper wires. The frontend's job is to let a user:

- View live sensor values in real time (via WebSocket state broadcasts, ~4 Hz)
- Manually set sensor values (sliders / numeric inputs)
- Configure and trigger **scenarios**: `STATIC` (hold a value) and `RAMP` (sweep a value over a duration)
- See which physical ESP32 GPIO pin maps to which sensor channel, and reassign pins
- (Desktop app only) Flash firmware, view serial monitor output, auto-detect the ESP32's USB port

### WebSocket protocol (`ws://<ESP32_IP>/ws`) — treat as fixed contract

```json
// Client → Server: set one value
{ "type": "set", "sensor": "temperature", "value": 37.5 }

// Client → Server: set multiple values at once
{ "type": "set_values", "temperature": 29.0, "humidity": 65.0, "gas": 450.0, "light": 800.0, "soil": 40.0 }

// Client → Server: start a scenario
{ "type": "START_SCENARIO", "scenario": "ramp", "sensor": "temperature", "start": 10.0, "end": 45.0, "duration_s": 20 }

// Server → Client: state broadcast (~4Hz)
{ "type": "state", "temperature": 29.0, "humidity": 65.0, "gas": 450.0, "light": 800.0, "soil": 40.0, "scenario": "IDLE" }
```

### Current default pin/signal mapping (for the 3D wiring diagram — read from config at runtime if it's exposed, don't hardcode if the app already gets this from the backend)

| Sensor | ESP32 Pin | Arduino Pin | Signal | Range |
|---|---|---|---|---|
| Temperature | GPIO25 (DAC1) or GPIO16 | A0 or D2 | Analog / PWM 500Hz | 0–50 °C |
| Humidity | GPIO26 (DAC2) or GPIO17 | A1 or D3 | Analog / PWM 500Hz | 0–100 % |
| Gas | GPIO18 | D4 | PWM 500Hz | 0–1000 ppm |
| Light | GPIO19 | D5 | PWM 500Hz | 0–1000 lux |
| Soil Moisture | GPIO21 | D6 | PWM 500Hz | 0–100 % |
| Ground | GND | GND | — | — |

---

## 2. Primary Goals

### Goal A — General UX / UI overhaul
The current dashboard is functional but plain. Redesign it to feel like a polished lab-instrument control panel:

- Clean, modern layout with clear visual hierarchy: live readings up top or in a persistent sidebar, controls grouped by sensor
- Each sensor gets its own "card" with: live value (large, legible number + unit), a slider AND a numeric input kept in sync, a mini sparkline/trend of recent values, and scenario controls (Static / Ramp) scoped to that card
- Connection status indicator (WebSocket connected / reconnecting / disconnected) always visible, with automatic reconnect and a visible retry state — never let the UI silently go stale
- Global "Ramp all" / "Reset to defaults" / "Freeze all" quick actions
- Responsive layout: usable on a tablet next to the physical hardware, not just a wide monitor
- Dark mode as default (lab/instrument aesthetic), with a light mode toggle
- Micro-interactions: value changes should animate smoothly (no jarring snaps), out-of-range or disconnected sensors should be visually flagged (color + icon, not color alone)
- Accessibility: proper labels on all inputs, sufficient contrast, keyboard-operable sliders

Use your judgment on component library / styling approach (Tailwind, CSS modules, styled-components, shadcn/ui, etc.) — pick one, stay consistent, and tell me what you chose and why in a short summary when done.

### Goal B — 3D circuit visualization with Three.js
Add a 3D scene (new page or a toggleable panel, e.g. "3D View") that shows:

1. **The two boards**: a stylized ESP32 dev board and an Arduino Uno board, positioned facing each other or side-by-side, built from simple extruded/box geometries — this does not need to be photorealistic, a clean low-poly / schematic style is preferred (think "exploded technical diagram" aesthetic, not a rendered product photo)
2. **Labeled GPIO pin headers** on each board at roughly correct relative positions, with hover/click tooltips showing pin name (e.g. "GPIO18") and assigned function (e.g. "Gas — PWM")
3. **Wires** as 3D tube/line geometry connecting each ESP32 pin to its corresponding Arduino pin, plus a ground wire, following the current pin mapping (pull this from live app state if pin reassignment is a feature — don't hardcode if it doesn't need to be)
4. **Live signal animation on each wire**, driven by the real WebSocket state:
   - PWM wires: animate a pulsing glow/flow effect along the wire whose duty cycle visually reflects the live duty cycle (e.g. flowing dashes whose on/off ratio matches the actual PWM duty cycle, or a color intensity tied to value)
   - DAC/analog wires: animate a steady glow whose brightness/color maps continuously to the live analog value
   - Each wire's color-mapped value should use the same color scale as its 2D card, so the two views feel like one system
5. **Camera controls**: orbit/pan/zoom (OrbitControls), plus a "reset view" button and maybe 2–3 preset camera angles (top-down "wiring diagram" view, isometric "hero" view)
6. **Click a wire or pin → highlights the corresponding sensor card in the 2D panel** (and vice versa), so the two views stay linked
7. Keep frame budget sane — target 60fps on a mid-range laptop; use instancing/simple materials, avoid unnecessary shadows/post-processing unless it's cheap

Technical notes:
- Use `three` (already available) with `@react-three/fiber` + `@react-three/drei` if you're in the React/Vite desktop app — this is the idiomatic way to integrate Three.js into React and will make the linked 2D/3D state sync much easier than raw imperative Three.js
- Keep the 3D scene as its own component tree, subscribing to the same WebSocket state store as the 2D dashboard (single source of truth — do not create a second parallel state)
- If you're instead adding this to the embedded ESP32-hosted dashboard (plain HTML/JS), use vanilla Three.js via CDN import and keep the bundle size constraint from Section 0 in mind — this is the harder, more size-constrained option, so prefer doing this in the desktop app unless told otherwise

---

## 3. Non-Goals / Guardrails

- Do not touch firmware, backend Python, or the WebSocket message schema
- Do not invent sensor types or scenarios beyond STATIC/RAMP unless asked
- Do not replace the WebSocket transport with polling or a different protocol
- Do not commit API keys, Wi-Fi credentials, or secrets — `secrets.h` and any `.env` stay untouched and out of version control
- If the existing pin mapping or protocol needs to change to support a feature (e.g. exposing live per-pin duty cycle for the 3D animation, if it isn't already broadcast), **stop and propose the exact JSON field(s) you'd add** rather than silently assuming they exist

---

## 4. Suggested Approach / Order of Work

1. Audit the current frontend code (`desktop/frontend/` and/or the embedded dashboard HTML) and summarize its structure back to me in a few sentences before changing anything
2. Set up/confirm the component library and design tokens (colors, spacing, typography) — this becomes the shared visual language for both the 2D and 3D views
3. Rebuild the 2D dashboard per Goal A, keeping the existing WebSocket hook/service intact (refactor it into a clean shared store/context if it isn't already one)
4. Add the 3D scene per Goal B as a new route/panel, wired to the same state store
5. Link 2D ↔ 3D interactions (hover/click highlighting)
6. Test with the WebSocket mocked/simulated if no physical hardware is connected during dev (add a simple mock server or fixture data so the UI is testable standalone)
7. Give me a short summary of what changed, any new dependencies added, and any open questions/assumptions

---

## 5. Deliverable Checklist

- [ ] Redesigned 2D dashboard (cards, live values, sliders+inputs, scenario controls, connection status, dark/light mode)
- [ ] New 3D circuit view (boards, labeled pins, wires, live signal animation, camera controls)
- [ ] 2D/3D state fully shared (single WebSocket store, no duplicated logic)
- [ ] 2D ↔ 3D hover/click linking
- [ ] No changes to firmware/backend/protocol (or explicitly flagged proposed additions if needed)
- [ ] Short summary of design decisions, new dependencies, and assumptions made
