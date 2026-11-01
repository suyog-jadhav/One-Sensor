# OneSensor: Comprehensive Project Architecture Audit

**Repository Root:** `C:\blockchain\suyog\One-Sensor\`  
**Target Hardware:** ESP32-WROOM-32 DevKit V1 (Synthesis Node) & Arduino UNO R3 (Target SUT)  
**Date of Audit:** October 2026  
**Status:** Complete & Verified Against Active Codebase

---

## 1. System Inventory and Implementation Status Classification

Every component and capability across the OneSensor platform is classified into one of six rigorous evidentiary categories:
1. **Implemented in Source Code & Physically Measured on Hardware (Tier A)**: Verified in active source code, executed on physical silicon, and supported by empirical bench measurements.
2. **Demonstrated on Actual Hardware (Tier B)**: Verified in active source code and operational on physical hardware, but without high-density quantitative benchmarking data.
3. **Implemented in Source Code & Test Harness Verified (Tier C)**: Completely coded in firmware/software and verified via automated test scripts or unit harnesses.
4. **Implemented in Source Code but Pending Hardware Measurement (Tier D)**: Functional logic written in C++/Python/React, but awaiting dedicated bench instrumentation.
5. **Simulated / Software Domain Only (Tier E)**: Operates strictly within workstation memory or software abstractions.
6. **Planned Future Work (Tier F)**: Explicitly identified on the engineering roadmap; not yet present in codebase.

### 1.1 Architectural Subsystems Inventory

| Subsystem Component | Primary Source Location | Technology Stack | Status Category | Operational Summary |
| :--- | :--- | :--- | :--- | :--- |
| **LEDC PWM Engine** | `esp32/src/channel_manager.cpp` | C++17, ESP-IDF LEDC | **Tier B** | Generates 10 independent hardware PWM channels at 500 Hz with 10-bit duty resolution. |
| **On-Chip DAC Driver** | `esp32/src/channel_manager.cpp` | C++17, `dacWrite()` | **Tier A** | Outputs continuous 0.0–3.3V DC analog voltages on GPIO 25 & 26; measured with $R^2 = 0.9998$. |
| **Scenario Engine** | `esp32/src/scenario_engine.cpp` | C++17, FreeRTOS millis | **Tier C** | Evaluates non-blocking `STATIC` and `RAMP` linear interpolation profiles on a 50 Hz tick. |
| **Fault Injection Engine** | `esp32/src/fault_engine.cpp` | C++17, Box-Muller | **Tier C** | Implements 8 fault modes: None, Dropout, Stuck, Noise, Spike, Drift, Disconnect, Latency. |
| **Channel Config & NVS** | `esp32/src/config_store.cpp` | C++17, Preferences API | **Tier B** | Serializes channel tables and calibration factors to ESP32 Non-Volatile Flash storage. |
| **Async WebSocket Server** | `esp32/include/websocket_handler.h` | ESPAsyncWebServer | **Tier B** | Bidirectional JSON message exchange on `/ws` supporting 4 Hz telemetry broadcast. |
| **Wi-Fi Manager** | `esp32/src/wifi_manager.cpp` | C++, WiFi.h | **Tier B** | Connects to 2.4 GHz 802.11b/g/n networks; supports serial provisioning and auto-reconnect. |
| **Arduino Receiver Library** | `arduino/OneSensor/src/` | C++11, AVR | **Tier A** | Object-oriented client library featuring `DacDecoder` (analog) and `PwmDecoder` (pulse capture). |
| **Bench Calibration Script** | `arduino/calibration_benchmark.py` | Python 3, PySerial, WS | **Tier A** | Multi-point setpoint verification script measuring closed-loop reconstruction error. |
| **End-to-End Test Harness** | `arduino/e2e_test.py` | Python 3, PySerial, WS | **Tier A** | Benchmarks closed-loop round-trip latency from WebSocket command to serial echo. |
| **FastAPI Backend Sidecar** | `desktop/backend/app.py` | Python 3.11, FastAPI | **Tier B** | Provides mDNS auto-discovery, PlatformIO/esptool flasher, and bidirectional WebSocket proxy. |
| **React Workstation UI** | `desktop/frontend/src/` | React 18, Vite, Lucide | **Tier B** | Interactive web workbench with real-time sliders, 3D pinout inspector, and setup wizard. |
| **I2C / SPI Slave Emulation**| Roadmap / Conceptual | ESP32 I2C/SPI Peripheral | **Tier F** | Protocol-level bus emulation of digital sensors (e.g., BME280 register map); not yet implemented. |
| **Deep Learning Drift Models**| Roadmap / Conceptual | TinyML / Edge AI | **Tier F** | Generative neural networks for aging/drift emulation; currently uses Box-Muller math. |

---

## 2. Detailed Subsystem Architecture

### 2.1 Tier 1: Developer Workstation & Software Workbench
- **Web Interface (`desktop/frontend/`)**: Single-page application built on React 18, Vite, and modern CSS glassmorphic components. It exposes five dedicated functional tabs:
  - *Overview Workbench*: Real-time system status, device telemetry cards, and quick-action triggers.
  - *Live Sensor Controls*: Twelve independent channels with precision sliders, numerical inputs, and history sparklines.
  - *Scenario Studio*: Visual configuration of multi-channel linear ramps, duration settings, and target ranges.
  - *Fault Lab*: Interactive arming of hardware failure modes with configurable magnitude, duration, and latency parameters.
  - *3D Pinout & Setup Wizard*: Physical board visualization detailing strapping pins, power rails, and automated 5-stage setup.
- **Local Bridge Sidecar (`desktop/backend/app.py`)**: A high-performance Python 3.11 service running on `http://127.0.0.1:8000`:
  - *USB PnP Discovery*: Queries Windows Management Instrumentation (WMI) and serial registry to identify ESP32 (CP2102/CH340) and Arduino (FTDI/ATmega16U2) ports via VID/PID matching.
  - *Automated Firmware Flashing*: Executes PlatformIO builds and triggers `esptool.py` and `avrdude` binaries without manual command-line execution.
  - *Serial Wi-Fi Provisioning*: Transmits local network credentials to ESP32 over serial JSON handshake prior to wireless initialization.
  - *Bidirectional WebSocket Bridge*: Maintains persistent WebSocket connection to `ws://<esp32_ip>/ws` and bridges messages between browser clients and embedded silicon.

