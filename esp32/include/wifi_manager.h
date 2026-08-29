/**
 * wifi_manager.h — Non-blocking Wi-Fi connection manager & serial provisioning for ESP32
 */
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include "secrets.h"

class WifiManager {
public:
    enum class State { IDLE, PROVISIONING, CONNECTING, CONNECTED, RETRYING };

    void begin();
    void update();

    bool isConnected() const { return WiFi.status() == WL_CONNECTED; }
    IPAddress localIP() const { return WiFi.localIP(); }
    String deviceName() const { return _deviceName; }
    State state() const { return _state; }

    void resetWifiCredentials();

private:
    static constexpr uint32_t CONNECT_TIMEOUT_MS  = 15000;
    static constexpr uint32_t INITIAL_BACKOFF_MS  =  2000;
    static constexpr uint32_t MAX_BACKOFF_MS      = 30000;

    State    _state     = State::IDLE;
    uint32_t _startMs   = 0;
    uint32_t _retryMs   = 0;
    uint32_t _dotMs     = 0;
    uint32_t _backoffMs = INITIAL_BACKOFF_MS;

    String _ssid;
    String _password;
    String _deviceName = "onesensor";
    bool   _hasCredentials = false;
    bool   _mdnsStarted = false;

    void _loadCredentialsFromNVS();
    void _saveCredentialsToNVS(const String& ssid, const String& password, const String& devName);
    void _checkSerialProvisioning();
    void _startMDNS();
};

extern WifiManager gWifiManager;
