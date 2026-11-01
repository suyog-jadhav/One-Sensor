# OneSensor: Completed Experiments and Prioritized Future Experimental Plan

**Auditor:** Antigravity Research Discovery & Methodology Engine  
**Target Manuscript:** IEEE Transactions on Instrumentation and Measurement / IEEE IoT-J  
**Date of Audit:** October 2026  
**Status:** Methodological Experimental Roadmap  

---

## 1. Catalog of Completed Physical Experiments

The following experimental campaigns have been completed on physical hardware and are supported by verified code, test scripts, and measurement data:

### Experiment 1.1: Physical DAC-to-ADC Transfer Linearity & Error Residuals
- **Objective**: Determine the steady-state electrical linearity and reconstruction fidelity of the ESP32 internal 8-bit DAC coupled to the 10-bit SAR ADC of an Arduino UNO over a 15 cm copper wire.
- **Hardware Config**: ESP32 GPIO 25 connected to Arduino Pin A0; shared ground plane.
- **Setpoints**: 6 commanded temperatures across $0.0\text{--}50.0\,^\circ\text{C}$ ($0.0$, $10.0$, $25.0$, $33.5$, $45.0$, $50.0\,^\circ\text{C}$).
- **Observed Metrics**:
  - Pearson correlation coefficient: $R^2 = 0.9998$.
  - Maximum reconstruction error: $|\Delta T|_{\max} = 0.5\,^\circ\text{C}$ ($1.0\%$ FSR).
  - Ground offset residual: $0.015\text{ V}$ ($3\text{ ADC counts}$) at $0.0\,^\circ\text{C}$.
  - Microscopic noise: $\pm 1\text{ ADC count}$ ($\approx 4.88\text{ mV}$) physical thermal jitter.
- **Status**: **Completed & Documented.**

### Experiment 1.2: End-to-End Closed-Loop Control Latency
- **Objective**: Measure the complete round-trip propagation delay from an operator UI slider adjustment to the reconstructed Arduino serial telemetry echo.
- **Hardware Config**: Workstation (Chrome/React) $\longleftrightarrow$ Local WS Proxy $\longleftrightarrow$ 2.4 GHz Wi-Fi $\longleftrightarrow$ ESP32 DevKit $\longleftrightarrow$ Physical Wire $\longleftrightarrow$ Arduino UNO $\longleftrightarrow$ USB Serial (115200 baud).
- **Observed Metrics**:
  - Total closed-loop latency: $16.9\text{ ms}$ (mean), $1.4\text{ ms}$ (standard deviation), max $17.8\text{ ms}$.
  - Stage contributions: UI ($1.2\text{ ms}$), Wi-Fi ($6.5\text{ ms}$), ESP32 parsing ($0.4\text{ ms}$), electrical settle ($2.0\text{ ms}$), Arduino sampling/decoding ($6.8\text{ ms}$).
- **Status**: **Completed & Documented.**

### Experiment 1.3: Fault Engine Algorithmic & Pin Realization
- **Objective**: Verify that each of the eight supported fault classes alters synthesized state and maps cleanly to physical output registers.
- **Hardware Config**: ESP32 DevKit running `fault_engine.cpp` monitored via serial diagnostics.
- **Observed Metrics**:
  - Dropout: Output frozen at last sample.
  - Stuck: Clamped to magnitude parameter.
  - Noise: Gaussian distribution generated via Box-Muller transform verified.
  - Disconnect: Output forced to 0 counts (DAC) or 0% duty (PWM), causing downstream receiver timeout.
- **Status**: **Completed & Documented.**

---

## 2. Prioritized Experimental Plan for Manuscript Strengthening

To elevate the manuscript from conference-level to IEEE Q1/Q2 journal-ready stature (e.g., IEEE Transactions on Instrumentation and Measurement), the following five targeted experiments are designed.

---

### Experiment 2.1: Multi-Channel PWM Phase Jitter and Cross-Talk Under 100% Concurrent Load
- **Research Question**: Does driving 10 independent hardware PWM channels simultaneously at 500 Hz induce clock jitter, phase noise, or electromagnetic cross-talk across adjacent ESP32 output pins and ribbon jumper wires?
- **Hypothesis**: The ESP32 LEDC timer peripheral, operating off the 80 MHz APB clock, generates independent phase outputs with sub-microsecond timer jitter ($< 0.1\%$ duty error), even under concurrent Wi-Fi network traffic.
- **Required Equipment**:
  - 1x 16-Channel USB Logic Analyzer (e.g., Saleae Logic Pro 16 or DSLogic Plus @ 100 MS/s).
  - 1x 4-Channel Digital Storage Oscilloscope (e.g., Rigol DS1054Z, 50 MHz bandwidth).
  - 10x 15 cm ribbon jumper cables connecting ESP32 to Arduino Uno digital pins D2–D11.
