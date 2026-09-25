/**
 * main.cpp — ESP32 OneSensor Firmware Entry Point
 *
 * Phase 2 + Expansion: 12 channels (5 original + 7 new: motionX/Y/Z, proximity, sound, UV, CO2)
 *                       Fault Injection engine active.
 *                       Scenario Engine active (STATIC + RAMP, all 12 sensors).
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include "channel_manager.h"
#include "config_store.h"
#include "wifi_manager.h"
#include "http_server.h"
#include "scenario_engine.h"

// ─── Boot defaults (mid-range per channel) ────────────────────────────────────
static const float BOOT_TEMP      = 25.0f;
static const float BOOT_HUMID     = 50.0f;
static const float BOOT_GAS       = 300.0f;
static const float BOOT_LIGHT     = 500.0f;
static const float BOOT_SOIL      = 50.0f;
static const float BOOT_MOTION_X  = 0.0f;
static const float BOOT_MOTION_Y  = 0.0f;
static const float BOOT_MOTION_Z  = 1.0f;   // resting gravity 1 g
static const float BOOT_PROXIMITY = 50.0f;
static const float BOOT_SOUND     = 40.0f;
static const float BOOT_UV        = 2.0f;
static const float BOOT_CO2       = 420.0f;

static const uint32_t STATUS_INTERVAL_MS    = 3000;
static const uint32_t BROADCAST_INTERVAL_MS = 250;  // 4 Hz live update during scenarios

static bool _serverStarted = false;

// ─── setup() ─────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor ESP32 Firmware — Phase 2"));
    Serial.println(F("  12-Channel Synthesis + Fault Engine"));
    Serial.println(F("========================================"));

    // 0. ConfigStore NVS initialization
    gConfigStore.begin();

    // 1. Hardware channels (LEDC PWM + DAC) — independent of network
    if (!gChannelManager.begin()) {
        Serial.println(F("[FATAL] Channel init failed. Halting."));
        while (true) { delay(1000); }
    }

    // Set all sensor boot defaults
    gSensorState.set(SensorType::TEMPERATURE,   BOOT_TEMP);
    gSensorState.set(SensorType::HUMIDITY,      BOOT_HUMID);
    gSensorState.set(SensorType::GAS,           BOOT_GAS);
    gSensorState.set(SensorType::LIGHT,         BOOT_LIGHT);
    gSensorState.set(SensorType::SOIL_MOISTURE, BOOT_SOIL);
    gSensorState.setMotion(BOOT_MOTION_X, BOOT_MOTION_Y, BOOT_MOTION_Z);
    gSensorState.set(SensorType::PROXIMITY,     BOOT_PROXIMITY);
    gSensorState.set(SensorType::SOUND,         BOOT_SOUND);
    gSensorState.set(SensorType::UV,            BOOT_UV);
    gSensorState.set(SensorType::CO2,           BOOT_CO2);
    gChannelManager.updateAll();
    Serial.println(F("[PWM]  All 12 channels running at boot defaults"));

    // 2. Wi-Fi (non-blocking)
    gWifiManager.begin();
}

// ─── loop() ──────────────────────────────────────────────────────────────────
void loop() {
    static uint32_t lastStatus    = 0;
    static uint32_t lastBroadcast = 0;

    // ── 1. Scenario Engine ticks every loop iteration (non-blocking) ─────────
    gScenarioEngine.update(gSensorState, gChannelManager);

    // ── 2. PWM — must run every tick ─────────────────────────────────────────
    gChannelManager.updateAll();

    // ── 3. Wi-Fi state machine ───────────────────────────────────────────────
    gWifiManager.update();

    // ── 4. Start HTTP/WebSocket server once Wi-Fi is up ──────────────────────
    if (gWifiManager.isConnected() && !_serverStarted) {
        _serverStarted = true;
        gHttpServer.begin();
    }

    // ── 5. WebSocket housekeeping ─────────────────────────────────────────────
    if (_serverStarted) {
        gHttpServer.update();
    }

    // ── 6. Periodic state broadcast to connected browsers ────────────────────
    if (_serverStarted && millis() - lastBroadcast >= BROADCAST_INTERVAL_MS) {
        lastBroadcast = millis();
        if (gHttpServer.clientCount() > 0) {
            gHttpServer.broadcastState();
        }
    }

    // ── 7. Serial status ─────────────────────────────────────────────────────
    if (millis() - lastStatus >= STATUS_INTERVAL_MS) {
        lastStatus = millis();
        SensorValues v = gSensorState.get();
        Serial.printf("[Status] T=%.1f H=%.1f G=%.0f L=%.0f S=%.1f | "
                      "mX=%.2f mY=%.2f mZ=%.2f | "
                      "Prox=%.0f Sound=%.0f UV=%.1f CO2=%.0f | "
                      "WiFi=%s | WS clients=%u\n",
                      v.temperature, v.humidity, v.gas, v.light, v.soilMoisture,
                      v.motionX, v.motionY, v.motionZ,
                      v.proximity, v.sound, v.uv, v.co2,
                      gWifiManager.isConnected()
                          ? gWifiManager.localIP().toString().c_str()
                          : "connecting",
                      _serverStarted ? gHttpServer.clientCount() : 0);
    }
}
