/**
 * BasicFiveSensors.ino — OneSensor Example Sketch
 *
 * This is the canonical example from the project spec (prompt.md Section 1).
 * It must compile and run without modification once Phase 4 is complete.
 *
 * Wiring:
 *   ESP32 GPIO16 → Arduino D2  (Temperature)
 *   ESP32 GPIO17 → Arduino D3  (Humidity)
 *   ESP32 GPIO18 → Arduino D4  (Gas)
 *   ESP32 GPIO19 → Arduino D5  (Light)
 *   ESP32 GPIO21 → Arduino D6  (Soil Moisture)
 *   ESP32 GND    → Arduino GND (common ground — REQUIRED)
 *
 * See docs/wiring.md for full text wiring diagram.
 */

#include <OneSensor.h>

OneSensor sensor;

void setup() {
    Serial.begin(115200);
    sensor.begin();
}

void loop() {
    sensor.update();

    Serial.print(F("Temp: "));     Serial.print(sensor.readTemperature());  Serial.println(F(" °C"));
    Serial.print(F("Humidity: ")); Serial.print(sensor.readHumidity());     Serial.println(F(" %"));
    Serial.print(F("Gas: "));      Serial.print(sensor.readGas());          Serial.println(F(" ppm"));
    Serial.print(F("Light: "));    Serial.print(sensor.readLight());        Serial.println(F(" lux"));
    Serial.print(F("Soil: "));     Serial.print(sensor.readSoilMoisture()); Serial.println(F(" %"));
    Serial.println();

    delay(500);
}
