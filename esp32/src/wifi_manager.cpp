/**
 * wifi_manager.cpp — Non-blocking Wi-Fi connection manager & serial provisioning implementation
 */

#include "wifi_manager.h"

WifiManager gWifiManager;

static const char* NVS_WIFI_NAMESPACE = "onesensor_wifi";

void WifiManager::begin() {
    _loadCredentialsFromNVS();

    WiFi.mode(WIFI_STA);

    String secretSsid = String(WIFI_SSID);
    if (secretSsid.length() > 0 && secretSsid != "YOUR_WIFI_SSID") {
        _ssid = secretSsid;
        _password = String(WIFI_PASSWORD);
        _deviceName = "onesensor";
        _saveCredentialsToNVS(_ssid, _password, _deviceName);
        Serial.println(F("[WiFi] Connecting using credentials from secrets.h..."));
        Serial.printf("[WiFi] SSID: %s | Device Name: %s\n", _ssid.c_str(), _deviceName.c_str());
        WiFi.begin(_ssid.c_str(), _password.c_str());
        _state     = State::CONNECTING;
        _startMs   = millis();
        _retryMs   = millis();
        _backoffMs = INITIAL_BACKOFF_MS;
    } else if (_hasCredentials && _ssid.length() > 0) {
        Serial.println(F("[WiFi] Starting connection using stored NVS credentials..."));
        Serial.printf("[WiFi] SSID: %s | Device Name: %s\n", _ssid.c_str(), _deviceName.c_str());
        WiFi.begin(_ssid.c_str(), _password.c_str());
        _state     = State::CONNECTING;
        _startMs   = millis();
        _retryMs   = millis();
        _backoffMs = INITIAL_BACKOFF_MS;
    } else {
        _state = State::PROVISIONING;
        Serial.println(F("ONESENSOR_READY_FOR_PROVISIONING"));
    }
}


void WifiManager::update() {
    _checkSerialProvisioning();

    switch (_state) {
        case State::CONNECTING:
            if (WiFi.status() == WL_CONNECTED) {
                _state = State::CONNECTED;
                Serial.println(F("\n[WiFi] ✅ Connected!"));
                Serial.print(F("[WiFi] IP address: "));
                Serial.println(WiFi.localIP());
                Serial.printf("[WiFi] Signal (RSSI): %d dBm\n", WiFi.RSSI());

                _startMDNS();
            } else if (millis() - _startMs >= CONNECT_TIMEOUT_MS) {
                Serial.printf("\n[WiFi] ❌ Connection attempt timed out after %lu ms.\n", CONNECT_TIMEOUT_MS);
                if (_hasCredentials) {
                    Serial.printf("[WiFi] Retrying in %lu ms...\n", _backoffMs);
                    _state   = State::RETRYING;
                    _retryMs = millis();
                } else {
                    _state = State::PROVISIONING;
                    Serial.println(F("{\"status\":\"failed\",\"reason\":\"auth_timeout\"}"));
                    Serial.println(F("ONESENSOR_READY_FOR_PROVISIONING"));
                }
            } else {
                if (millis() - _dotMs >= 500) {
                    _dotMs = millis();
                    Serial.print('.');
                }
            }
            break;

        case State::CONNECTED:
            if (WiFi.status() != WL_CONNECTED) {
                Serial.println(F("[WiFi] ⚠️ Connection lost. Reconnecting..."));
                _backoffMs = INITIAL_BACKOFF_MS;
                WiFi.reconnect();
                _state   = State::CONNECTING;
                _startMs = millis();
            }
            break;

        case State::RETRYING:
            if (millis() - _retryMs >= _backoffMs) {
                Serial.printf("[WiFi] Retrying connection (back-off: %lu ms)...\n", _backoffMs);
                _backoffMs = min(_backoffMs * 2, MAX_BACKOFF_MS);
                WiFi.disconnect();
                WiFi.begin(_ssid.c_str(), _password.c_str());
                _state   = State::CONNECTING;
                _startMs = millis();
            }
            break;

        case State::PROVISIONING:
        case State::IDLE:
        default:
            break;
    }
}

