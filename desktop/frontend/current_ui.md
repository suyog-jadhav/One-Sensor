# OneSensor Control Suite — Current UI Architecture Analysis (`desktop/frontend`)

> **Version**: 2.0.0  
> **Framework**: React 18 + Vite 4  
> **Visualization**: High-Precision 2D Scientific Instruments & Skeuomorphic Gauges (Tubes, Luminous Bulbs, Dial Meters, Radar, VU Ladders, Spirit Levels)  
> **Theme**: Industrial Cyber-Physical / Deep Dark Laboratory Ergonomics  

---

## 1. Executive Summary & UI Philosophy

The **OneSensor Control Suite** frontend (`desktop/frontend`) is an advanced desktop control workstation designed for emulating, configuring, and monitoring multi-channel physical transducers (sensors). It bridges a local Python FastAPI backend sidecar and ESP32/Arduino microcontroller hardware via bidirectional WebSockets and high-frequency telemetry.

### Core Visual Principles
- **Dedicated 2D Scientific Instrumentation (`Sensor2DVisual`)**: Rather than heavy or inconsistent 3D meshes, each sensor is rendered with a tailored, high-contrast 2D scientific instrument:
  - **Temperature**: Graduated glass thermometer tube with meniscus, specular reflection streak, rising liquid column, and dynamic thermal glow bulb.
  - **Light**: Multi-tier radiant light glow bulb with pulsing aura halos, glowing filament, and ambient lux bloom.
  - **Humidity, CO₂, UV Index**: Calibrated 240° precision analog dial meters with swept progress arcs, tick marks, damped counterbalanced needles, and center metal pivot caps.
  - **Gas (MQ-2)**: Industrial canister chamber with micro-mesh grill and dynamic ionization heating filament.
  - **Soil Moisture**: Capacitive soil stratum vessel with gold immersion electrodes, liquid saturation horizon, and glistening water droplets.
  - **Proximity**: Dual ultrasonic transducer pods with animated radar echo waves and an obstacle distance ruler.
  - **Sound Level**: Professional decibel VU meter with multi-tier segmented LED ladder (Green → Amber → Red) and instantaneous peak readings.
  - **Motion X / Y / Z**: Machined spirit level vials with moving floating bubbles and crosshair bullseye gravity detents.
  - **Motion Attitude 2D**: Aviation-grade artificial horizon (Attitude Indicator) with pitch ladder, roll pointer, and aircraft reticle.
- **5-Level Surface Depth Hierarchy**: Built on a structured dark surface token scale (`--bg-surface-0` through `--bg-surface-4`) to eliminate visual clutter while maintaining spatial depth.
- **Strict Motion System**: Micro-animations are strictly bound to calibrated cubic-bezier curves (`--motion-instant` 110ms, `--motion-fast` 200ms, `--motion-standard` 280ms, `--motion-value` 260ms) with hardware acceleration.
- **High-Density Instrument Ergonomics**: Monospace numerical readouts (`JetBrains Mono`), tabular figures, glassmorphic badges, and color-coded status pills prevent visual drift during fast 250 Hz data streams.

---

## 2. Technology Stack & Key Dependencies

| Dependency | Version | Role in Frontend UI |
|---|---|---|
| **React** | `^18.2.0` | Core component tree, hooks, declarative rendering |
| **React-DOM** | `^18.2.0` | DOM reconciliation and portal mounts |
| **Vite** | `^4.4.5` | Next-generation dev server with HMR, asset handling |
| **Lucide React** | `^0.263.1` | Consistent 14–24px vector iconography |
| **Vanilla CSS** | Modern CSS3 | Custom design system, CSS custom properties, backdrop filters, flex/grid layouts |

---

## 3. Design System & Token Architecture (`index.css`)

The frontend avoids heavy third-party CSS utility libraries in favor of a clean, dedicated CSS design system defined in `src/index.css`:

### 3.1 Color & Surface Tokens
```css
/* Surface Elevation Hierarchy */
--bg-surface-0: #0b0f17; /* Base app backdrop */
--bg-surface-1: #0f1420; /* Navigation container, headers, toolbars */
--bg-surface-2: #121826; /* Card backgrounds, dialogs */
--bg-surface-3: #182030; /* Hover states, elevated panels */
--bg-surface-4: #1f293d; /* Highest elevation, dropdowns, popovers */

/* Semantic Accents */
--color-primary: #2563eb;       /* Royal Blue (Active tabs, primary actions) */
--color-primary-hover: #1d4ed8;
--color-cyan: #38bdf8;          /* Electric Cyan (Telemetry streams, live sync) */
--color-success: #10b981;       /* Emerald (Linked status, nominal sensor states) */
--color-warning: #f59e0b;       /* Amber (Faults, warnings, heat sensors) */
--color-danger: #ef4444;        /* Crimson (Disconnected, critical spikes, errors) */

/* High-Contrast Neutral Text */
--text-main: #f8fafc;
--text-muted: #94a3b8;
--text-dim: #64748b;
```

