/**
 * DynamicConfig.ino — OneSensor Dynamic Runtime Configuration Example
 *
 * Demonstrates how to:
 *   1. Change sensor value ranges at runtime with setRange()
 *   2. Remap sensor channels to different pins with setPin()
 *   3. Persist the modified config to EEPROM with saveConfig()
 *   4. Reset to compiled defaults with resetConfig()
 *   5. Receive live reconfiguration over Serial (JSON provisioning)
 *
 * WIRING: Same as BasicFiveSensors / ArduinoChannelConfig.h defaults.
 *
 * SERIAL PROVISIONING COMMANDS (send via Arduino IDE Serial Monitor):
 *   PROVISION          — Request a READY message (useful for host detection)
 *   RESET_CONFIG       — Restore compiled defaults and clear EEPROM
 *   {"channels":{"temperature":{"min":0,"max":100},"co2":{"min":350,"max":2000}}}
 *                      — Partial channel reconfiguration (only listed fields change)
 */

#include <OneSensor.h>

OneSensor sensor;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n============================================="));
    Serial.println(F("  OneSensor v2 — Dynamic Configuration Demo"));
    Serial.println(F("============================================="));

    // begin() loads EEPROM config if saved, otherwise uses compiled defaults.
    sensor.begin();

    // ── Example 1: Expand temperature range beyond default 0–50 °C ──────────
    bool ok = sensor.setRange(SensorType::TEMPERATURE, -10.0f, 85.0f);
    Serial.print(F("[Config] Temperature range set to -10..85 °C: "));
    Serial.println(ok ? F("OK") : F("FAILED"));

    // ── Example 2: Tighten CO2 range for indoor air quality monitoring ───────
    ok = sensor.setRange(SensorType::CO2, 350.0f, 2000.0f);
    Serial.print(F("[Config] CO2 range set to 350..2000 ppm: "));
    Serial.println(ok ? F("OK") : F("FAILED"));

    // ── Example 3: Full channel reconfiguration (pin + signal + range) ───────
    // Reassign Motion X to a different pin if needed:
    // ok = sensor.configureChannel(SensorType::MOTION_X, 3, SignalType::PWM, -4.0f, 4.0f);

    // ── Example 4: Save modified config to EEPROM ────────────────────────────
    sensor.saveConfig();
    Serial.println(F("[Config] Configuration saved to EEPROM."));

    // ── Read active config for verification ──────────────────────────────────
    const ArduinoChannelConfig* tempCfg = sensor.getChannelConfig(SensorType::TEMPERATURE);
    if (tempCfg) {
        Serial.print(F("[Verify] Temp pin=A"));
        Serial.print(tempCfg->pin == A0 ? 0 : tempCfg->pin == A1 ? 1 : tempCfg->pin);
        Serial.print(F(", signal="));
        Serial.print(tempCfg->signal == SignalType::DAC ? F("DAC") : F("PWM"));
        Serial.print(F(", range="));
        Serial.print(tempCfg->outputMin, 1);
        Serial.print(F(" to "));
        Serial.print(tempCfg->outputMax, 1);
        Serial.println(F(" °C"));
    }

    Serial.println(F("\nReady. Send JSON or RESET_CONFIG over Serial to reconfigure live.\n"));
}

void loop() {
    // update() processes both sensor signal decoding AND incoming Serial commands.
    // The library's built-in _checkSerialCommands() handles JSON provisioning
    // automatically — no extra code needed here.
    sensor.update();

    // Read and print Temperature + CO2 to confirm the new ranges are active.
    float temp = sensor.readTemperature();
    float co2  = sensor.readCO2();
    float prox = sensor.readProximity();

    Serial.print(F("Temp: "));  Serial.print(temp, 2); Serial.print(F(" °C  |  "));
    Serial.print(F("CO2: "));   Serial.print(co2,  0); Serial.print(F(" ppm  |  "));
    Serial.print(F("Prox: "));  Serial.print(prox, 1); Serial.println(F(" cm"));

    delay(1000);
}
