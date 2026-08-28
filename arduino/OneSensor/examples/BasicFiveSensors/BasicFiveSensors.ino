/**
 * BasicFiveSensors.ino — OneSensor Canonical Example Sketch
 *
 * Demonstrates basic usage of the OneSensor library for reading 5 sensors.
 *
 * WIRING:
 *   ESP32 GPIO16 → Arduino D2  (Temperature)
 *   ESP32 GPIO17 → Arduino D3  (Humidity)
 *   ESP32 GPIO18 → Arduino D4  (Gas)
 *   ESP32 GPIO19 → Arduino D5  (Light)
 *   ESP32 GPIO21 → Arduino D6  (Soil Moisture)
 *   ESP32 GND    → Arduino GND (Common Ground)
 */

#include <OneSensor.h>

OneSensor sensor;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor — Canonical Arduino Example"));
    Serial.println(F("========================================"));

    sensor.begin();
    Serial.println(F("OneSensor initialized successfully. Reading sensors...\n"));
}

void loop() {
    // 1. Update pulseIn PWM measurements for all channels
    sensor.update();

    // 2. Read decoded logical sensor values
    float temp  = sensor.readTemperature();
    float humid = sensor.readHumidity();
    float gas   = sensor.readGas();
    float light = sensor.readLight();
    float soil  = sensor.readSoilMoisture();

    // 3. Print values
    Serial.print(F("Temp: "));     Serial.print(temp, 2);  Serial.println(F(" °C"));
    Serial.print(F("Humidity: ")); Serial.print(humid, 2); Serial.println(F(" %"));
    Serial.print(F("Gas: "));      Serial.print(gas, 1);   Serial.println(F(" ppm"));
    Serial.print(F("Light: "));    Serial.print(light, 1); Serial.println(F(" lux"));
    Serial.print(F("Soil: "));     Serial.print(soil, 2);  Serial.println(F(" %"));
    Serial.println(F("----------------------------------------"));

    delay(500);
}