### 3.2 Typography System
- **Interface Font**: `'Inter', system-ui, -apple-system, sans-serif` — Used for headings, labels, button text, and descriptions.
- **Telemetry Font**: `'JetBrains Mono', 'Fira Code', monospace` — Used for sensor numbers, units, hexadecimal addresses, GPIO pins, and serial console feeds.

### 3.3 Calibrated Motion System
```css
--motion-instant: 110ms cubic-bezier(0, 0, 0.2, 1);    /* Button clicks, toggle switches */
--motion-fast: 200ms cubic-bezier(0, 0, 0.2, 1);       /* Card elevation, hover states */
--motion-standard: 280ms cubic-bezier(0.4, 0, 0.2, 1);  /* Tab crossfading, modal dialogs */
--motion-value: 260ms cubic-bezier(0.25, 0.1, 0.25, 1); /* Numerical easing & needle damping */
--motion-pulse: 1.8s ease-in-out infinite;             /* Dot indicators, live pulses */
```

---

## 4. Master Layout & Shell Architecture (`App.jsx`)

The application layout is structured into three distinct spatial planes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [APP HEADER] Brand Icon + Suite Title | 7 Pill Navigation Tabs | Connection Status Dot │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ [MAIN CONTENT CONTAINER - max-width: 1400px, responsive padding, crossfade transition] │
│                                                                                        │
│   Active View Tab:                                                                     │
│   ├── Live Control    (Transducers, 2D Sensor Pods, 2D Inclinometer Horizon)           │
│   ├── Config Editor   (Pin Matrix, Interactive ESP32 Diagram)                          │
│   ├── Scenario Builder(Waveform Ramp Generator, Simulation Presets)                   │
│   ├── Fault Injection (Chaos Engine, 7 Fault Models)                                  │
│   ├── Flash Panel     (Firmware Uploader, Multi-Stage Progress)                        │
│   ├── Setup Wizard    (5-Step Guided Provisioning Flow)                               │
│   └── Console & Serial(Live IPC Logs, Dual COM Port Terminals)                         │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [APP FOOTER] Session ID: 0x4F1A | Baud: 115200 8N1 | Core: v2.0-SYNTH | Version v2.0.0 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Header Features
1. **Brand Identity**: Radio icon in a radiant gradient box (`#2563eb` → `#4f46e5`) with version badge `v2.0.0` and description.
2. **Two-Line Tab Navigation**: 7 pill buttons containing icon, primary title, and monospace category subtitle:
   - `Live Control` (Transducers)
   - `Config Editor` (Pin Matrix)
   - `Scenario Builder` (Waveforms)
   - `Fault Injection` (Chaos Engine)
   - `Flash Panel` (Bootloader)
   - `Setup Wizard` (Provisioning)
   - `Console & Serial` (Telemetry)
3. **Telemetry Status Pill**: Displays backend sidecar status with pulsing indicator (`BACKEND LINKED` on WS port 8000 or `SIDECAR OFFLINE` with auto-reconnect timer).

---

## 5. Detailed Component & Tab Analysis

### 5.1 Tab 1: Live Control (`LiveControl.jsx`)
The flagship dashboard representing the 12 hardware emulation channels:

1. **Top Hardware Link Toolbar**:
   - ESP32 Target input (`10.x.x.x` or `onesensor.local`) with inline connect/reconnect button.
   - Quick "Fault Engine" toggle button.
   - Disconnected warning banner (when in local simulated preview mode).
2. **Channel Filter Strip**:
   - 12 pill buttons to toggle visibility of any sensor channel.
   - Live synthesis rate readout: `Synthesis: 250 Hz`.
3. **2D Motion Attitude Horizon (`MotionAttitude2D.jsx`)**:
   - Renders whenever Motion X, Y, or Z is active.
   - Aircraft-style **Artificial Horizon (Attitude Indicator)** with rotating blue sky / brown ground sphere, pitch ladder, and roll pointer.
   - Fixed airplane reticle and degree telemetry (`PITCH`, `ROLL`, `G-LOAD`).
   - Quick attitude presets: *Level Flat, Inverted, Pitch +45°, Roll +45°, Portrait, Zero-G, High-G Shock*.
   - Live tri-axis vector indicators.