void WifiManager::resetWifiCredentials() {
    Preferences prefs;
    if (prefs.begin(NVS_WIFI_NAMESPACE, false)) {
        prefs.clear();
        prefs.end();
    }
    _hasCredentials = false;
    _ssid = "";
    _password = "";
    WiFi.disconnect(true);
    _state = State::PROVISIONING;
    Serial.println(F("[WiFi] Credentials reset. Ready for provisioning."));
    Serial.println(F("ONESENSOR_READY_FOR_PROVISIONING"));
}

void WifiManager::_loadCredentialsFromNVS() {
    Preferences prefs;
    if (!prefs.begin(NVS_WIFI_NAMESPACE, true)) {
        _hasCredentials = false;
        return;
    }

    _hasCredentials = prefs.getBool("configured", false);
    if (_hasCredentials) {
        _ssid       = prefs.getString("ssid", "");
        _password   = prefs.getString("password", "");
        _deviceName = prefs.getString("devName", "onesensor");
    }
    prefs.end();
}

void WifiManager::_saveCredentialsToNVS(const String& ssid, const String& password, const String& devName) {
    Preferences prefs;
    if (prefs.begin(NVS_WIFI_NAMESPACE, false)) {
        prefs.putString("ssid", ssid);
        prefs.putString("password", password);
        prefs.putString("devName", devName);
        prefs.putBool("configured", true);
        prefs.end();
        _hasCredentials = true;
        _ssid = ssid;
        _password = password;
        _deviceName = devName;
        Serial.println(F("[WiFi] Saved new Wi-Fi credentials to NVS."));
    }
}

void WifiManager::_checkSerialProvisioning() {
    if (!Serial.available()) return;

    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) return;

    if (line.indexOf("reset_wifi") != -1) {
        resetWifiCredentials();
        return;
    }

    if (line.startsWith("{") && line.indexOf("ssid") != -1) {
        DynamicJsonDocument doc(512);
        DeserializationError err = deserializeJson(doc, line);
        if (err) {
            Serial.println(F("{\"status\":\"failed\",\"reason\":\"invalid_json\"}"));
            return;
        }

        const char* s = doc["ssid"] | "";
        const char* p = doc["password"] | "";
        const char* d = doc["deviceName"] | "onesensor";

        if (strlen(s) == 0) {
            Serial.println(F("{\"status\":\"failed\",\"reason\":\"missing_ssid\"}"));
            return;
        }

        _ssid = String(s);
        _password = String(p);
        _deviceName = String(d);

        Serial.println(F("{\"status\":\"connecting\"}"));
        WiFi.disconnect();
        WiFi.begin(_ssid.c_str(), _password.c_str());
        _state = State::CONNECTING;
        _startMs = millis();

        uint32_t provStart = millis();
        while (millis() - provStart < 20000) {
            if (WiFi.status() == WL_CONNECTED) {
                _saveCredentialsToNVS(_ssid, _password, _deviceName);
                _state = State::CONNECTED;
                _startMDNS();
                String mdnsStr = _deviceName + ".local";
                Serial.printf("{\"status\":\"connected\",\"ip\":\"%s\",\"mdns\":\"%s\"}\n",
                              WiFi.localIP().toString().c_str(), mdnsStr.c_str());
                return;
            }
            delay(100);
        }


        Serial.println(F("{\"status\":\"failed\",\"reason\":\"auth_timeout\"}"));
        _state = State::PROVISIONING;
    }
}

void WifiManager::_startMDNS() {
    if (_mdnsStarted) return;
    if (MDNS.begin(_deviceName.c_str())) {
        MDNS.addService("http", "tcp", 80);
        MDNS.addService("ws", "tcp", 80);
        _mdnsStarted = true;
        Serial.printf("[mDNS] Started responder for http://%s.local\n", _deviceName.c_str());
    } else {
        Serial.println(F("[mDNS] Failed to start responder."));
    }
}