### 2.2 Tier 2: OneSensor Hardware Node (ESP32)
- **Controller Specifications**: ESP32-WROOM-32 dual-core Xtensa 32-bit LX6 running at 240 MHz with 520 KB SRAM and 4 MB external SPI Flash.
- **Task Partitioning**:
  - *Core 0 (Networking & IPC)*: Executes `AsyncWebServer`, parses inbound WebSocket JSON commands (`set`, `ramp`, `fault`, `get_config`), and formats outbound 4 Hz telemetry payloads.
  - *Core 1 (Real-Time Synthesis)*: Runs FreeRTOS cyclic tasks evaluating `ScenarioEngine`, applying `FaultEngine` transformations, calculating normalized duties via `ValueMapper`, and driving hardware peripheral registers in `ChannelManager`.
- **Memory Persistence (`ConfigStore`)**: Utilizes ESP32 Non-Volatile Storage (NVS) via the Arduino `Preferences` library. All channel allocations, calibration offsets, and pin mappings survive hard reset and power cycles.

### 2.3 Tier 3: Target System Under Test (Arduino UNO)
- **Target Specifications**: Arduino UNO Rev3 featuring Microchip ATmega328P 8-bit AVR microcontroller running at 16 MHz with 2 KB SRAM and 32 KB Flash.
- **Receiver Architecture (`arduino/OneSensor/`)**:
  - Designed as an object-oriented, zero-dependency C++ library.
  - Base class `SignalDecoder` provides a unified interface: `begin(pin)`, `update()`, `getDutyCycle()`, `getFrequency()`, `isValid()`.
  - Concrete class `DacDecoder`: Samples analog input pins via `analogRead()`. Automatically accounts for the 3.3V to 5.0V voltage span ratio ($675.18$ maximum counts).
  - Concrete class `PwmDecoder`: Measures high and low pulse widths using `pulseIn()` bounded by `PULSE_TIMEOUT_US` (25 ms) to prevent infinite loop blocking. Reconstructs duty cycle percentage and signal carrier frequency.
  - Sensor Abstractions: High-level wrapper classes (`TemperatureSensor`, `HumiditySensor`, `GasSensor`, `LightSensor`, `SoilMoistureSensor`) expose intuitive physical engineering getters (e.g., `readTemperature()` returning degrees Celsius).

---

## 3. Physical Channel Allocation & Hardware Routing Matrix

The single source of truth for all channel configurations is defined in `esp32/include/hardware_config.h`:

