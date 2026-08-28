# WebSocket Protocol Specification

**Endpoint**: `ws://<ESP32_IP>/ws`  
**Format**: JSON

## Inbound Messages (Client -> ESP32)

### 1. Set Sensor Value
```json
{
  "type": "set",
  "sensor": "temperature",
  "value": 30.5
}
```
*Sensors*: `temperature`, `humidity`, `gas`, `light`, `soil_moisture`

### 2. Start RAMP Scenario
```json
{
  "type": "start_ramp",
  "sensor": "temperature",
  "from": 0.0,
  "to": 50.0,
  "duration": 10.0
}
```
*Duration*: float in seconds.

### 3. Start STATIC Scenario
```json
{
  "type": "start_static",
  "sensor": "humidity",
  "value": 65.0
}
```

### 4. Stop Scenario
```json
{
  "type": "stop_scenario",
  "sensor": "temperature"
}
```

### 5. Stop All Scenarios
```json
{
  "type": "stop_all_scenarios"
}
```

## Outbound Messages (ESP32 -> Client)

### 1. State Broadcast
Sent automatically on connect, on value change, and periodically during scenario execution:
```json
{
  "type": "state",
  "temperature": 30.5,
  "humidity": 50.0,
  "gas": 500.0,
  "light": 500.0,
  "soil": 50.0
}
```

### 2. Error Response
```json
{
  "type": "error",
  "error": "unknown sensor"
}
```
