/**
 * http_server.h — ESPAsyncWebServer setup for OneSensor
 *
 * Routes:
 *   GET  /        → serves inline HTML dashboard (Phase 9)
 *   GET  /ws      → upgrades to WebSocket
 *   GET  /state   → returns current sensor state as JSON (REST fallback)
 *
 * Design rules:
 *  - All handlers are registered once in begin() — never re-registered
 *  - WebSocket cleanup runs periodically via cleanupClients() in loop()
 *  - Server starts ONLY after Wi-Fi is connected
 */
#pragma once
#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "websocket_handler.h"
#include "sensor_state.h"

class HttpServer {
public:
    HttpServer() : _ws("/ws"), _wsHandler(&_ws), _server(80) {}

    void begin() {
        // ── WebSocket event handler ─────────────────────────────────────────
        _ws.onEvent([this](AsyncWebSocket* server,
                           AsyncWebSocketClient* client,
                           AwsEventType type,
                           void* arg, uint8_t* data, size_t len) {
            switch (type) {
                case WS_EVT_CONNECT:
                    _wsHandler.onConnect(client);
                    break;
                case WS_EVT_DISCONNECT:
                    _wsHandler.onDisconnect(client);
                    break;
                case WS_EVT_DATA: {
                    AwsFrameInfo* info = (AwsFrameInfo*)arg;
                    // Only handle complete, single-frame text messages
                    if (info->final && info->index == 0 &&
                        info->len == len && info->opcode == WS_TEXT) {
                        data[len] = 0;  // null-terminate
                        _wsHandler.onMessage(client, (char*)data, len);
                    }
                    break;
                }
                case WS_EVT_ERROR:
                    Serial.printf("[WS] Error #%u: %s\n", client->id(), (char*)data);
                    break;
                default: break;
            }
        });
        _server.addHandler(&_ws);

        // ── REST /state endpoint (useful for testing without dashboard) ──────
        _server.on("/state", HTTP_GET, [](AsyncWebServerRequest* req) {
            SensorValues v = gSensorState.get();
            StaticJsonDocument<256> doc;
            doc["temperature"] = v.temperature;
            doc["humidity"]    = v.humidity;
            doc["gas"]         = v.gas;
            doc["light"]       = v.light;
            doc["soil"]        = v.soilMoisture;
            char buf[256];
            serializeJson(doc, buf, sizeof(buf));
            req->send(200, "application/json", buf);
        });

        // ── Catch-all → Phase 9 will serve full dashboard HTML ────────────────
        _server.on("/", HTTP_GET, [](AsyncWebServerRequest* req) {
            req->send(200, "text/plain",
                "OneSensor WebSocket API ready.\n"
                "Connect via ws://<ip>/ws\n"
                "Send: {\"type\":\"set\",\"sensor\":\"temperature\",\"value\":30.5}\n"
                "Recv: {\"type\":\"state\",\"temperature\":30.5,...}\n");
        });

        _server.begin();
        Serial.println(F("[HTTP] Server started on port 80"));
        Serial.printf("[HTTP] WebSocket endpoint: ws://%s/ws\n",
                      WiFi.localIP().toString().c_str());
        Serial.printf("[HTTP] REST state: http://%s/state\n",
                      WiFi.localIP().toString().c_str());
    }

    // Call periodically from loop() — frees closed client slots
    void update() {
        _ws.cleanupClients();
    }

    // Broadcast current state to all connected clients
    void broadcastState() {
        _wsHandler.broadcastState();
    }

    uint8_t clientCount() const { return _ws.count(); }

private:
    AsyncWebSocket    _ws;
    WebSocketHandler  _wsHandler;
    AsyncWebServer    _server;
};

extern HttpServer gHttpServer;
