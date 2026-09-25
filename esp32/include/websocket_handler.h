/**
 * websocket_handler.h — WebSocket message parser, config protocol handler, and state dispatcher
 *
 * Inbound JSON supported:
 *   {"type":"set","sensor":"temperature","value":30.5}
 *   {"type":"set","sensor":"motion","x":0.1,"y":-0.2,"z":0.98}
 *   {"type":"motion","x":0.1,"y":-0.2,"z":0.98}
 *   {"type":"fault","sensor":"proximity","fault":"noise","magnitude":15,"durationMs":0,"latencyMs":0}
 *   {"type":"fault_clear","sensor":"proximity"} // or sensor:"all"
 *   {"type":"start_ramp","sensor":"temperature","from":0.0,"to":50.0,"duration":10}
 *   {"type":"start_static","sensor":"temperature","value":25.0}
 *   {"type":"stop_scenario","sensor":"temperature"}
 *   {"type":"stop_all_scenarios"}
 *   {"type":"get_config"}
 *   {"type":"set_config","channels":[...]}
 *   {"type":"reset_config"}
 */
#pragma once
#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "sensor_state.h"
#include "channel_manager.h"
#include "config_store.h"
#include "scenario_engine.h"
#include "fault_engine.h"

class WebSocketHandler {
public:
    explicit WebSocketHandler(AsyncWebSocket* ws) : _ws(ws) {}

    // ── Helper: Map SensorType enum to/from string ────────────────────────────
    static bool parseSensorType(const char* name, SensorType& typeOut) {
        if      (strcmp(name, "temperature")   == 0) { typeOut = SensorType::TEMPERATURE;   return true; }
        else if (strcmp(name, "humidity")      == 0) { typeOut = SensorType::HUMIDITY;      return true; }
        else if (strcmp(name, "gas")           == 0) { typeOut = SensorType::GAS;           return true; }
        else if (strcmp(name, "light")         == 0) { typeOut = SensorType::LIGHT;         return true; }
        else if (strcmp(name, "soil_moisture") == 0 || strcmp(name, "soil") == 0) {
            typeOut = SensorType::SOIL_MOISTURE;
            return true;
        }
        else if (strcmp(name, "motionX")       == 0) { typeOut = SensorType::MOTION_X;      return true; }
        else if (strcmp(name, "motionY")       == 0) { typeOut = SensorType::MOTION_Y;      return true; }
        else if (strcmp(name, "motionZ")       == 0) { typeOut = SensorType::MOTION_Z;      return true; }
        else if (strcmp(name, "proximity")     == 0) { typeOut = SensorType::PROXIMITY;     return true; }
        else if (strcmp(name, "sound")         == 0) { typeOut = SensorType::SOUND;         return true; }
        else if (strcmp(name, "uv")            == 0) { typeOut = SensorType::UV;            return true; }
        else if (strcmp(name, "co2")           == 0) { typeOut = SensorType::CO2;           return true; }
        return false;
    }

    static const char* sensorTypeToString(SensorType type) {
        switch (type) {
            case SensorType::TEMPERATURE:   return "temperature";
            case SensorType::HUMIDITY:      return "humidity";
            case SensorType::GAS:           return "gas";
            case SensorType::LIGHT:         return "light";
            case SensorType::SOIL_MOISTURE: return "soil_moisture";
            case SensorType::MOTION_X:      return "motionX";
            case SensorType::MOTION_Y:      return "motionY";
            case SensorType::MOTION_Z:      return "motionZ";
            case SensorType::PROXIMITY:     return "proximity";
            case SensorType::SOUND:         return "sound";
            case SensorType::UV:            return "uv";
            case SensorType::CO2:           return "co2";
            default:                        return "unknown";
        }
    }

    // ── Helper: Map SignalType enum to/from string ────────────────────────────
    static bool parseSignalType(const char* name, SignalType& typeOut) {
        if (strcasecmp(name, "pwm") == 0) { typeOut = SignalType::PWM; return true; }
        if (strcasecmp(name, "dac") == 0) { typeOut = SignalType::DAC; return true; }
        return false;
    }

    static const char* signalTypeToString(SignalType type) {
        switch (type) {
            case SignalType::PWM: return "pwm";
            case SignalType::DAC: return "dac";
            default:              return "unknown";
        }
    }