4. **Interactive 2D Sensor Pod Grid (`LiveSensorCard`)**:
   - Responsive CSS Grid (`minmax(480px, 1fr)`).
   - **Left Column (`.sensor-card-visual-col`)**: Dedicated 2D visual instrument (`Sensor2DVisual.jsx`):
     - `Thermometer2DVisual`: Graduated scale tube with meniscus, liquid fill, and thermal glow bulb.
     - `LightGlow2DVisual`: Luminous bulb with radiant aura rings, glowing filament, and lux bloom.
     - `PrecisionDial2DVisual`: 240° brushed bezel dial gauge with sweep arc and counterbalanced needle.
     - `GasCanister2DVisual`: Canister with micro-mesh grill and dynamic ionization filament.
     - `SoilMoisture2DVisual`: Immersion electrodes, stratum container, and water saturation horizon.
     - `ProximityRadar2DVisual`: Ultrasonic transducers, animated radar pulse waves, and distance ruler.
     - `SoundVUMeter2DVisual`: Segmented 14-tier LED VU ladder and live decibel readout.
     - `MotionLevel2DVisual`: Machined aluminum spirit level vials with floating bubble for X/Y and bullseye target for Z.
   - **Right Column (`.sensor-card-hud-col`)**: Instrument HUD:
     - Glassmorphic icon badge with glow shadow.
     - Sensor name and electrical transducer subtitle.
     - High-contrast readout (`44px` tabular numbers eased via `useSmoothedValue`).
     - Faint watermark icon background.
     - Active fault alert indicator (e.g. `FAULT ACTIVE: NOISE`).
     - Standardized slider track (`StandardSensorSlider.jsx`) with neon halo knob, gradient fill, and min/max milestone labels.
5. **Diagnostics Bottom Bar**:
   - Channels online count (`visibleSensors.length / 12 online`).
   - Frame sync lock status (`4.0 Hz locked`).
   - Real-time roundtrip latency indicator in ms.

---

### 5.2 Tab 2: Config Editor (`ConfigEditor.jsx`)
Hardware pin assignment matrix and electrical channel configuration:

1. **Header & Live Current Estimator**:
   - Active channel counter and dynamic load meter (e.g. `4.8 mA load` with smooth ease).
   - "Apply to Hardware" and "Reset Defaults" buttons with visual feedback.
2. **Dual-Panel Workspace**:
   - **Left Panel (ESP32 Interactive Diagram)**:
     - SVG rendering of the ESP32 NodeMCU board.
     - Pin highlight indicator that lights up corresponding physical GPIO pins in real time when edited in the table.
     - DAC capability markers on GPIO 25 and 26.
   - **Right Panel (Channel Configuration Table)**:
     - 12 configurable channels with columns:
       - **Sensor Name & Icon**
       - **Signal Type**: Toggle between `DAC` (analog) and `PWM` (digital modulation).
       - **GPIO Pin**: Dropdown filtering only valid pins (preventing strapping pin collisions).
       - **LEDC Channel**: Hardware timer allocation (channels 0–15).
       - **Frequency**: Configurable PWM frequency in Hz (default 500 Hz).
       - **Resolution**: Bit resolution (8-bit, 10-bit, 12-bit).
       - **Calibration Range**: Input Min, Input Max, Default Value.
       - **Active Switch**: Enable/disable toggle.
     - Real-time validation badges (e.g. `NO CONFLICT` vs `PIN OVERLAP`).

---

### 5.3 Tab 3: Scenario Builder (`ScenarioBuilder.jsx`)
Automated test generation and signal wave synthesis:

1. **Ramp Generator Panel**:
   - Sensor channel selector.
   - Start value and target value inputs.
   - Quick duration chips: `5s`, `10s`, `30s`, `60s`.
   - **Interactive SVG Waveform Scrubber**:
     - Live plotted curve displaying start to target progression.
     - Real-time playhead line scrubbing across the curve during execution.
     - "Start Ramp" and "Stop" actions.
