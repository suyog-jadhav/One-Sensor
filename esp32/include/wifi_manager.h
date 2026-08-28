/**
 * wifi_manager.h — Non-blocking Wi-Fi connection manager for ESP32
 *
 * Design rules:
 *  - Never calls delay() — uses millis() state machine
 *  - PWM channels continue updating during and after Wi-Fi connect
 *  - Retries indefinitely with exponential back-off (max 30 s)
 *  - Prints IP address to Serial when connected
 *  - Re-connects automatically on drop (Phase 8+ needs stable connection)
 */
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include "secrets.h"

class WifiManager {
public:
    enum class State { IDLE, CONNECTING, CONNECTED, RETRYING };

    void begin() {
        Serial.println(F("[WiFi] Starting connection..."));
        Serial.printf("[WiFi] SSID: %s\n", WIFI_SSID);
        WiFi.mode(WIFI_STA);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        _state     = State::CONNECTING;
        _startMs   = millis();
        _retryMs   = millis();
        _backoffMs = INITIAL_BACKOFF_MS;
    }

    // Call every loop() — non-blocking state machine
    void update() {
        switch (_state) {
            case State::CONNECTING:
                if (WiFi.status() == WL_CONNECTED) {
                    _state = State::CONNECTED;
                    Serial.println(F("\n[WiFi] ✅ Connected!"));
                    Serial.print(F("[WiFi] IP address: "));
                    Serial.println(WiFi.localIP());
                    Serial.printf("[WiFi] Signal (RSSI): %d dBm\n", WiFi.RSSI());
                } else if (millis() - _startMs >= CONNECT_TIMEOUT_MS) {
                    Serial.printf("\n[WiFi] ❌ Timeout after %lu ms. Retrying in %lu ms...\n",
                                  CONNECT_TIMEOUT_MS, _backoffMs);
                    _state   = State::RETRYING;
                    _retryMs = millis();
                } else {
                    // Dot progress indicator (non-blocking)
                    if (millis() - _dotMs >= 500) {
                        _dotMs = millis();
                        Serial.print('.');
                    }
                }
                break;

            case State::CONNECTED:
                // Monitor for drops
                if (WiFi.status() != WL_CONNECTED) {
                    Serial.println(F("[WiFi] ⚠️  Connection lost. Reconnecting..."));
                    _backoffMs = INITIAL_BACKOFF_MS;  // reset back-off on drop
                    WiFi.reconnect();
                    _state   = State::CONNECTING;
                    _startMs = millis();
                }
                break;

            case State::RETRYING:
                if (millis() - _retryMs >= _backoffMs) {
                    Serial.printf("[WiFi] Retrying (back-off was %lu ms)...\n", _backoffMs);
                    _backoffMs = min(_backoffMs * 2, MAX_BACKOFF_MS);  // exponential back-off
                    WiFi.disconnect();
                    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
                    _state   = State::CONNECTING;
                    _startMs = millis();
                }
                break;

            case State::IDLE:
            default:
                break;
        }
    }

    bool isConnected() const { return WiFi.status() == WL_CONNECTED; }
    IPAddress localIP()const { return WiFi.localIP(); }
    State     state()  const { return _state; }

private:
    static constexpr uint32_t CONNECT_TIMEOUT_MS  = 15000;  // 15 s per attempt
    static constexpr uint32_t INITIAL_BACKOFF_MS  =  2000;  //  2 s first retry
    static constexpr uint32_t MAX_BACKOFF_MS      = 30000;  // 30 s max back-off

    State    _state     = State::IDLE;
    uint32_t _startMs   = 0;
    uint32_t _retryMs   = 0;
    uint32_t _dotMs     = 0;
    uint32_t _backoffMs = INITIAL_BACKOFF_MS;
};

// Global singleton — one instance for the whole firmware
extern WifiManager gWifiManager;