    // ── Helper: Map FaultType enum to/from string ─────────────────────────────
    static bool parseFaultType(const char* name, FaultType& typeOut) {
        if      (strcasecmp(name, "none") == 0)       { typeOut = FaultType::NONE;       return true; }
        else if (strcasecmp(name, "dropout") == 0)    { typeOut = FaultType::DROPOUT;    return true; }
        else if (strcasecmp(name, "stuck") == 0)      { typeOut = FaultType::STUCK;      return true; }
        else if (strcasecmp(name, "noise") == 0)      { typeOut = FaultType::NOISE;      return true; }
        else if (strcasecmp(name, "spike") == 0)      { typeOut = FaultType::SPIKE;      return true; }
        else if (strcasecmp(name, "drift") == 0)      { typeOut = FaultType::DRIFT;      return true; }
        else if (strcasecmp(name, "disconnect") == 0) { typeOut = FaultType::DISCONNECT; return true; }
        else if (strcasecmp(name, "latency") == 0)    { typeOut = FaultType::LATENCY;    return true; }
        return false;
    }

    static const char* faultTypeToString(FaultType type) {
        switch (type) {
            case FaultType::NONE:       return "none";
            case FaultType::DROPOUT:    return "dropout";
            case FaultType::STUCK:      return "stuck";
            case FaultType::NOISE:      return "noise";
            case FaultType::SPIKE:      return "spike";
            case FaultType::DRIFT:      return "drift";
            case FaultType::DISCONNECT: return "disconnect";
            case FaultType::LATENCY:    return "latency";
            default:                    return "none";
        }
    }

    // ── Inbound Message Handling ──────────────────────────────────────────────
    void onMessage(AsyncWebSocketClient* client, const char* data, size_t len) {
        DynamicJsonDocument doc(4096);
        DeserializationError err = deserializeJson(doc, data, len);
        if (err) {
            Serial.printf("[WS] JSON parse error: %s\n", err.c_str());
            _sendError(client, "invalid JSON");
            return;
        }

        const char* type = doc["type"] | "";
        const char* sensorName = doc["sensor"] | "";

        // 1. Compound Motion message
        if (strcmp(type, "motion") == 0 || (strcmp(type, "set") == 0 && strcmp(sensorName, "motion") == 0)) {
            float x = doc["x"] | 0.0f;
            float y = doc["y"] | 0.0f;
            float z = doc["z"] | 1.0f;
            gSensorState.setMotion(x, y, z);
            gChannelManager.updateAll();
            broadcastState();
            return;
        }

        // 2. Manual SET command
        if (strcmp(type, "set") == 0 || strcmp(type, "set_value") == 0) {
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

            gScenarioEngine.stop(sType);
            gSensorState.set(sType, value);
            gChannelManager.updateAll();
            Serial.printf("[WS] SET %s = %.2f\n", sensorName, value);
            broadcastState();
            return;
        }

        // 3. FAULT Injection command
        if (strcmp(type, "fault") == 0) {
            SensorType sType;
            if (!parseSensorType(sensorName, sType)) {
                _sendError(client, "unknown sensor for fault");
                return;
            }

            const char* faultStr = doc["fault"] | "none";
            FaultType fType;
            if (!parseFaultType(faultStr, fType)) {
                _sendError(client, "unknown fault type");
                return;
            }

            ChannelFaultState f;
            f.type = fType;
            f.magnitude = doc["magnitude"] | 0.0f;
            f.latencyMs = doc["latencyMs"] | doc["latency"] | 0;
            f.durationMs = doc["durationMs"] | doc["duration"] | 0;
            f.startedAtMs = millis();

            // Find channel index
            const auto& cfg = gChannelManager.getConfig();
            for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
                if (cfg[i].sensor == sType) {
                    gSensorState.setFault(i, f);
                    break;
                }
            }

            gChannelManager.updateAll();
            broadcastState();
            return;
        }

