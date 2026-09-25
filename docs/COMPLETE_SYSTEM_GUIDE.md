# OneSensor — Complete System Architecture, Guide & Reference

> **OneSensor** is a virtual sensor platform that allows developers to test Arduino sketches and embedded systems using simulated sensor signals over hardware lines without requiring physical sensors.

---

## 1. System Overview & Architecture

### The Core Concept
Instead of connecting fragile physical sensors (thermocouples, humidity probes, gas sensors, photocells, soil probes) to an Arduino Uno, **OneSensor** simulates all 5 sensors using an **ESP32** microcontroller.

A user manipulates virtual sensor readings via a Web or Desktop dashboard. The ESP32 receives these values over Wi-Fi/WebSocket and translates them into physical electrical signals (**Hardware LEDC PWM** or **Hardware 8-bit DAC**) on its GPIO pins. The **Arduino Uno (System Under Test)** reads these electrical signals using the `OneSensor` C++ library, decodes the duty cycles / analog voltages back into engineering units (°C, %, ppm, lux), and provides them to the user sketch via a high-level API.

```
┌─────────────────────────────────────────────────────────┐
│              PC Web / Desktop Dashboard                 │
│   • Sliders & Numeric Inputs (Live Telemetry)           │
│   • Scenario Engine (Static targets, Ramp sweeps)       │
│   • USB Serial Monitor & Firmware Flasher               │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket / JSON over Wi-Fi
┌─────────────────────────▼───────────────────────────────┐
│                  ESP32 Firmware                         │
│   • AsyncWebServer & WebSocket Server (Port 80 / /ws)   │
│   • ConfigStore (NVS persistence for pin assignments)   │
│   • ValueMapper (Logical values → Duty cycle / Voltage) │
│   • ChannelManager (LEDC 500Hz PWM & Hardware DAC)      │
└─────────────────────────┬───────────────────────────────┘
                          │ Physical Jumper Wires (PWM / DAC + GND)
┌─────────────────────────▼───────────────────────────────┐
│               Arduino Uno (Target SUT)                  │
│   • OneSensor C++ Library                               │
│   • PwmDecoder (pulseIn duty cycle measurement)         │
│   • DacDecoder (analogRead voltage scaling)             │
│   • Calibration & Sensor facades                        │
│   • User Arduino Sketch (e.g. BasicFiveSensors.ino)     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Key Features

1. **Simultaneous 5-Sensor Simulation**:
   - Temperature (0 to 50 °C)
   - Humidity (0 to 100 %)
   - Gas Concentration (0 to 1000 ppm)
   - Ambient Light (0 to 1000 lux)
   - Soil Moisture (0 to 100 %)
2. **Dual Signal Transport**:
   - **LEDC Hardware PWM**: 500 Hz carrier frequency, 10-bit duty cycle resolution (0–1023) with jitter-free hardware generation.
   - **Hardware 8-bit DAC**: Generates true analog voltages (0.0 V to 3.3 V) on ESP32 DAC pins (GPIO 25 & 26).
3. **No External Components Required**:
   - Direct connection via standard DuPont jumper wires.
   - No resistors, RC filters, external DACs, ADCs, or multiplexers needed.
4. **Autonomous Scenario Engine**:
   - **STATIC**: Holds configured values indefinitely.
   - **RAMP**: Automatically sweeps sensor values between limits over a configurable duration (e.g., test how your Arduino reacts to an overheating condition over 30 seconds).
5. **Dual User Interfaces**:
   - **Embedded Web Dashboard**: Hosted directly in ESP32 flash memory (`http://<ESP32_IP>/`) — works on any PC, tablet, or phone without installing anything.
   - **Full Desktop App**: React + Vite frontend and FastAPI backend with port auto-detection, live serial stream console, and hardware flasher.
6. **Dynamic Pin Reassignment & NVS/EEPROM Persistence**:
   - Change which pin drives which sensor at runtime via the dashboard; settings persist across power reboots.

---

## 3. Hardware Connections & Wiring

### 3.1 Active Default Wiring Table (Hybrid DAC + PWM)

In the active project codebase (`hardware_config.h` & `ArduinoChannelConfig.h`), Temperature and Humidity use the ESP32 hardware DAC into the Arduino analog inputs, while Gas, Light, and Soil use PWM into digital pins:

