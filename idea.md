# OneSensor — Overall Idea & Workflow

## 1. What OneSensor Is

OneSensor is a **virtual sensor platform** for Arduino development. Instead of wiring
real DHT22 / MQ-2 / LDR / soil-moisture sensors to an Arduino Uno, a developer runs a
web dashboard on a PC, types in (or scripts) sensor values, and those values arrive at
the Arduino through a small hardware chain — ESP32 → PWM wires → Arduino — completely
transparent to the Arduino sketch.

```text
"I want the temperature sensor to say 32.5 °C right now"
                    (typed on a web page)
                            │
                            ▼
                sensor.readTemperature() == 32.5
                  (on the Arduino, seconds later)
```

The Arduino code never learns the value was typed by a human on a laptop. It just
calls `sensor.readTemperature()` the same way it would call `dht.readTemperature()`.

## 2. Why PWM (and not a "cleaner" analog voltage)

The obvious way to fake an analog sensor is to output a real DC voltage the Arduino
can read with `analogRead()`. That needs a DAC or an RC filter — hardware the project
is not allowed to use. The two boards available are:

| Board | Native output the project *is* allowed to use |
|---|---|
| ESP32 | LEDC hardware PWM peripheral (up to 16 independent channels) |
| Arduino Uno | Digital input pins, `pulseIn()` timing |

So the signal has to travel as **timing information**, not voltage level. The ESP32
sets a duty cycle (0–100%) on a square wave; the Arduino times the HIGH and LOW
portions of that same wave and reconstructs the duty cycle. No DAC, no filter, no
extra chips — just two GPIOs and a wire.

