# OneSensor: Scientific Validation Checklist & Pre-Submission Audit

**Auditor:** Antigravity Research Discovery & Methodology Engine  
**Target Manuscript:** IEEE Transactions on Instrumentation and Measurement / IEEE Sensors Journal  
**Date of Audit:** October 2026  
**Status:** Comprehensive Quality Assurance Audit  

---

## 1. Technical Implementation & Hardware Integrity

- [x] **ESP32 Firmware Peripheral Verification**:
  - Confirmed 8-bit DAC operation on hardware pins GPIO 25 and GPIO 26 (`channel_manager.cpp`).
  - Confirmed 10-channel LEDC PWM configuration at 500 Hz carrier and 10-bit resolution (`hardware_config.h`).
  - Confirmed strapping pin safety: excluded GPIO 0, 2, 15 from PWM and reserved GPIO 12 for post-boot configuration.
  - Confirmed thread-safe state synchronization between Core 0 (network) and Core 1 (synthesis) via FreeRTOS mutexes.
- [x] **Arduino SUT Receiver Library Verification**:
  - Confirmed polymorphic `SignalDecoder` base class with concrete `DacDecoder` and `PwmDecoder` implementations.
  - Confirmed 3.3V to 5.0V voltage domain translation ($675.18$ maximum counts on 10-bit ADC).
  - Confirmed non-blocking timeout guard on `pulseIn()` (`PULSE_TIMEOUT_US = 25000` $\mu$s).
  - Confirmed rolling validity window (5 consecutive failures before `isValid()` returns false).
- [x] **Workstation Software Verification**:
  - Confirmed React 18 + Vite dashboard builds cleanly and serves interactive controls.
  - Confirmed FastAPI Python sidecar provides USB/PnP discovery (VID/PID matching) and WebSocket bridging.
  - Verified 35 genuine UI screenshots captured in `ui_images/`.
- [x] **Scope Boundary Transparency**:
  - Explicitly differentiated electrical transducer emulation (DAC/PWM) from digital bus slave emulation (I2C/SPI).
  - Documented that I2C/SPI register map emulation remains future roadmap scope.

---

## 2. Statistical and Mathematical Rigor

- [x] **Linearity & Correlation Rigor**:
  - Re-computed Pearson correlation coefficient: $r = 0.99994 \implies R^2 = 0.99988 \approx 0.9998$.
  - Verified that Pearson correlation ($r$) and coefficient of determination ($R^2$) are correctly distinguished.
  - Verified that raw ADC counts exhibit authentic quantization steps ($q \approx 4.88\text{ mV}$) and thermal noise ($\pm 1$ count).
- [x] **Reconstruction Error Calculation**:
  - Recalculated absolute errors across all 6 calibration setpoints ($0.0$, $10.0$, $25.0$, $33.5$, $45.0$, $50.0\,^\circ\text{C}$).
  - Maximum observed error: $+0.5\,^\circ\text{C}$ ($1.0\%$ Full-Scale Range) at the nominal midpoint.
- [x] **Latency Formulation**:
  - Verified stage-by-stage latency additive breakdown ($1.2 + 6.5 + 0.4 + 2.0 + 6.8 = 16.9\text{ ms}$).
  - Confirmed standard deviation is $1.4\text{ ms}$ and maximum observed single-trial latency is $17.8\text{ ms} < 18.0\text{ ms}$.
- [x] **Zero Fabrication Standard**:
  - Confirmed that no missing datasets, Monte Carlo runs, or confidence intervals were synthetically invented.
  - Explicitly classified planned future tests in `experimental_plan.md` rather than reporting them as finished results.

---

## 3. Bibliographic and Citation Integrity

- [x] **Verified Citation Database (`references.bib`)**:
  - Confirmed all 15 references exist in reputable scholarly indices (IEEE Xplore, ACM DL, Springer, Elsevier).
  - Verified exact titles, full author lists, publication venues, years, and volume/issue numbers.
  - Verified active Digital Object Identifiers (DOIs) for all peer-reviewed articles.
  - Confirmed zero hallucinated or synthetic citations.
- [x] **Taxonomic Balance**:
  - Appropriately balanced citations across Sensor Virtualization (Yuriyama, Perera, Bose, Chatterjee), Hardware-in-the-Loop (Abdalla, NI, Fathy), Fault Injection (Skarin, Magliano, Elgharbawy, Natella), and ESP32 Characterization (Hercog, Maier).

---

## 4. Figures, Visuals, and Plot Standards

- [x] **Vector Graphics & Resolution**:
  - All five scientific figures compiled in dual vector format (PDF) and 300 DPI raster format (PNG) via `research/make_figures.py`.
  - Fonts configured to clean sans-serif matching IEEE publication standards (min 8.5 pt at final column width).
  - Line widths $\ge 1.6\text{ pt}$ to ensure crisp reproduction in print and grayscale.
- [x] **Accurate Diagram Representation**:
  - Figure 1 (Architecture): Correct arrow directions for bidirectional WebSocket IPC and unidirectional physical DAC/PWM electrical wiring. Mandatory common ground explicitly highlighted.
  - Figure 2 (Transports): Accurate step-function pulse trains for PWM and continuous analog voltage waveforms for DAC.
  - Figure 3 (Linearity): Real bench measurement points plotted with error residuals stem plot.
  - Figure 4 (Fault Dynamics): Realistic piecewise linear ramp simulation and Box-Muller Gaussian jitter waveforms.
  - Figure 5 (Latency): Clear breakdown bar chart with exact millisecond annotations and cumulative CDF curve.

---

## 5. Peer-Review Readiness and Pre-Submission Roadmap

| Quality Dimension | Assessment | Action Prior to Camera-Ready |
| :--- | :---: | :--- |
| **Research Gap Clarity** | **High** | Clearly positioned between high-level cloud virtualization and high-cost industrial HIL rigs. |
| **Architectural Novelty** | **Strong** | Synergistic integration of 12-channel physical stimulus + non-blocking scenarios + in-situ faults. |
| **Empirical Bench Evidence** | **Sufficient for Conference / Initial Journal** | Expand to $N=1000$ trial Monte Carlo sweep for top-tier Q1 journal submission. |
| **Scientific Tone & Style** | **Excellent** | Objective, technical, free of marketing hype; candid about limitations. |
| **Template Compliance** | **Complete** | Formatted in IEEE double-column conference/journal layout with formal equations and tables. |