| Sensor Channel | ESP32 Pin (Transmitter) | Arduino Pin (Receiver) | Signal Type | Range |
|---|---|---|---|---|
| **Common Ground** | **GND** | **GND** | **Power Reference** | **MUST BE CONNECTED** |
| **Temperature** | **GPIO 25** (DAC1) | **Pin A0** | Analog (0–3.3 V) | 0.0 – 50.0 °C |
| **Humidity** | **GPIO 26** (DAC2) | **Pin A1** | Analog (0–3.3 V) | 0.0 – 100.0 % |
| **Gas** | **GPIO 18** | **Pin D4** | PWM (500 Hz) | 0.0 – 1000.0 ppm |
| **Light** | **GPIO 19** | **Pin D5** | PWM (500 Hz) | 0.0 – 1000.0 lux |
| **Soil Moisture** | **GPIO 21** | **Pin D6** | PWM (500 Hz) | 0.0 – 100.0 % |

> [!IMPORTANT]
> **Ground Rule**: You **must** connect an `ESP32 GND` pin to an `Arduino GND` pin. When powering the two microcontrollers from separate PCs or USB ports, floating grounds cause signal distortion and erratic sensor readings.

---

### 3.2 Alternative: Pure PWM Wiring (All Digital Pins)

If you configure all 5 channels to use PWM:

| Sensor Channel | ESP32 Pin | Arduino Uno Pin | Signal Type | Range |
|---|---|---|---|---|
| **Common Ground** | **GND** | **GND** | Reference | Ground |
| **Temperature** | **GPIO 16** | **Pin D2** | PWM (500 Hz) | 0.0 – 50.0 °C |
| **Humidity** | **GPIO 17** | **Pin D3** | PWM (500 Hz) | 0.0 – 100.0 % |
| **Gas** | **GPIO 18** | **Pin D4** | PWM (500 Hz) | 0.0 – 1000.0 ppm |
| **Light** | **GPIO 19** | **Pin D5** | PWM (500 Hz) | 0.0 – 1000.0 lux |
| **Soil Moisture** | **GPIO 21** | **Pin D6** | PWM (500 Hz) | 0.0 – 100.0 % |

---

## 4. Arduino OneSensor Library Guide

The `OneSensor` library abstracts signal decoding completely away from the user sketch.

### 4.1 Canonical Example Sketch
Located at `arduino/OneSensor/examples/BasicFiveSensors/BasicFiveSensors.ino`:

```cpp
#include <OneSensor.h>

OneSensor sensor;

void setup() {
    Serial.begin(115200);
    delay(500);

    // Initialize all decoders and pin configurations
    sensor.begin();
    Serial.println(F("OneSensor initialized. Reading simulated sensors...\n"));
}

void loop() {
    // 1. Update signal measurements (pulseIn & analogRead)
    sensor.update();

    // 2. Read decoded physical sensor values
    float temp  = sensor.readTemperature();   // °C
    float humid = sensor.readHumidity();      // %
    float gas   = sensor.readGas();           // ppm
    float light = sensor.readLight();         // lux
    float soil  = sensor.readSoilMoisture();  // %

    // 3. Print output
    Serial.print(F("Temp: "));     Serial.print(temp, 2);  Serial.println(F(" °C"));
    Serial.print(F("Humidity: ")); Serial.print(humid, 2); Serial.println(F(" %"));
    Serial.print(F("Gas: "));      Serial.print(gas, 1);   Serial.println(F(" ppm"));
    Serial.print(F("Light: "));    Serial.print(light, 1); Serial.println(F(" lux"));
    Serial.print(F("Soil: "));     Serial.print(soil, 2);  Serial.println(F(" %"));
    Serial.println(F("----------------------------------------"));

    delay(500);
}
```

### 4.2 Library Methods Reference