        // 4. FAULT_CLEAR command
        if (strcmp(type, "fault_clear") == 0) {
            if (strcmp(sensorName, "all") == 0 || strlen(sensorName) == 0) {
                gSensorState.clearAllFaults();
            } else {
                SensorType sType;
                if (parseSensorType(sensorName, sType)) {
                    const auto& cfg = gChannelManager.getConfig();
                    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
                        if (cfg[i].sensor == sType) {
                            gSensorState.clearFault(i);
                            break;
                        }
                    }
                }
            }
            gChannelManager.updateAll();
            broadcastState();
            return;
        }

        // 5. Start RAMP Scenario command
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

        // 6. Start STATIC Scenario command
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

        // 7. Stop Scenario command
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

        // 8. Stop ALL Scenarios
        if (strcmp(type, "stop_all_scenarios") == 0) {
            gScenarioEngine.stopAll();
            broadcastState();
            return;
        }

        // 9. Config Protocol: GET_CONFIG
        if (strcmp(type, "get_config") == 0) {
            sendConfigState(client);
            return;
        }

        // 10. Config Protocol: SET_CONFIG
        if (strcmp(type, "set_config") == 0) {
            JsonArray channelsArr = doc["channels"].as<JsonArray>();
            if (channelsArr.isNull() || channelsArr.size() != MAX_CHANNELS) {
                _sendConfigError(client, "channels array must contain exactly 12 channel configurations");
                return;
            }

            std::array<ChannelConfig, MAX_CHANNELS> newCfg = gChannelManager.getConfig();

            for (size_t i = 0; i < MAX_CHANNELS; i++) {
                JsonObject chObj = channelsArr[i];
                if (chObj.isNull()) {
                    _sendConfigError(client, "Invalid channel configuration object at index " + String(i));
                    return;
                }

                const char* sStr = chObj["sensor"] | "";
                SensorType sType;
                if (!parseSensorType(sStr, sType)) {
                    _sendConfigError(client, "Invalid sensor name '" + String(sStr) + "' at channel index " + String(i));
                    return;
                }

                const char* sigStr = chObj["signal"] | "";
                SignalType sigType;
                if (!parseSignalType(sigStr, sigType)) {
                    _sendConfigError(client, "Invalid signal type '" + String(sigStr) + "' at channel index " + String(i));
                    return;
                }

                newCfg[i].sensor         = sType;
                newCfg[i].signal         = sigType;
                newCfg[i].gpio           = chObj["gpio"] | newCfg[i].gpio;
                newCfg[i].ledcChannel    = chObj["ledcChannel"] | (uint8_t)i;
                newCfg[i].frequencyHz    = chObj["frequencyHz"] | newCfg[i].frequencyHz;
                newCfg[i].resolutionBits = chObj["resolutionBits"] | newCfg[i].resolutionBits;
                newCfg[i].inputMin       = chObj["inputMin"] | newCfg[i].inputMin;
                newCfg[i].inputMax       = chObj["inputMax"] | newCfg[i].inputMax;
                newCfg[i].defaultValue   = chObj["defaultValue"] | newCfg[i].defaultValue;
                newCfg[i].calOffset      = chObj["calOffset"] | 0.0f;
                newCfg[i].calScale       = chObj["calScale"] | 1.0f;
            }

            String errorReason;
            if (gChannelManager.applyConfig(newCfg, errorReason)) {
                broadcastConfigState();
            } else {
                _sendConfigError(client, errorReason.c_str());
            }
            return;
        }

        // 11. Config Protocol: RESET_CONFIG
        if (strcmp(type, "reset_config") == 0) {
            gConfigStore.resetToDefaults();
            std::array<ChannelConfig, MAX_CHANNELS> defaultCfg;
            for (size_t i = 0; i < MAX_CHANNELS; i++) {
                defaultCfg[i] = DEFAULT_CHANNEL_TABLE[i];
            }
            String errorReason;
            gChannelManager.applyConfig(defaultCfg, errorReason);
            broadcastConfigState();
            return;
        }

        _sendError(client, "unknown type");
    }

    // ── Outbound: Broadcast Sensor State & Faults to ALL connected clients ─────
    void broadcastState() {
        if (_ws->count() == 0) return;

        SensorValues v = gSensorState.get();

        DynamicJsonDocument doc(2048);
        doc["type"]          = "state";
        doc["temperature"]   = round(v.temperature  * 100.0f) / 100.0f;
        doc["humidity"]      = round(v.humidity     * 100.0f) / 100.0f;
        doc["gas"]           = round(v.gas          * 10.0f)  / 10.0f;
        doc["light"]         = round(v.light        * 10.0f)  / 10.0f;
        doc["soil"]          = round(v.soilMoisture * 100.0f) / 100.0f;
        doc["soil_moisture"] = round(v.soilMoisture * 100.0f) / 100.0f;
        doc["motionX"]       = round(v.motionX      * 1000.0f) / 1000.0f;
        doc["motionY"]       = round(v.motionY      * 1000.0f) / 1000.0f;
        doc["motionZ"]       = round(v.motionZ      * 1000.0f) / 1000.0f;
        doc["proximity"]     = round(v.proximity    * 10.0f)  / 10.0f;
        doc["sound"]         = round(v.sound        * 10.0f)  / 10.0f;
        doc["uv"]            = round(v.uv           * 100.0f) / 100.0f;
        doc["co2"]           = round(v.co2          * 10.0f)  / 10.0f;

        JsonObject faultsObj = doc.createNestedObject("faults");
        const auto& cfg = gChannelManager.getConfig();
        for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
            ChannelFaultState f = gSensorState.getFault(i);
            const char* sKey = sensorTypeToString(cfg[i].sensor);
            JsonObject fItem = faultsObj.createNestedObject(sKey);
            fItem["type"]      = faultTypeToString(f.type);
            fItem["magnitude"] = f.magnitude;
            fItem["latencyMs"] = f.latencyMs;
        }

        String jsonStr;
        serializeJson(doc, jsonStr);
        _ws->textAll(jsonStr);
    }

    // ── Outbound: Broadcast Config State to ALL connected clients ─────────────
    void broadcastConfigState() {
        if (_ws->count() == 0) return;

        DynamicJsonDocument doc(4096);
        doc["type"] = "config_state";
        JsonArray channelsArr = doc.createNestedArray("channels");

        const auto& currentCfg = gChannelManager.getConfig();
        for (size_t i = 0; i < MAX_CHANNELS; i++) {
            JsonObject ch = channelsArr.createNestedObject();
            ch["sensor"]         = sensorTypeToString(currentCfg[i].sensor);
            ch["signal"]         = signalTypeToString(currentCfg[i].signal);
            ch["gpio"]           = currentCfg[i].gpio;
            ch["ledcChannel"]    = currentCfg[i].ledcChannel;
            ch["frequencyHz"]    = currentCfg[i].frequencyHz;
            ch["resolutionBits"] = currentCfg[i].resolutionBits;
            ch["inputMin"]       = currentCfg[i].inputMin;
            ch["inputMax"]       = currentCfg[i].inputMax;
            ch["defaultValue"]   = currentCfg[i].defaultValue;
            ch["calOffset"]      = currentCfg[i].calOffset;
            ch["calScale"]       = currentCfg[i].calScale;
        }

        String jsonStr;
        serializeJson(doc, jsonStr);
        _ws->textAll(jsonStr);
    }

    // ── Outbound: Send Config State to specific client ────────────────────────
    void sendConfigState(AsyncWebSocketClient* client) {
        DynamicJsonDocument doc(4096);
        doc["type"] = "config_state";
        JsonArray channelsArr = doc.createNestedArray("channels");

        const auto& currentCfg = gChannelManager.getConfig();
        for (size_t i = 0; i < MAX_CHANNELS; i++) {
            JsonObject ch = channelsArr.createNestedObject();
            ch["sensor"]         = sensorTypeToString(currentCfg[i].sensor);
            ch["signal"]         = signalTypeToString(currentCfg[i].signal);
            ch["gpio"]           = currentCfg[i].gpio;
            ch["ledcChannel"]    = currentCfg[i].ledcChannel;
            ch["frequencyHz"]    = currentCfg[i].frequencyHz;
            ch["resolutionBits"] = currentCfg[i].resolutionBits;
            ch["inputMin"]       = currentCfg[i].inputMin;
            ch["inputMax"]       = currentCfg[i].inputMax;
            ch["defaultValue"]   = currentCfg[i].defaultValue;
            ch["calOffset"]      = currentCfg[i].calOffset;
            ch["calScale"]       = currentCfg[i].calScale;
        }

        String jsonStr;
        serializeJson(doc, jsonStr);
        client->text(jsonStr);
    }

    void onConnect(AsyncWebSocketClient* client) {
        Serial.printf("[WS] Client #%u connected from %s\n",
                      client->id(), client->remoteIP().toString().c_str());
        broadcastState();
        sendConfigState(client);
    }

    void onDisconnect(AsyncWebSocketClient* client) {
        Serial.printf("[WS] Client #%u disconnected\n", client->id());
    }

private:
    AsyncWebSocket* _ws;

    void _sendError(AsyncWebSocketClient* client, const char* msg) {
        DynamicJsonDocument doc(128);
        doc["type"]  = "error";
        doc["error"] = msg;
        char buf[128];
        size_t n = serializeJson(doc, buf, sizeof(buf));
        client->text(buf, n);
    }

    void _sendConfigError(AsyncWebSocketClient* client, const String& reason) {
        DynamicJsonDocument doc(256);
        doc["type"]   = "config_error";
        doc["reason"] = reason;
        String jsonStr;
        serializeJson(doc, jsonStr);
        client->text(jsonStr);
    }
};