This is the single most important engineering decision in the project, and it drives
almost every other design choice (frequency selection, decoder design, "PWM is not
analog" documentation, etc.).

## 3. End-to-End Data Flow

```text
 PC BROWSER                ESP32                          ARDUINO UNO
┌───────────┐   WebSocket ┌──────────────────────┐  wires ┌────────────────────┐
│ Dashboard │ ───JSON───▶ │ WS Server            │        │                    │
│ (sliders) │             │   │                  │        │                    │
└───────────┘             │   ▼                  │        │                    │
                           │ Sensor State (mutex) │        │                    │
                           │   │                  │        │                    │
                           │   ▼                  │        │                    │
                           │ Value Mapper         │        │                    │
                           │  (0–50°C → 0–100%)   │        │                    │
                           │   │                  │        │                    │
                           │   ▼                  │        │                    │
                           │ LEDC PWM x5   ────────┼─5 GPIO─┼─▶ 5 digital pins   │
                           └──────────────────────┘        │   PWM Decoder x5   │
                                                            │   │               │
                                                            │   ▼               │
                                                            │ OneSensor Core    │
                                                            │   │               │
                                                            │   ▼               │
                                                            │ Sensor API        │
                                                            │ readTemperature() │
                                                            └────────────────────┘
```

Every arrow above is a real, testable boundary — which is why the project is built in
phases (Section 6) instead of all at once.

## 4. The Five v1 Sensors

| Sensor | Logical Range | Realistic Physical Analogue |
|---|---|---|
| Temperature | 0–50 °C | DHT22 / DS18B20 |
| Humidity | 0–100 % | DHT22 |
| Gas | 0–1000 ppm | MQ-2 / MQ-135 |
| Light | 0–1000 lux | LDR / BH1750 |
| Soil Moisture | 0–100 % | Capacitive soil sensor |

Ranges live in **one config table**, not scattered through the code, so adding a
sixth sensor (e.g. Pressure) later means adding one row, not editing five files.

## 5. Key Design Decisions (and why)

| Decision | Reasoning |
|---|---|
| Sensor ↔ GPIO mapping is a config table, not hard-coded | Lets the same firmware run on a rewired breadboard without a recompile of core logic; keeps sensor classes hardware-agnostic |
| ESP32 uses LEDC (hardware PWM), never `digitalWrite`+`delay` | Software PWM would jitter and steal CPU time from the WebSocket task; LEDC runs in dedicated hardware timers |
| Arduino decodes with `pulseIn()` first, interrupts later | Uno has only 2 true external-interrupt pins (D2/D3) but 5 sensors are needed — see Section 7. `pulseIn()` works on *any* digital pin today; a Pin-Change-Interrupt (PCINT) library is the documented upgrade path |
| PWM frequency: low (≈500 Hz–1 kHz), not "as high as possible" | Arduino timing resolution is `micros()`-based (~4 µs granularity, `pulseIn()` overhead ~ tens of µs). A too-high frequency shrinks the HIGH/LOW pulse widths until they're comparable to that overhead, destroying accuracy. Low frequency = long, easy-to-measure pulses |
| ESP32 is the WebSocket **server**, PC is the client | ESP32 already has a known IP on the local Wi-Fi; a phone or laptop browser can connect without needing to expose anything back to the ESP32 |
| Shared `SensorState` protected by a mutex/critical section | The WebSocket callback (network task) and the PWM update loop (main task) touch the same struct from different execution contexts; a half-written float is a real bug on ESP32 dual-core FreeRTOS |
| Calibration is a separate layer from conversion | Real sensors are never perfectly linear; keeping calibration (offset/scale) separate from the normalize/denormalize math means fixing sensor #3's drift never touches sensor #1's code |

## 6. Twelve-Phase Build Order

Building all five sensors, Wi-Fi, WebSocket, and a dashboard simultaneously is how
these mini-projects usually die in week 2. The plan instead proves each link in the
chain before adding the next:

| Phase | Goal | "Done" looks like |
|---|---|---|
| 1 | ESP32 outputs one fixed 50% PWM signal | Multimeter/oscilloscope or a second ESP32 confirms ~50% duty |
| 2 | Arduino decodes that one signal | Serial prints `Duty: 50.1%` consistently |
| 3 | Map 0–50 °C onto that channel | Setting 25 °C in code → Arduino reads ~50% |
| 4 | Wrap it as `sensor.readTemperature()` | Sketch from the top of this doc compiles and prints ~25.0 |
| 5 | Repeat for Humidity, Gas, Light, Soil | Each has its own GPIO pair, independently verified |
| 6 | Run all five at once | Changing Temperature doesn't glitch Humidity's reading |
| 7 | ESP32 joins Wi-Fi | Serial prints an IP address |
| 8 | WebSocket server accepts a connection | A test client (e.g. browser console) connects and gets an ack |
| 9 | Dashboard UI (sliders + numeric fields) | Moving a slider sends a `set_value` JSON message |
| 10 | Dynamic updates while running | Dragging a slider changes the Arduino's live reading within ~1s |
| 11 | Scenario engine (STATIC, RAMP) | A RAMP scenario visibly sweeps a value over N seconds |
| 12 | Calibration + accuracy logging | A table of expected vs. received values with % error exists |

No phase starts until the previous one is verified over Serial — this is a hardware
project, and hardware bugs compound if you stack unverified layers.

## 7. The One Hardware Gotcha Worth Knowing Up Front

The Arduino Uno's ATmega328P has only **two** pins capable of true external
interrupts (D2 = INT0, D3 = INT1). Five simultaneous PWM channels can't all get a
hardware interrupt the "normal" Arduino way. Three practical paths exist:

| Approach | Pros | Cons |
|---|---|---|
| `pulseIn()` round-robin (v1 choice) | Zero extra libraries, works today | Each call blocks briefly; 5 channels share time-slices, so refresh rate per sensor drops as channels are added |
| Pin-Change Interrupts (PCINT), all pins | All 5 channels measured "simultaneously" in the background | Needs a PCINT helper library or manual register work (`PCICR`/`PCMSK`); more complex ISR bookkeeping |
| Move decoding to a second MCU (e.g. a second Uno or an ESP32) | Removes the timing bottleneck entirely | Violates the "ESP32 + Uno only" hardware constraint for this prototype |

v1 uses `pulseIn()` deliberately, with the `PwmDecoder` class designed so its
internals (not its public API) are what change when PCINT is introduced later.

## 8. Where This Can Go Next

Because the sensor classes never see a GPIO number and the transport is behind a
`SignalType` enum, the same `OneSensor` public API (`readTemperature()`, `begin()`,
`update()`...) survives future upgrades:

- More sensors (Pressure, CO₂, Ultrasonic distance, Vibration...) — one config row each
- More transports (DAC on ESP32, UART between boards, I2C) — a new `SignalType` and a
  new decoder class, sensor classes untouched
- Real hardware swap-in — a sensor class could one day read a real DHT22 instead of
  OneSensor's PWM decoder, and the Arduino application code would not need to change