| Method | Return Type | Description |
|---|---|---|
| `sensor.begin()` | `void` | Initializes pin modes, decoders, and loads pin mappings from EEPROM / defaults. |
| `sensor.update()` | `void` | Measures active input signals. **Must be called regularly in `loop()`**. |
| `sensor.readTemperature()` | `float` | Returns temperature in °C (default range 0.0 – 50.0 °C). |
| `sensor.readHumidity()` | `float` | Returns relative humidity in % (0.0 – 100.0 %). |
| `sensor.readGas()` | `float` | Returns gas concentration in ppm (0.0 – 1000.0 ppm). |
| `sensor.readLight()` | `float` | Returns ambient light intensity in lux (0.0 – 1000.0 lux). |
| `sensor.readSoilMoisture()`| `float` | Returns volumetric soil moisture in % (0.0 – 100.0 %). |
| `sensor.isConnected()` | `bool` | Returns `true` if valid signals are actively detected on configured pins. |

---

## 5. Software Architecture & Flow

### 5.1 ESP32 Firmware Flow
1. **Boot (`setup`)**:
   - `gConfigStore.begin()`: Reads channel configurations from NVS.
   - `gChannelManager.begin()`: Validates GPIOs, sets up ESP32 LEDC timers (500 Hz, 10-bit) and DAC outputs.
   - Sets boot default values (50% midpoint on all channels).
   - `gWifiManager.begin()`: Initiates non-blocking Wi-Fi connection with credentials from `secrets.h`.
2. **Execution (`loop`)**:
   - `gScenarioEngine.update()`: Advances automated ramps/sweeps if active.
   - `gChannelManager.updateAll()`: Recalculates duty cycles/voltages and updates hardware registers.
   - `gHttpServer.update()` / `broadcastState()`: Broadcasts state changes to connected WebSockets at 4 Hz.

### 5.2 Signal Decoding Math
- **PWM Channel**:
  $$\text{Period} = T_{\text{high}} + T_{\text{low}}$$
  $$\text{DutyCycle} = \frac{T_{\text{high}}}{\text{Period}} \times 100\%$$
  $$\text{Value} = \text{Min} + \left(\frac{\text{DutyCycle}}{100}\right) \times (\text{Max} - \text{Min})$$
- **DAC Channel**:
  $$\text{ADC Max Count} = \left(\frac{3.3\,\text{V}}{5.0\,\text{V}}\right) \times 1023 \approx 675.18$$
  $$\text{Percent} = \frac{\text{analogRead}(\text{pin})}{675.18} \times 100\%$$
  $$\text{Value} = \text{Min} + \left(\frac{\text{Percent}}{100}\right) \times (\text{Max} - \text{Min})$$

---

## 6. WebSocket Protocol (`ws://<ESP32_IP>/ws`)

All communication between clients and the ESP32 is standard JSON.

### 6.1 Set Single Sensor Value
```json
{
  "type": "set",
  "sensor": "temperature",
  "value": 37.5
}
```

### 6.2 Set Multiple Values (Bulk)
```json
{
  "type": "set_values",
  "temperature": 29.0,
  "humidity": 65.0,
  "gas": 450.0,
  "light": 800.0,
  "soil": 40.0
}
```

### 6.3 State Broadcast (Sent by ESP32)
```json
{
  "type": "state",
  "temperature": 29.0,
  "humidity": 65.0,
  "gas": 450.0,
  "light": 800.0,
  "soil": 40.0,
  "scenario": "IDLE"
}
```

### 6.4 Trigger Scenario
```json
{
  "type": "START_SCENARIO",
  "scenario": "ramp",
  "sensor": "temperature",
  "start": 10.0,
  "end": 45.0,
  "duration_s": 20
}
```

---

## 7. How to Run the System

### 7.1 ESP32 (Transmitter PC)
1. Set Wi-Fi credentials in `esp32/include/secrets.h`.
2. Compile and upload:
   ```bash
   cd esp32
   pio run --target upload
   pio device monitor -b 115200
   ```
3. Open the control interface:
   - **Browser**: `http://<ESP32_IP>/`
   - **Or Desktop App**:
     ```bash
     # Backend:
     cd desktop/backend && source .venv/bin/activate && python3 app.py
     # Frontend:
     cd desktop/frontend && npm run dev
     ```

### 7.2 Arduino Uno (Receiver / SUT PC)
1. Copy `arduino/OneSensor` to your `Arduino/libraries/` folder.
2. In Arduino IDE, open `BasicFiveSensors.ino`.
3. Select board **Arduino Uno** and port.
4. Click **Upload**, then open **Serial Monitor** at **115200 baud**.
5. Move sliders on the transmitter PC and observe real-time updates on the Arduino!
