# OneSensor Arduino Library API Reference

## Include & Initialization

```cpp
#include <OneSensor.h>

OneSensor sensor;

void setup() {
    Serial.begin(115200);
    sensor.begin(); // Initializes D2, D3, D4, D5, D6
}
```

## Main Loop Update

Call `sensor.update()` in `loop()` to sample incoming PWM signals.

```cpp
void loop() {
    sensor.update();
    // read values...
}
```

## Sensor Reading Methods

| Method | Return Type | Unit | Range | Description |
|---|---|---|---|---|
| `sensor.readTemperature()` | `float` | °C | 0.0 – 50.0 | Temperature reading |
| `sensor.readHumidity()` | `float` | % | 0.0 – 100.0 | Relative Humidity |
| `sensor.readGas()` | `float` | ppm | 0.0 – 1000.0 | Gas concentration |
| `sensor.readLight()` | `float` | lux | 0.0 – 1000.0 | Ambient light level |
| `sensor.readSoilMoisture()` | `float` | % | 0.0 – 100.0 | Soil moisture level |

Returns `NAN` if the signal is invalid, disconnected, or absent.
