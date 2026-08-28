/**
 * websocket_handler.h — WebSocket message parser and dispatcher
 *
 * Handles inbound JSON from browser:
 *   {"type":"set","sensor":"temperature","value":30.5}
 *
 * Sends outbound JSON to all connected clients:
 *   {"type":"state","temperature":30.5,"humidity":50.0,"gas":500.0,"light":500.0,"soil":50.0}
 *
 * Design rules:
 *  - Called from AsyncWebServer callbacks (NOT from loop()) — must be ISR-safe
 *  - Uses SensorState's critical-section setter — no raw float writes
 *  - Broadcasts state update to ALL connected clients after every set
 *  - Unknown fields are silently ignored (forward-compatible)
 */
#pragma once
#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "sensor_state.h"
#include "channel_manager.h"

class WebSocketHandler {
public:
    explicit WebSocketHandler(AsyncWebSocket* ws) : _ws(ws) {}

    // ── Inbound: browser → ESP32 ──────────────────────────────────────────────
    void onMessage(AsyncWebSocketClient* client, const char* data, size_t len) {
        // Stack-allocate a small doc — no heap fragmentation
        StaticJsonDocument<256> doc;
        DeserializationError err = deserializeJson(doc, data, len);
        if (err) {
            Serial.printf("[WS] JSON parse error: %s\n", err.c_str());
            _sendError(client, "invalid JSON");
            return;
        }

        const char* type = doc["type"] | "";
        if (strcmp(type, "set") != 0) {
            _sendError(client, "unknown type");
            return;
        }

        const char* sensorName = doc["sensor"] | "";
        float value = doc["value"] | NAN;

        if (isnan(value)) {
            _sendError(client, "missing value");
            return;
        }

        // Map sensor name → SensorType → SensorState
        bool found = false;
        if      (strcmp(sensorName, "temperature")   == 0) { gSensorState.set(SensorType::TEMPERATURE,   value); found = true; }
        else if (strcmp(sensorName, "humidity")      == 0) { gSensorState.set(SensorType::HUMIDITY,       value); found = true; }
        else if (strcmp(sensorName, "gas")           == 0) { gSensorState.set(SensorType::GAS,            value); found = true; }
        else if (strcmp(sensorName, "light")         == 0) { gSensorState.set(SensorType::LIGHT,          value); found = true; }
        else if (strcmp(sensorName, "soil_moisture") == 0) { gSensorState.set(SensorType::SOIL_MOISTURE,  value); found = true; }

        if (!found) {
            _sendError(client, "unknown sensor");
            return;
        }

        // Push to PWM immediately
        gChannelManager.updateAll();

        Serial.printf("[WS] SET %s = %.2f\n", sensorName, value);

        // Broadcast new state to all connected clients
        broadcastState();
    }

    // ── Outbound: ESP32 → all browsers ───────────────────────────────────────
    void broadcastState() {
        if (_ws->count() == 0) return;   // nobody connected — skip

        SensorValues v = gSensorState.get();

        StaticJsonDocument<256> doc;
        doc["type"]        = "state";
        doc["temperature"] = round(v.temperature  * 100.0f) / 100.0f;
        doc["humidity"]    = round(v.humidity      * 100.0f) / 100.0f;
        doc["gas"]         = round(v.gas           * 10.0f)  / 10.0f;
        doc["light"]       = round(v.light         * 10.0f)  / 10.0f;
        doc["soil"]        = round(v.soilMoisture  * 100.0f) / 100.0f;

        char buf[256];
        size_t n = serializeJson(doc, buf, sizeof(buf));
        _ws->textAll(buf, n);
    }

    // ── Connection events ─────────────────────────────────────────────────────
    void onConnect(AsyncWebSocketClient* client) {
        Serial.printf("[WS] Client #%u connected from %s\n",
                      client->id(), client->remoteIP().toString().c_str());
        // Send current state immediately on connect
        SensorValues v = gSensorState.get();
        StaticJsonDocument<256> doc;
        doc["type"]        = "state";
        doc["temperature"] = v.temperature;
        doc["humidity"]    = v.humidity;
        doc["gas"]         = v.gas;
        doc["light"]       = v.light;
        doc["soil"]        = v.soilMoisture;
        char buf[256];
        size_t n = serializeJson(doc, buf, sizeof(buf));
        client->text(buf, n);
    }

    void onDisconnect(AsyncWebSocketClient* client) {
        Serial.printf("[WS] Client #%u disconnected\n", client->id());
    }

private:
    AsyncWebSocket* _ws;

    void _sendError(AsyncWebSocketClient* client, const char* msg) {
        StaticJsonDocument<128> doc;
        doc["type"]  = "error";
        doc["error"] = msg;
        char buf[128];
        size_t n = serializeJson(doc, buf, sizeof(buf));
        client->text(buf, n);
    }
};
