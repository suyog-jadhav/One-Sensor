/**
 * main.cpp — ESP32 OneSensor Firmware Entry Point
 *
 * Phase 1: Outputs one fixed 50% PWM signal on the Temperature channel (GPIO16).
 *          No Wi-Fi. No WebSocket. No sensor math yet.
 *
 * Phase 3+: SensorState set to a default value; ValueMapper converts to duty.
 * Phase 7+: Wi-Fi added; Phase 8+: WebSocket server activated.
 *
 * Build with PlatformIO: `pio run --target upload`
 * Monitor:               `pio device monitor`
 *
 * Exit criterion for Phase 1:
 *   Serial prints "PWM running..." and the duty values for each configured channel.
 *   A second device (another Arduino/ESP32) or logic analyser confirms ~50% duty
 *   on GPIO16 at 500 Hz.
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include "channel_manager.h"

// ─── Phase 1 Configuration ────────────────────────────────────────────────────
// In Phase 1 we output a fixed 50% duty on channel 0 (Temperature GPIO).
// Set PHASE1_FIXED_DUTY to the duty cycle you want to verify.
// At Phase 3+, this is replaced by gSensorState-driven values.
static const float PHASE1_FIXED_DUTY = 50.0f;   // %

// Print interval for status logging (ms)
static const uint32_t STATUS_INTERVAL_MS = 2000;

// ─── setup() ─────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);  // Let serial monitor connect

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor ESP32 Firmware — Phase 1"));
    Serial.println(F("========================================"));
    Serial.printf("  CHANNEL_COUNT : %u\n", CHANNEL_COUNT);
    Serial.printf("  PWM Frequency : %u Hz (first channel)\n", CHANNEL_TABLE[0].frequencyHz);
    Serial.printf("  Resolution    : %u-bit\n", CHANNEL_TABLE[0].resolutionBits);
    Serial.println(F("----------------------------------------"));

    // Initialise all channels (validates GPIO config, sets up LEDC, outputs defaults)
    if (!gChannelManager.begin()) {
        Serial.println(F("[FATAL] Channel init failed. Check wiring and hardware_config.h."));
        // Halt — do not proceed with bad config
        while (true) { delay(1000); }
    }

    // Phase 1: Override channel 0 (Temperature) with a fixed 50% duty for verification.
    // This bypasses SensorState / ValueMapper intentionally so Phase 1 can be
    // verified without Phase 3 math being correct first.
    Serial.printf("\n[Phase 1] Setting fixed %.0f%% duty on Temperature channel (GPIO%u)...\n",
                  PHASE1_FIXED_DUTY, CHANNEL_TABLE[0].gpio);
    gChannelManager.setDutyPercent(0, PHASE1_FIXED_DUTY);

    Serial.println(F("\n[Phase 1] PWM running. Verify duty cycle on GPIO16 with:"));
    Serial.println(F("           - A second Arduino running PwmDecoder (Phase 2)"));
    Serial.println(F("           - A logic analyser"));
    Serial.println(F("           - A scope or frequency counter"));
    Serial.println(F("\n[Phase 1] Status will print every 2 seconds."));
}

// ─── loop() ──────────────────────────────────────────────────────────────────
void loop() {
    static uint32_t lastStatus = 0;

    // Periodic status print (not every loop — that would flood Serial)
    if (millis() - lastStatus >= STATUS_INTERVAL_MS) {
        lastStatus = millis();

        Serial.println(F("\n--- OneSensor Status ---"));
        for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
            const ChannelConfig& ch = CHANNEL_TABLE[i];
            float logVal   = gSensorState.getByType(ch.sensor);
            float dutyPct  = valueToDutyPercent(logVal, ch.inputMin, ch.inputMax);
            const char* sensorName = "UNKNOWN";
            switch (ch.sensor) {
                case SensorType::TEMPERATURE:   sensorName = "Temperature";   break;
                case SensorType::HUMIDITY:      sensorName = "Humidity";      break;
                case SensorType::GAS:           sensorName = "Gas";           break;
                case SensorType::LIGHT:         sensorName = "Light";         break;
                case SensorType::SOIL_MOISTURE: sensorName = "SoilMoisture";  break;
            }
            Serial.printf("  Ch%u %-14s GPIO%-2u  value=%6.1f  duty=%5.1f%%\n",
                          i, sensorName, ch.gpio, logVal, dutyPct);
        }
        Serial.println(F("------------------------"));
    }

    // Phase 3+: gChannelManager.updateAll() will be called here to push
    // live SensorState values to PWM. Not needed in Phase 1 (fixed duty set in setup).
    // Uncomment for Phase 3+:
    // gChannelManager.updateAll();
}
