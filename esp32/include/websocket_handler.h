/**
 * websocket_handler.h — WebSocket message parser and dispatcher
 *
 * Inbound JSON supported:
 *   {"type":"set","sensor":"temperature","value":30.5}
 *   {"type":"start_ramp","sensor":"temperature","from":0.0,"to":50.0,"duration":10}
 *   {"type":"start_static","sensor":"temperature","value":25.0}
 *   {"type":"stop_scenario","sensor":"temperature"}
 *   {"type":"stop_all_scenarios"}
 *
 * Outbound JSON:
 *   {"type":"state","temperature":30.5,"humidity":50.0,"gas":500.0,"light":500.0,"soil":50.0}
 */
#pragma once
#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "sensor_state.h"
#include "channel_manager.h"
#include "scenario_engine.h"

class WebSocketHandler {
public:
    explicit WebSocketHandler(AsyncWebSocket* ws) : _ws(ws) {}

    // ── Helper: Map string to SensorType ──────────────────────────────────────
    static bool parseSensorType(const char* name, SensorType& typeOut) {
        if      (strcmp(name, "temperature")   == 0) { typeOut = SensorType::TEMPERATURE;   return true; }
        else if (strcmp(name, "humidity")      == 0) { typeOut = SensorType::HUMIDITY;      return true; }
        else if (strcmp(name, "gas")           == 0) { typeOut = SensorType::GAS;           return true; }
        else if (strcmp(name, "light")         == 0) { typeOut = SensorType::LIGHT;         return true; }
        else if (strcmp(name, "soil_moisture") == 0 || strcmp(name, "soil") == 0) {
            typeOut = SensorType::SOIL_MOISTURE;
            return true;
        }
        return false;
    }

    // ── Inbound: browser → ESP32 ──────────────────────────────────────────────
    void onMessage(AsyncWebSocketClient* client, const char* data, size_t len) {
        StaticJsonDocument<256> doc;
        DeserializationError err = deserializeJson(doc, data, len);
        if (err) {
            Serial.printf("[WS] JSON parse error: %s\n", err.c_str());
            _sendError(client, "invalid JSON");
            return;
        }

        const char* type = doc["type"] | "";
        const char* sensorName = doc["sensor"] | "";

        // 1. Manual SET command
        if (strcmp(type, "set") == 0) {
            SensorType sType;
            if (!parseSensorType(sensorName, sType)) {
                _sendError(client, "unknown sensor");
                return;
            }

            float value = doc["value"] | NAN;
            if (isnan(value)) {
                _sendError(client, "missing value");
                return;
            }

            // Manual set stops any scenario running on this sensor
            gScenarioEngine.stop(sType);
            gSensorState.set(sType, value);
            gChannelManager.updateAll();
            Serial.printf("[WS] SET %s = %.2f\n", sensorName, value);
            broadcastState();
            return;
        }

        // 2. Start RAMP Scenario command
        if (strcmp(type, "start_ramp") == 0) {
            SensorType sType;
            if (!parseSensorType(sensorName, sType)) {
                _sendError(client, "unknown sensor");
                return;
            }

            float fromVal = doc["from"] | doc["fromVal"] | 0.0f;
            float toVal   = doc["to"] | doc["toVal"] | 50.0f;
            float durSec  = doc["duration"] | 10.0f;
            uint32_t durMs = (uint32_t)(durSec * 1000.0f);

            gScenarioEngine.startRamp(sType, fromVal, toVal, durMs);
            broadcastState();
            return;
        }

        // 3. Start STATIC Scenario command
        if (strcmp(type, "start_static") == 0) {
            SensorType sType;
            if (!parseSensorType(sensorName, sType)) {
                _sendError(client, "unknown sensor");
                return;
            }

            float val = doc["value"] | 25.0f;
            gScenarioEngine.startStatic(sType, val);
            broadcastState();
            return;
        }

        // 4. Stop Scenario command
        if (strcmp(type, "stop_scenario") == 0) {
            SensorType sType;
            if (!parseSensorType(sensorName, sType)) {
                _sendError(client, "unknown sensor");
                return;
            }
            gScenarioEngine.stop(sType);
            broadcastState();
            return;
        }

        // 5. Stop ALL Scenarios
        if (strcmp(type, "stop_all_scenarios") == 0) {
            gScenarioEngine.stopAll();
            broadcastState();
            return;
        }

        _sendError(client, "unknown type");
    }

    // ── Outbound: ESP32 → all browsers ───────────────────────────────────────
    void broadcastState() {
        if (_ws->count() == 0) return;

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

    void onConnect(AsyncWebSocketClient* client) {
        Serial.printf("[WS] Client #%u connected from %s\n",
                      client->id(), client->remoteIP().toString().c_str());
        broadcastState();
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