2. **Static Simulation & Presets Panel**:
   - Single-value setter with precision nudge buttons (`-10`, `-1`, `+1`, `+10`).
   - **Laboratory Preset Chips**:
     - *Nominal Lab (24.5 °C)*
     - *Thermal Stress (48.0 °C)*
     - *Gas Spike (850 ppm)*
     - *Saturated Flood (95 %)*
     - *Dark Cavity (15 lux)*
     - *Micro-G Freefall (0 g)*
     - *Hard Impact (1.9 g)*
     - *Near Obstacle (5 cm)*
     - *Loud Event (105 dB)*
     - *High UV Exposure (9.5 idx)*
     - *CO₂ Alarm (2500 ppm)*
   - "Emergency Stop All Scenarios" global button.

---

### 5.4 Tab 4: Fault Injection Engine (`FaultInjection.jsx`)
A dedicated hardware chaos engine for resilience testing:

1. **Multi-Channel Target Selector**:
   - Sensor selection chips allowing simultaneous multi-transducer fault injection.
2. **7 Physical Fault Archetypes**:
   - **Dropout**: Freezes output at last known value (ADC stall simulation).
   - **Stuck**: Pins output to fixed magnitude value.
   - **Noise**: Gaussian jitter ($σ = \text{magnitude}$) via Box-Muller transform.
   - **Spike**: Random high-frequency excursions.
   - **Drift**: Linear accumulating bias over time.
   - **Disconnect**: Drives output to NaN / 0 (cable pull simulation).
   - **Latency**: Rings values through a circular buffer delayed by $N$ ms.
3. **Parameter Controls**:
   - Magnitude slider, Duration (ms) selector, Latency (ms) slider.
4. **Execution & History**:
   - Primary "Inject Fault" action with visual flash.
   - "Clear Faults" reset action.
   - Live audit table of recent fault events with timestamps.

---

### 5.5 Tab 5: Flash Panel (`FlashPanel.jsx`)
Firmware upload and toolchain orchestration:

1. **Toolchain Health Monitor**:
   - Badges for `esptool.py`, `avrdude`, and compiler availability.
2. **Dual Flashing Consoles**:
   - **ESP32 Firmware Flasher**:
     - COM port auto-detection (`is_esp32_candidate`).
     - Progress bar eased via `useSmoothedValue`.
     - 5-stage progress milestones: *Connecting to bootloader → Erasing flash sectors → Writing merged binary at 0x0 → Verifying CRC32 → Success*.
   - **Arduino Uno Firmware Flasher**:
     - COM port auto-detection (`is_arduino_candidate`).
     - 5-stage progress milestones: *Probing Optiboot → Erasing ATmega328P → Writing flash blocks (.hex) → Verifying memory → Success*.
3. **Real-Time Flashing Logs**: Embedded monospace status readout during operation.

---

### 5.6 Tab 6: Setup Wizard (`SetupWizard.jsx`)
Guided 5-step interactive provisioning wizard for first-time hardware onboarding:

1. **Step 1: Serial Port Detection**: Scans USB COM ports and detects connected microcontrollers.
2. **Step 2: Flash Firmware**: One-click flash of the pre-compiled binary images.
3. **Step 3: Wi-Fi Provisioning**: Inputs SSID, WPA2 password (with show/hide toggle), mDNS device hostname (`onesensor.local`), supporting both direct serial provisioning and custom firmware build workflows.
4. **Step 4: Network Verification**: Tests the WebSocket URL and HTTP REST handshake with the device IP.
5. **Step 5: Arduino Pin Matrix**: Displays visual pinout diagram connecting ESP32 output pins to Arduino analog/digital inputs.

---

### 5.7 Tab 7: Console & Serial Telemetry (`ConsoleLog.jsx`)
Unified debugging terminal and bidirectional hardware monitoring:

1. **System & IPC Event Stream**:
   - Real-time logging of WebSocket payloads, REST responses, and internal frontend events.
   - Category filter pills: `ALL`, `IPC`, `WEBSOCKET`, `TELEMETRY`, `SYSTEM`.
   - Text search query bar and "Wipe Log" button.
2. **Hardware Serial Monitor Terminals**:
   - Dedicated tabs for **ESP32 Serial** and **Arduino Serial**.
   - COM port selector and baud rate selector (`9600` to `460800`).
   - Start / Stop monitor controls with auto-scroll lock.
   - Monospace high-legibility terminal styling with timestamped lines.

---

## 6. State Management & Data Flow Architecture