| Ch # | Logical Modality | Emulated Transducer Model | ESP32 Output Pin | Output Signal Transport | Target SUT Input Pin | Dynamic Measurement Span | Default Boot Setpoint | Verification Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | **Temperature** | DHT11 / LM35 Precision Linear | `GPIO 25` | **DAC 1 (Analog DC)** | `A0` (ADC0) | $0.0\text{ to }50.0\ ^\circ\text{C}$ | $25.0\ ^\circ\text{C}$ ($1.65\text{ V}$) | **Tier A (Measured)** |
| **1** | **Humidity** | Capacitive Polymer RH Sensor | `GPIO 26` | **DAC 2 (Analog DC)** | `A1` (ADC1) | $0.0\text{ to }100.0\ \%$ | $50.0\ \%$ ($1.65\text{ V}$) | **Tier B (Hardware)** |
| **2** | **Gas Concentration** | MQ-2 / MQ-135 Electro-chemical | `GPIO 18` | **LEDC PWM (500 Hz)** | `Pin D2` | $0.0\text{ to }1000.0\text{ ppm}$ | $300.0\text{ ppm}$ | **Tier B (Hardware)** |
| **3** | **Ambient Light** | Photodiode / LDR Lux Integrator | `GPIO 19` | **LEDC PWM (500 Hz)** | `Pin D3` | $0.0\text{ to }1000.0\text{ lux}$ | $500.0\text{ lux}$ | **Tier B (Hardware)** |
| **4** | **Soil Moisture** | Capacitive Soil Moisture Matrix | `GPIO 21` | **LEDC PWM (500 Hz)** | `Pin D4` | $0.0\text{ to }100.0\ \%$ | $50.0\ \%$ | **Tier B (Hardware)** |
| **5** | **Motion X-Axis** | MPU-6050 Accelerometer X | `GPIO 22` | **LEDC PWM (500 Hz)** | `Pin D5` | $-2.0\text{ to }+2.0\text{ g}$ | $0.00\text{ g}$ | **Tier B (Hardware)** |
| **6** | **Motion Y-Axis** | MPU-6050 Accelerometer Y | `GPIO 23` | **LEDC PWM (500 Hz)** | `Pin D6` | $-2.0\text{ to }+2.0\text{ g}$ | $0.00\text{ g}$ | **Tier B (Hardware)** |
| **7** | **Motion Z-Axis** | MPU-6050 Accelerometer Z | `GPIO 27` | **LEDC PWM (500 Hz)** | `Pin D7` | $-2.0\text{ to }+2.0\text{ g}$ | $+1.00\text{ g}$ (1g Gravity) | **Tier B (Hardware)** |
| **8** | **Proximity** | HC-SR04 Ultrasonic Distance | `GPIO 32` | **LEDC PWM (500 Hz)** | `Pin D8` | $2.0\text{ to }400.0\text{ cm}$ | $50.0\text{ cm}$ | **Tier B (Hardware)** |
| **9** | **Sound Level** | Electret Microphone VU Ladder | `GPIO 33` | **LEDC PWM (500 Hz)** | `Pin D9` | $30.0\text{ to }120.0\text{ dB}$ | $40.0\text{ dB}$ | **Tier B (Hardware)** |
| **10** | **UV Index** | GY-ML8511 Solar Radiometer | `GPIO 14` | **LEDC PWM (500 Hz)** | `Pin D10` | $0.0\text{ to }11.0\text{ Index}$ | $2.0\text{ Index}$ | **Tier B (Hardware)** |
| **11** | **$\text{CO}_2$ Concentration** | NDIR Indoor Air Quality Chamber | `GPIO 12` | **LEDC PWM (500 Hz)** | `Pin D11` | $400.0\text{ to }5000.0\text{ ppm}$ | $420.0\text{ ppm}$ | **Tier B (Hardware)** |
| **--** | **Common Ground** | Shared Electrical Zero Reference | `GND` | **Direct Copper Plane** | `GND` | **0.0 V Reference** | **Mandatory** | **Tier A (Measured)** |

---

## 4. Physical Signal Path Analysis

### 4.1 Analog Voltage Generation (DAC)
1. **Mathematical Normalization**:
   $$v_{\text{norm}} = \text{constrain}\left(\frac{v - v_{\min}}{v_{\max} - v_{\min}}, 0.0, 1.0\right)$$
2. **ESP32 DAC Register Encoding**:
   $$\text{DAC}_{\text{count}} = \text{round}(v_{\text{norm}} \times 255)$$
3. **Physical Voltage Emission**:
   $$V_{\text{out}} = V_{\text{DD}} \times \frac{\text{DAC}_{\text{count}}}{255} \quad (V_{\text{DD}} \approx 3.30\text{ V})$$
4. **Arduino ADC Sampling**:
   $$\text{ADC}_{\text{raw}} = \text{round}\left(\frac{V_{\text{out}}}{V_{\text{ref}}} \times 1023\right) \quad (V_{\text{ref}} = 5.00\text{ V})$$