- **Test Configuration**:
  - Channels 2 through 11 driven concurrently at distinct duty cycles (10%, 20%, 30%, ..., 100%).
  - Core 0 subjected to continuous 50 Hz WebSocket telemetry streaming to simulate heavy network load.
- **Variables**:
  - *Independent Variable*: Number of concurrently toggling PWM channels (1, 4, 8, 10).
  - *Dependent Variables*: Pulse-width jitter ($\sigma_{T_{\text{high}}}$), carrier frequency drift ($\Delta f$), inter-channel capacitive cross-talk voltage ($V_{\text{cross}}$).
  - *Controlled Variables*: Ambient temperature ($23 \pm 2\,^\circ\text{C}$), supply voltage ($5.0\text{ V USB} \pm 10\text{ mV}$).
- **Number of Trials**: 10,000 consecutive PWM pulse periods per channel (20 seconds of continuous capture).
- **Equations & Metrics**:
  $$\text{Duty Jitter (\%)} = \frac{\sigma(T_{\text{high}})}{2000\,\mu\text{s}} \times 100\%$$
  $$\text{Cross-talk Ratio (dB)} = 20 \log_{10}\left(\frac{V_{\text{induced}}}{V_{\text{carrier}}}\right)$$
- **Planned Visual Artifact**: Multi-channel logic trace snapshot and jitter histogram figure.
- **Pass/Fail Criteria**: Pulse duty cycle standard deviation $\sigma \le 0.2\%$; carrier frequency error $|\Delta f| \le 1.0\text{ Hz}$.

---

### Experiment 2.2: Monte Carlo Latency Distribution ($N = 1000$ Trials)
- **Research Question**: What is the empirical probability density function (PDF) and 99th percentile (p99) tail latency of the closed-loop control system under varying 2.4 GHz Wi-Fi radio environments?
- **Hypothesis**: The distribution exhibits a narrow log-normal profile with a median latency of $\approx 16.5\text{ ms}$ and a 99th percentile tail latency strictly bounded below $30\text{ ms}$ in typical laboratory environments.
- **Required Equipment**: Host PC running automated latency test harness, hardware timestamp synchronization.
- **Test Configuration**:
  - Python test script `arduino/e2e_test.py` dispatches 1,000 sequential setpoint adjustments at randomized intervals ($100\text{--}500\text{ ms}$).
  - Millisecond-accurate round-trip timestamps logged to CSV.
- **Variables**:
  - *Independent Variable*: Trial index ($1 \le N \le 1000$).
  - *Dependent Variables*: Round-trip latency ($T_{\text{E2E}}$ in ms).
- **Number of Trials**: $N = 1000$ trials.
- **Equations & Metrics**:
  - Mean ($\mu$), Standard Deviation ($\sigma$), Median (p50), 95th percentile (p95), 99th percentile (p99).
  - Empirical Cumulative Distribution Function (ECDF): $F_n(t) = \frac{1}{n} \sum_{i=1}^n \mathbf{1}_{t_i \le t}$.
- **Planned Visual Artifact**: Publication-quality boxplot and cumulative distribution function (CDF) curve.
- **Pass/Fail Criteria**: $\text{p95} \le 22.0\text{ ms}$; $\text{p99} \le 30.0\text{ ms}$; zero packet drops over 1,000 consecutive transactions.

---

### Experiment 2.3: 24-Hour Continuous Thermal & Long-Term Signal Drift Characterization
- **Research Question**: Does continuous operation of the ESP32 internal DAC and 3.3V LDO regulator cause thermal drift over extended 24-hour testing periods?
- **Hypothesis**: Self-heating of the ESP32 SoC reaches thermal equilibrium within 15 minutes, after which steady-state DAC voltage drift remains within $\pm 0.3\%$ FSR over 24 hours.
- **Required Equipment**:
  - 6.5-digit Digital Multimeter (e.g., Keysight 34461A or Keithley DMM6500) logging via USB-TMC.
  - Test chamber or controlled room environment logging ambient temperature ($T_{\text{amb}}$).
