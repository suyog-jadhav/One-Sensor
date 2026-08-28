/**
 * main.cpp — ESP32 OneSensor Firmware Entry Point
 *
 * Phases 1–7: PWM + Wi-Fi verified ✅
 * Phase 8:    WebSocket server active.
 *             Browser sends JSON → ESP32 updates SensorState → PWM changes live.
 * Phase 9+:   Full dashboard HTML served from SPIFFS.
 *
 * Phase 8 exit criterion:
 *   curl or wscat sends {"type":"set","sensor":"temperature","value":40.0}
 *   → ESP32 replies {"type":"state","temperature":40.0,...}
 *   → Arduino Serial shows temperature jump to 40.0°C
 *   → All other channels unchanged
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include "channel_manager.h"
#include "wifi_manager.h"
#include "http_server.h"

// Boot defaults — mid-range on all channels
static const float BOOT_TEMP  = 25.0f;
static const float BOOT_HUMID = 50.0f;
static const float BOOT_GAS   = 500.0f;
static const float BOOT_LIGHT = 500.0f;
static const float BOOT_SOIL  = 50.0f;

static const uint32_t STATUS_INTERVAL_MS  = 3000;
static const uint32_t BROADCAST_INTERVAL_MS = 1000;  // push state to browser

static bool _serverStarted = false;

// ─── setup() ─────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor ESP32 Firmware — Phase 8"));
    Serial.println(F("  WebSocket server active"));
    Serial.println(F("========================================"));

    // 1. PWM first — independent of network
    if (!gChannelManager.begin()) {
        Serial.println(F("[FATAL] Channel init failed. Halting."));
        while (true) { delay(1000); }
    }
    gSensorState.set(SensorType::TEMPERATURE,  BOOT_TEMP);
    gSensorState.set(SensorType::HUMIDITY,      BOOT_HUMID);
    gSensorState.set(SensorType::GAS,           BOOT_GAS);
    gSensorState.set(SensorType::LIGHT,         BOOT_LIGHT);
    gSensorState.set(SensorType::SOIL_MOISTURE, BOOT_SOIL);
    gChannelManager.updateAll();
    Serial.println(F("[PWM]  All 5 channels running at boot defaults (50% duty)"));

    // 2. Wi-Fi (non-blocking)
    gWifiManager.begin();
}

// ─── loop() ──────────────────────────────────────────────────────────────────
void loop() {
    static uint32_t lastStatus    = 0;
    static uint32_t lastBroadcast = 0;

    // ── PWM — must run every tick ─────────────────────────────────────────────
    gChannelManager.updateAll();

    // ── Wi-Fi state machine ───────────────────────────────────────────────────
    gWifiManager.update();

    // ── Start HTTP/WebSocket server once Wi-Fi is up (only once) ─────────────
    if (gWifiManager.isConnected() && !_serverStarted) {
        _serverStarted = true;
        gHttpServer.begin();
    }

    // ── WebSocket housekeeping ─────────────────────────────────────────────────
    if (_serverStarted) {
        gHttpServer.update();  // cleans up disconnected clients
    }

    // ── Periodic state broadcast to connected browsers ────────────────────────
    if (_serverStarted && millis() - lastBroadcast >= BROADCAST_INTERVAL_MS) {
        lastBroadcast = millis();
        if (gHttpServer.clientCount() > 0) {
            gHttpServer.broadcastState();
        }
    }

    // ── Serial status ─────────────────────────────────────────────────────────
    if (millis() - lastStatus >= STATUS_INTERVAL_MS) {
        lastStatus = millis();
        SensorValues v = gSensorState.get();
        Serial.printf("[Status] T=%.1f H=%.1f G=%.0f L=%.0f S=%.1f | "
                      "WiFi=%s | WS clients=%u\n",
                      v.temperature, v.humidity, v.gas, v.light, v.soilMoisture,
                      gWifiManager.isConnected()
                          ? gWifiManager.localIP().toString().c_str()
                          : "connecting",
                      _serverStarted ? gHttpServer.clientCount() : 0);
    }
}