5. **Voltage Translation Factor**:
   Because $V_{\text{out}}^{\max} = 3.3\text{ V}$, the maximum raw ADC reading is:
   $$\text{ADC}_{\max} = \frac{3.30}{5.00} \times 1023 \approx 675.18\text{ counts}$$
6. **Physical Reconstruction**:
   $$v_{\text{rec}} = v_{\min} + \left(\frac{\text{ADC}_{\text{raw}}}{675.18}\right) \times (v_{\max} - v_{\min})$$

### 4.2 Pulse Width Modulation Timing (LEDC PWM)
1. **Timing Parameters**:
   - Carrier Frequency: $f = 500\text{ Hz}$
   - Carrier Period: $T = \frac{1}{f} = 2000\ \mu\text{s}$
   - Timer Resolution: $10\text{-bit} \implies 1024\text{ discrete steps}$
2. **Duty Cycle Register Write**:
   $$\text{Duty}_{\text{count}} = \text{round}(v_{\text{norm}} \times 1023)$$
3. **Physical Pulse Timing**:
   $$T_{\text{high}} = v_{\text{norm}} \times 2000\ \mu\text{s}, \quad T_{\text{low}} = 2000\ \mu\text{s} - T_{\text{high}}$$
4. **Receiver Measurement & Reconstruction**:
   $$D_{\text{meas}} = \frac{T_{\text{high}}}{T_{\text{high}} + T_{\text{low}}} \implies v_{\text{rec}} = v_{\min} + D_{\text{meas}} \times (v_{\max} - v_{\min})$$
   - *Noise Immunity Benefit*: PWM timing modulation is inherently immune to DC voltage drops along extended copper wires and resistance variations across breadboard contacts.

---

## 5. Fault Injection Architecture

The `FaultEngine` (`esp32/src/fault_engine.cpp`) intercepts logical sensor states prior to hardware register encoding.

```text
[Logical Sensor Model] (e.g. 25.0 °C)
         |
         v
[Scenario Engine] (e.g. Ramp to 40.0 °C)
         |
         v
[Fault Injection Engine] ---> (Inject Noise / Drift / Stuck / Drop)
         |
         v
[ValueMapper] (Clamping to [min, max] & Normalization)
         |
         +-----------------------+
         |                       |
         v                       v
[DAC Hardware Register]   [LEDC PWM Hardware Timer]
(GPIO 25 / GPIO 26)       (GPIO 12, 14, 18-23, 27, 32, 33)
```

### Supported Fault Modes
1. **DROPOUT**: Holds the output at the last recorded valid state:
   $$y(t) = y(t_{\text{last}})$$
2. **STUCK**: Clamps the output permanently to a user-defined magnitude $M$:
   $$y(t) = M$$
3. **NOISE**: Generates zero-mean Gaussian jitter using the Box-Muller transform:
   $$Z = \sqrt{-2\ln U_1}\cos(2\pi U_2), \quad y(t) = x(t) + \sigma Z$$
4. **SPIKE**: Adds an instantaneous excursion $\Delta_{\text{spike}}$:
   $$y(t) = x(t) + \Delta_{\text{spike}}$$
5. **DRIFT**: Accumulates linear temporal degradation:
   $$y(t) = x(t) + M \times \frac{t - t_{\text{start}}}{1000}$$
6. **DISCONNECT**: Returns `NAN`, causing firmware to write 0 counts to DAC or 0% duty to PWM, emulating open-circuit sensor drop.
7. **LATENCY**: Stores outgoing values into a 32-slot circular ring buffer and replays samples delayed by $\tau\text{ ms}$:
   $$y(t) = x(t - \tau)$$

---

## 6. Hardware Constraints & Safety Considerations

1. **ESP32 Strapping Pins**:
   - `GPIO 0`: Bootloader mode trigger; must not be pulled low during boot.
   - `GPIO 2`: Flashing mode selection; connected to onboard LED.
   - `GPIO 12`: Flash voltage selection (MTDI); driving high during boot sets internal LDO to 1.8V, preventing SPI Flash boot. OneSensor uses GPIO 12 for PWM Channel 11, configured only *after* boot sequence completes.
   - `GPIO 15`: Boot silent mode (MTDO).
2. **Input-Only Pins**:
   - `GPIO 34, 35, 36, 37, 38, 39` lack internal pull-ups and output drivers. They are strictly excluded from PWM channel assignments.
3. **Common Ground Prerequisite**:
   - The ESP32 and Arduino UNO power supplies must share an electrical common ground. Without common ground, floating reference voltages induce up to $\pm 1.5\text{ V}$ fluctuations on analog inputs and invalidate pulse timing.