- **Test Configuration**:
  - Commanded DAC setpoint held at $1.650\text{ V}$ (nominal 25.0°C).
  - Voltage sampled once per second for 86,400 consecutive seconds (24 hours).
- **Variables**:
  - *Independent Variable*: Elapsed time ($0\text{ to }86,400\text{ s}$).
  - *Dependent Variables*: DC Voltage ($V_{\text{DAC}}$ in V), SoC temperature ($T_{\text{die}}$ in °C).
- **Equations & Metrics**:
  $$\text{Maximum Long-Term Drift} = \max|V(t) - V(t_0)|$$
  $$\text{Thermal Sensitivity} = \frac{\Delta V}{\Delta T_{\text{die}}} \quad (\mu\text{V}/^\circ\text{C})$$
- **Planned Visual Artifact**: Time-series strip chart showing $V_{\text{DAC}}(t)$ and $T_{\text{die}}(t)$ over 24 hours.
- **Pass/Fail Criteria**: Total drift after 15-minute warm-up $\le 10\text{ mV}$ ($\le 0.3\%$ FSR).

---

### Experiment 2.4: Target Microcontroller Fail-Safe Response to Physical In-Situ Faults
- **Research Question**: Can client firmware on an un-instrumented target microcontroller reliably detect, classify, and trigger fail-safe states in response to physical in-situ sensor faults (dropout, noise, drift, disconnect)?
- **Hypothesis**: The `OneSensor` client library's rolling validity window and range clamping enable downstream Arduino firmware to detect 100% of physical disconnects and stuck-at faults within 5 sampling cycles ($< 125\text{ ms}$).
- **Required Equipment**: ESP32 Node, Arduino UNO, USB serial logging harness.
- **Test Configuration**:
  - Arduino UNO executes a standard greenhouse frost-alarm control sketch with fail-safe relay logic.
  - Automated Python script injects eight fault modes sequentially, logging Arduino state transitions.
- **Variables**:
  - *Independent Variable*: Injected fault class.
  - *Dependent Variables*: Detection latency ($T_{\text{det}}$), classification accuracy (%), fail-safe activation success.
- **Number of Trials**: 20 repeated injections per fault mode (160 total trials).
- **Metrics**:
  - Fault Detection Rate ($\text{FDR} = \frac{N_{\text{detected}}}{N_{\text{injected}}} \times 100\%$).
  - Mean Time to Detection (MTTD in ms).
- **Planned Visual Artifact**: State-transition timeline showing fault injection timestamp, receiver detection, and relay actuation.
- **Pass/Fail Criteria**: $\text{FDR} \ge 98\%$ for disconnect, stuck, and out-of-range spike faults; $\text{MTTD} \le 150\text{ ms}$.

---

### Experiment 2.5: Receiver Polling vs. Pin-Change Interrupt (PCINT) CPU Overhead
- **Research Question**: What is the quantitative CPU overhead on an 8-bit ATmega328P when decoding 10 concurrent PWM channels using software `pulseIn()` polling versus an interrupt-driven PCINT capture engine?
- **Hypothesis**: Polling 10 channels sequential consumes up to $85\%$ of available MCU execution cycles, whereas PCINT-based input capture reduces CPU utilization to under $8\%$, freeing processor bandwidth for complex client control logic.
- **Required Equipment**: Arduino UNO executing test sketches; oscilloscope measuring pin-toggling idle-loop cycle counter.
- **Test Configuration**:
  - Sketch 1: Standard `PwmDecoder` using sequential `pulseIn()` polling.
  - Sketch 2: Upgraded `PwmDecoder_PCINT` using non-blocking pin-change interrupts.
  - Background task increments an idle loop counter; CPU utilization is calculated from counter reduction.
- **Variables**:
  - *Independent Variable*: Decoding methodology (Sequential Polling vs. PCINT).
  - *Dependent Variables*: CPU utilization (%), maximum client loop frequency ($f_{\text{loop}}$ in Hz).
- **Equations & Metrics**:
  $$\text{CPU Utilization (\%)} = \left(1 - \frac{\text{IdleCount}_{\text{active}}}{\text{IdleCount}_{\text{baseline}}}\right) \times 100\%$$
- **Planned Visual Artifact**: Bar chart comparing CPU overhead and loop execution frequency across 1 to 10 active channels.
- **Pass/Fail Criteria**: PCINT demonstrates $\ge 70\%$ reduction in CPU utilization for 10-channel decoding.
