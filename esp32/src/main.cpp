/**
 * main.cpp — ESP32 OneSensor Firmware Entry Point
 *
 * Phases 1–6: PWM pipeline verified ✅
 * Phase 7:    ESP32 connects to Wi-Fi. PWM continues uninterrupted.
 *             Prints IP address once connected.
 * Phase 8+:   WebSocket server activated on top of Wi-Fi.
 *
 * Phase 7 exit criterion:
 *   - Serial prints IP address within 15 s of boot
 *   - All 5 PWM channels continue outputting correct duty during/after Wi-Fi
 *   - No blocking delay() anywhere in connect path
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include "channel_manager.h"
#include "wifi_manager.h"

// ─── Phase 7 Test Values (stable mid-point for easy scope verification) ───────
static const float TEST_TEMP  = 25.0f;   // °C  → 50% duty on GPIO16
static const float TEST_HUMID = 50.0f;   // %   → 50% duty on GPIO17
static const float TEST_GAS   = 500.0f;  // ppm → 50% duty on GPIO18
static const float TEST_LIGHT = 500.0f;  // lux → 50% duty on GPIO19
static const float TEST_SOIL  = 50.0f;   // %   → 50% duty on GPIO21

static const uint32_t STATUS_INTERVAL_MS = 2000;

// ─── setup() ─────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor ESP32 Firmware — Phase 7"));
    Serial.println(F("  Wi-Fi connection + PWM concurrent"));
    Serial.println(F("========================================"));

    // 1. Start PWM channels FIRST — they must never depend on Wi-Fi
    if (!gChannelManager.begin()) {
        Serial.println(F("[FATAL] Channel init failed. Halting."));
        while (true) { delay(1000); }
    }

    // 2. Set all sensors to stable mid-point test values
    gSensorState.set(SensorType::TEMPERATURE,  TEST_TEMP);
    gSensorState.set(SensorType::HUMIDITY,      TEST_HUMID);
    gSensorState.set(SensorType::GAS,           TEST_GAS);
    gSensorState.set(SensorType::LIGHT,         TEST_LIGHT);
    gSensorState.set(SensorType::SOIL_MOISTURE, TEST_SOIL);
    gChannelManager.updateAll();

    Serial.println(F("[PWM]  All 5 channels running at 50% duty (25°C / 50% / 500ppm / 500lux / 50%)"));
    Serial.println(F("[PWM]  These will stay stable even during Wi-Fi connect.\n"));

    // 3. Begin Wi-Fi (non-blocking — returns immediately)
    gWifiManager.begin();
}

// ─── loop() ──────────────────────────────────────────────────────────────────
void loop() {
    static uint32_t lastStatus = 0;

    // ── Keep PWM updated every loop tick (microseconds, never blocks) ─────────
    gChannelManager.updateAll();

    // ── Drive Wi-Fi state machine (non-blocking) ──────────────────────────────
    gWifiManager.update();

    // ── Periodic status print ─────────────────────────────────────────────────
    if (millis() - lastStatus >= STATUS_INTERVAL_MS) {
        lastStatus = millis();

        Serial.println(F("--- OneSensor Status ---"));
        for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
            const ChannelConfig& ch = CHANNEL_TABLE[i];
            float logVal  = gSensorState.getByType(ch.sensor);
            float dutyPct = valueToDutyPercent(logVal, ch.inputMin, ch.inputMax);
            const char* name = "?    ";
            switch (ch.sensor) {
                case SensorType::TEMPERATURE:   name = "Temp "; break;
                case SensorType::HUMIDITY:      name = "Humid"; break;
                case SensorType::GAS:           name = "Gas  "; break;
                case SensorType::LIGHT:         name = "Light"; break;
                case SensorType::SOIL_MOISTURE: name = "Soil "; break;
            }
            Serial.printf("  %s GPIO%-2u  val=%6.1f  duty=%5.1f%%\n",
                          name, ch.gpio, logVal, dutyPct);
        }

        // Wi-Fi status line
        if (gWifiManager.isConnected()) {
            Serial.printf("  WiFi  %-15s  RSSI=%d dBm\n",
                          gWifiManager.localIP().toString().c_str(),
                          WiFi.RSSI());
        } else {
            Serial.println(F("  WiFi  connecting..."));
        }
        Serial.println(F("------------------------"));
    }
}
