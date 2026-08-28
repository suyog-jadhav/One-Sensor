# OneSensor Architecture

## System Overview
OneSensor is a single-wire digital interface platform that enables an Arduino Uno to receive 5 independent sensor streams using **Hardware PWM (LEDC)** from an ESP32.

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard / WS                   │
└───────────────────────────┬─────────────────────────────┘
                            │ WebSocket (JSON)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     ESP32 Firmware                      │
│ ┌──────────────┐   ┌──────────────┐   ┌───────────────┐ │
│ │ ScenarioEng  ├──►│ SensorState  ├──►│ ValueMapper   │ │
│ └──────────────┘   └──────────────┘   └───────┬───────┘ │
│                                               │         │
│                                       LEDC PWM (500 Hz) │
└───────────────────────────────────────────────┼─────────┘
                                                │ GPIO16..21
                                                ▼
┌─────────────────────────────────────────────────────────┐
│                    Arduino Uno Library                  │
│ ┌──────────────┐   ┌──────────────┐   ┌───────────────┐ │
│ │ PwmDecoder   ├──►│ Calibration  ├──►│ Sensor APIs   │ │
│ └──────────────┘   └──────────────┘   └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. ESP32 Side
- **SensorState**: Thread-safe central state container for 5 sensor values.
- **ValueMapper**: Normalizes logical sensor values to [0, 1] range and maps to LEDC duty count.
- **ChannelManager**: Configures 5 LEDC channels @ 500Hz with 10-bit resolution.
- **WifiManager**: Non-blocking connection state machine with exponential backoff.
- **HttpServer / WebSocketHandler**: Serves glassmorphism HTML dashboard and handles JSON WS requests (`set`, `start_ramp`, `start_static`, `stop_scenario`).
- **ScenarioEngine**: Non-blocking simulation engine supporting STATIC and RAMP scenarios.

### 2. Physical Transport
- 5 GPIO lines carrying 500Hz PWM signals from ESP32 to Arduino Uno.
- Shared Common Ground (GND).

### 3. Arduino Side
- **PwmDecoder**: Non-blocking `pulseIn()` based decoder with static HIGH/LOW fallback.
- **Calibration**: Linear mapping layer (`outputMin`, `outputMax`, `offset`, `scale`).
- **Sensor Classes**: `TemperatureSensor`, `HumiditySensor`, `GasSensor`, `LightSensor`, `SoilMoistureSensor`.
- **OneSensor Library Facade**: Top-level API providing `readTemperature()`, `readHumidity()`, etc.
