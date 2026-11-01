# Comparison: Old Research Draft vs. Current Verified Implementation

**Historical Document:** `research/OneSensor_updated.pdf` (Extracted Text: `research/extracted_paper_text.txt`)  
**Current Codebase:** `C:\blockchain\suyog\One-Sensor\`  
**Date of Audit:** October 2026  
**Auditor:** Antigravity Research Discovery & Methodology Engine

---

## 1. Overview and Chronological Context

The previous manuscript draft (*"OneSensor: An ESP32-Based Intelligent Virtual Multi-Sensor Platform for Cost-Effective IoT Development and Testing"*) represents an intermediate conceptual and preliminary architectural proposal. While it outlined the fundamental vision of utilizing an ESP32 microcontroller to emulate sensor inputs for an external device under test (such as an Arduino UNO), several critical subsystems were either incomplete, described conceptually without empirical evidence, or contained placeholder figures.

The current repository represents a fully realized, three-tier Hardware-in-the-Loop (HIL) engineering platform featuring a production-ready firmware core, an extensible Arduino client library, a comprehensive workstation application (React 18 + FastAPI sidecar), and physical bench test measurements.

The following audit provides a systematic, item-by-item comparison between the claims in the historical draft and the verified realities of the current implementation.

---

## 2. Topic-by-Topic Discrepancy & Verification Matrix

| Topic / Dimension | Description in Old Paper (`OneSensor_updated.pdf`) | Current Verified Implementation (Source Code & Hardware) | Change / Contradiction Status | Verifying Evidence (Repository Paths) | Required Manuscript Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Identity & Scope** | Abstract conceptual platform for virtual sensors; primarily positioned as an educational/prototyping idea. | Fully realized 3-Tier Hardware-in-the-Loop (HIL) Test Platform with desktop GUI, local bridge, ESP32 node, and target Arduino receiver. | **Major Evolution:** Shift from theoretical concept to an operational, low-cost HIL platform. | `desktop/`, `esp32/`, `arduino/OneSensor/`, `project_report.md` | Reframe manuscript from conceptual proposal to an empirical, validated embedded HIL platform. |
| **Channel Capacity & Modalities** | Mentioned 5 baseline sensors (Temp, Humid, Gas, Light, Soil) and proposed extending to 12 channels. | 12 concurrently addressable channels permanently mapped in hardware: 2x 8-bit DAC (GPIO 25, 26) + 10x 10-bit PWM @ 500 Hz (GPIO 12, 14, 18, 19, 21, 22, 23, 27, 32, 33). | **Verified & Finalized:** The 12 channels are fully instantiated in firmware and hardware config. | `esp32/include/hardware_config.h` (L82–L96), `arduino/OneSensor/src/ArduinoChannelConfig.h` | Document all 12 channels with exact GPIO, frequency, resolution, and engineering spans. |
| **Physical Output Generation** | Conceptual mention of PWM and DAC; lacked exact circuit level equations and pin constraints. | Exact hardware drivers: `dacWrite()` on 8-bit R-2R DAC channels; ESP32 LEDC timer peripheral running 10-bit duty counts at 500 Hz carrier ($T = 2000\,\mu\text{s}$). | **Implemented & Characterized:** Full driver code active in `channel_manager.cpp`. | `esp32/src/channel_manager.cpp` (L29–L52, L83–L91) | Present formal electrical encoding and normalization equations ($v_{\text{norm}}$, DAC counts, PWM duty cycles). |
| **Workstation Architecture** | Generic description of a "browser-based dashboard hosted by or connected to the ESP32". | Decoupled 2-tier workstation: React 18 + Vite frontend paired with a local Python FastAPI sidecar (`app.py`) providing USB/PnP discovery, PlatformIO/esptool flashing, serial Wi-Fi provisioning, and WebSocket routing. | **Architectural Redesign:** ESP32 is relieved from serving heavy web assets; workstation handles UI and discovery. | `desktop/backend/app.py`, `desktop/frontend/src/`, `docs/desktop-app.md` | Update architecture diagram and text to accurately depict the React/Vite + FastAPI sidecar architecture. |
| **Target Decoding Architecture** | Conceptual mention that Arduino decodes signals; no concrete software abstractions provided. | Complete object-oriented C++ library (`OneSensor.h`) implementing `SignalDecoder` base interface, `DacDecoder` (sampling ADC with 3.3V/5.0V scaling), and `PwmDecoder` (timeout-guarded `pulseIn()` capture). | **New Implementation:** Production-grade Arduino library with examples and validity tracking. | `arduino/OneSensor/src/` (`OneSensor.h`, `SignalDecoder.h`, `DacDecoder.cpp`, `PwmDecoder.cpp`) | Detail the receiver library architecture, decoding mathematics, and non-blocking validity window design. |
| **Scenario Engine** | Mentioned static and dynamic scenarios in abstract terms (e.g., fire, agriculture). | Embedded non-blocking `ScenarioEngine` evaluating `STATIC` setpoints and `RAMP` linear interpolations on 50 Hz firmware ticks. | **Implemented in Silicon:** Real-time state machine in firmware evaluated without blocking delays. | `esp32/src/scenario_engine.cpp`, `esp32/include/scenario_engine.h` | Formalize scenario mathematical models and report firmware update rate. |
| **Fault Injection Capabilities** | Listed 7 fault types conceptually in Table 3 with theoretical mathematical transforms. | 8 concrete fault classes implemented in `fault_engine.cpp`: NONE, DROPOUT (freeze), STUCK (clamped), NOISE (Box-Muller Gaussian), SPIKE, DRIFT (linear time accumulation), DISCONNECT (output muted/NaN), LATENCY (32-slot circular ring buffer). | **Fully Implemented:** Includes auto-expiration timer (`durationMs`) and ring-buffer latency delay. | `esp32/src/fault_engine.cpp` (L14–L100), `esp32/include/hardware_config.h` (L41–L60) | Document the exact mathematical algorithms implemented in C++, including Box-Muller jitter and ring buffer delay. |
| **Experimental Measurements** | Stated that latency, jitter, and decoder overhead "require empirical measurement on physical hardware and are left for future evaluation rather than claimed here." | Physical test bench measurements completed: 6-point DAC linearity test ($R^2 = 0.9998$), residual errors ($|\Delta T| \le 0.5\,^\circ\text{C}$), ADC thermal noise observation, and closed-loop latency profile ($< 18\text{ ms}$). | **Major Advancement:** Replaced future-work placeholders with authentic laboratory bench data. | `project_report.md` (Sec 6), `arduino/calibration_benchmark.py`, `research/make_figures.py` | Present verified bench data, linearity regression, error residual distribution, and latency breakdown. |
| **Figures and Visuals** | Figure 4 and Figure 5 were explicit text placeholders: *"Placeholder for the live-telemetry dashboard screenshot"* and *"Placeholder for configuration panel"*. | 35 genuine high-resolution application screenshots captured across light/dark themes, responsive viewports, and setup wizard stages; 5 publication-grade vector/PDF figures generated. | **Resolved:** All placeholders eliminated; publication-quality graphics ready. | `ui_images/`, `research/figures/` (`fig1`–`fig5`) | Embed vector architecture, signal transport, linearity, fault, and latency figures alongside genuine UI captures. |
| **Digital Protocol Emulation** | Mentioned I2C, SPI, UART, OneWire as future scope. | Confirmed as future scope. Current hardware focuses on electrical analog/PWM signal emulation. | **Consistent:** Accurately classified as planned future extension. | `esp32/src/main.cpp`, `project_report.md` (Sec 9) | Maintain strict boundary: OneSensor emulates physical transducer voltages/timings, not digital bus packets. |
| **Machine Learning Models** | Stated that ML models would be introduced in future work. | Generative Gaussian jitter implemented using Box-Muller; full ML inference (RNN/LSTM) remains on the roadmap. | **Consistent:** Avoided premature claims of onboard ML inference. | `esp32/src/fault_engine.cpp` | Accurately describe statistical noise generation while maintaining deep-learning drift as future work. |

---

## 3. Detailed Subsystem Transitions

### 3.1 Firmware and Hardware Node
- **Old Draft:** Described the ESP32 firmware as a monolithic application running an asynchronous web server that directly served HTML/JS to client browsers while driving outputs.
- **Current State:** The ESP32 is focused strictly on real-time signal generation, FreeRTOS task scheduling, dynamic scenario evaluation, and a lightweight WebSocket command/telemetry interface (`/ws`). Heavy web serving is offloaded to the desktop workstation. Pin assignments are rigidly isolated into `hardware_config.h` to ensure pin safety (e.g., avoiding strapping pin conflicts on GPIO 0, 2, 12, 15).

### 3.2 Signal Path and Electrical Grounding
- **Old Draft:** The signal transport was described at a block-diagram level without addressing common ground requirements or ADC voltage division ratios.
- **Current State:** The electrical interconnect is explicitly documented. The 3.3V ESP32 DAC output is sampled by the 5.0V Arduino ADC, yielding an effective scale factor of $675.18$ counts at full-scale ($3.3 / 5.0 \times 1023$). A shared ground connection is established as an absolute electrical prerequisite to eliminate floating ground noise.

### 3.3 Target Microcontroller Decoding
- **Old Draft:** The target microcontroller was treated as a passive sink with no specified decoding software architecture.
- **Current State:** A modular C++ library (`OneSensor`) is provided for the Arduino UNO. It abstracts individual sensor channels behind concrete subclasses (`TemperatureSensor`, `HumiditySensor`, `GasSensor`, etc.) driven by polymorphic decoders (`DacDecoder` and `PwmDecoder`). It implements non-blocking timeout guards (25 ms) and validity windows (5 consecutive samples) to prevent infinite loop locking.

---

## 4. Required Manuscript Actions Summary

1. **Eliminate All Placeholders:** Update all figures to use the newly generated vector graphics in `research/figures/` and genuine UI captures from `ui_images/`.
2. **Incorporate Real Empirical Data:** Replace speculative statements regarding performance with the documented 6-point DAC linearity benchmark ($R^2 = 0.9998$) and end-to-end latency breakdown ($16.9\text{ ms}$).
3. **Refine Architecture Description:** Formally present the 3-tier architecture (Workstation GUI + Python Sidecar $\leftrightarrow$ ESP32 Node $\longleftrightarrow$ Arduino SUT).
4. **Standardize Mathematical Rigor:** Integrate the verified mathematical formulations for DAC voltage scaling, PWM duty cycle modulation, Box-Muller noise generation, and circular ring-buffer latency delay.
5. **Acknowledge Technical Boundaries:** Maintain transparency regarding the distinction between electrical signal emulation (implemented) and digital bus slave protocol emulation (future work).
