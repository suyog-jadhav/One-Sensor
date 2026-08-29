# OneSensor WebSocket Configuration Protocol Specification

This document details the WebSocket runtime configuration protocol added in Phase 2 for the OneSensor platform.

---

## Endpoint
- **URL**: `ws://<esp32-ip>/ws`
- **Transport**: JSON over WebSocket text frames
- **Authority**: The ESP32 firmware is the single source of truth and validates all channel configurations before applying or persisting.

---

## Inbound Messages (Client -> ESP32)

### 1. `get_config`
Requests the current active channel configuration from the ESP32.
```json
{
  "type": "get_config"
}
```

### 2. `set_config`
Proposes a full 5-channel configuration set.
```json
{
  "type": "set_config",
  "channels": [
    {
      "sensor": "temperature",
      "signal": "dac",
      "gpio": 25,
      "ledcChannel": 0,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 50.0,
      "defaultValue": 25.0,
      "calOffset": 0.0,
      "calScale": 1.0
    },
    {
      "sensor": "humidity",
      "signal": "dac",
      "gpio": 26,
      "ledcChannel": 1,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 100.0,
      "defaultValue": 50.0,
      "calOffset": 0.0,
      "calScale": 1.0
    },
    {
      "sensor": "gas",
      "signal": "pwm",
      "gpio": 18,
      "ledcChannel": 2,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 1000.0,
      "defaultValue": 300.0,
      "calOffset": 0.0,
      "calScale": 1.0
    },
    {
      "sensor": "light",
      "signal": "pwm",
      "gpio": 19,
      "ledcChannel": 3,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 1000.0,
      "defaultValue": 500.0,
      "calOffset": 0.0,
      "calScale": 1.0
    },
    {
      "sensor": "soil_moisture",
      "signal": "pwm",
      "gpio": 21,
      "ledcChannel": 4,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 100.0,
      "defaultValue": 50.0,
      "calOffset": 0.0,
      "calScale": 1.0
    }
  ]
}
```

### 3. `reset_config`
Erases saved NVS configuration and reverts channels to compiled factory defaults.
```json
{
  "type": "reset_config"
}
```

---

## Outbound Messages (ESP32 -> Clients)

### 1. `config_state`
Pushed on initial WebSocket connection and broadcast to **ALL** connected clients whenever a valid `set_config` or `reset_config` is applied.
```json
{
  "type": "config_state",
  "channels": [
    {
      "sensor": "temperature",
      "signal": "dac",
      "gpio": 25,
      "ledcChannel": 0,
      "frequencyHz": 500,
      "resolutionBits": 10,
      "inputMin": 0.0,
      "inputMax": 50.0,
      "defaultValue": 25.0,
      "calOffset": 0.0,
      "calScale": 1.0
    },
    "... remaining channels ..."
  ]
}
```

### 2. `config_error`
Sent directly to the requesting client if validation fails on a proposed `set_config`. No hardware state is changed and NVS is untouched.
```json
{
  "type": "config_error",
  "reason": "GPIO 18 assigned to multiple channels"
}
```

---

## On-Device Validation Rules
1. **Valid Signal Types**: `pwm` or `dac`.
2. **DAC GPIO Restriction**: Must be `25` or `26` (ESP32 hardware DAC pins). Maximum of 2 DAC channels allowed.
3. **PWM GPIO Pool**: Output-capable pins only (`4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33`). Pins `34–39` are rejected as input-only.
4. **Duplicate GPIO Prevention**: Duplicate GPIO assignments across channels are rejected.
5. **Atomic Application**: If any validation rule fails, the entire payload is rejected with a `config_error` message.