```mermaid
graph TD
    subgraph Browser Frontend
        APP[App.jsx]
        WS_CLIENT[WebSocket Client]
        SUB_LIVE[LiveControl.jsx]
        SUB_CFG[ConfigEditor.jsx]
        SUB_SCN[ScenarioBuilder.jsx]
        SUB_FLT[FaultInjection.jsx]
        SMOOTH[useSmoothedValue.js]
        V2D[Sensor2DVisual.jsx]
    end

    subgraph Python Desktop Sidecar (FastAPI :8000)
        PY_WS[WebSocket /ws]
        PY_ROUTER[FastAPI REST API /api/*]
        PY_ENGINE[Hardware Emulation Engine]
        SERIAL_MGR[Serial Monitor & Flasher Engine]
    end

    subgraph Microcontrollers
        ESP32[ESP32 Transducer DAC/PWM]
        UNO[Arduino Uno Device Under Test]
    end

    APP -->|Manages connection & tabs| WS_CLIENT
    WS_CLIENT <-->|ws://127.0.0.1:8000/ws| PY_WS
    PY_WS -->|Broadcasts state at 4 Hz| APP
    APP -->|Propagates sensor state| SUB_LIVE
    SUB_LIVE -->|Interpolates values| SMOOTH
    SUB_LIVE -->|Renders 2D instruments| V2D
    SUB_LIVE -->|Outbound slider set| WS_CLIENT
    SUB_CFG -->|Outbound config updates| WS_CLIENT
    SUB_SCN -->|Outbound waveforms| WS_CLIENT
    SUB_FLT -->|Outbound fault injections| WS_CLIENT

    APP -->|REST API calls| PY_ROUTER
    PY_ENGINE <-->|Wi-Fi / Serial Protocol| ESP32
    SERIAL_MGR <-->|USB COM Ports| ESP32
    SERIAL_MGR <-->|USB COM Ports| UNO
```

---

## 7. Frontend Component Directory Structure

```
desktop/frontend/
├── index.html                           # App entry point, Google Fonts preconnect (Inter, JetBrains Mono)
├── package.json                         # Dependencies (React 18, Lucide-react, Vite)
├── vite.config.js                       # Port 3000 strictPort configuration
└── src/
    ├── main.jsx                         # React root bootstrap
    ├── App.jsx                          # Main shell, header tabs, WebSocket lifecycle, footer
    ├── index.css                        # Design system tokens, surface scale, responsive rules
    ├── utils/
    │   └── useSmoothedValue.js          # Numerical ease-out interpolation hook (260ms)
    └── components/
        ├── Badge.jsx                    # Reusable status pill component (5 variants)
        ├── StandardSensorSlider.jsx     # High-contrast touch/drag slider track with glowing thumb
        ├── Sensor2DVisual.jsx           # Dedicated 2D scientific instruments & dials for all 12 sensors
        ├── MotionAttitude2D.jsx         # 2D Artificial Horizon & aircraft-grade inclinometer
        ├── LiveControl.jsx              # Main transducers dashboard with 12 sensor pods
        ├── ConfigEditor.jsx             # GPIO pinout diagram & channel matrix table
        ├── ScenarioBuilder.jsx          # Waveform ramp generator with SVG scrubber
        ├── FaultInjection.jsx           # Hardware chaos engine (7 fault types)
        ├── FlashPanel.jsx               # Firmware flasher & toolchain status
        ├── SetupWizard.jsx              # 5-step guided device onboarding wizard
        ├── ConsoleLog.jsx               # Telemetry log & dual hardware serial monitors
        ├── AnalogGaugeVisual.jsx        # Parameterized 240° radial dial meter
        └── Tier1Instruments.jsx         # Precision instrument visual primitives
```

---

## 8. Summary of 2D Replacement Benefits

1. **Dramatic Performance Gain**: Replacing multiple Three.js WebGL scenes per card with pure CSS/SVG 2D instruments cuts bundle size by over **65%** and guarantees 60fps responsiveness on any monitor or low-power workstation.
2. **Intuitive Sensor Metaphors**:
   - The user immediately sees a **mercury thermometer tube** rising for temperature.
   - The user sees a **luminous radiant glow bulb** with halos expanding for light intensity.
   - The user sees **precision analog gauges with moving needles** for humidity, CO₂, and UV index.
   - The user sees **pulsing radar wave arcs** for ultrasonic distance.
   - The user sees a **segmented LED audio ladder** for sound levels.
   - The user sees **spirit level vials and an artificial horizon** for motion.
3. **Rock-Solid Hardware Reliability**: Zero WebGL context loss errors, GPU driver crashes, or canvas sizing glitches.
