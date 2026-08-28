# OneSensor — Design Decisions Log

Any deviation from the defaults specified in prompt.md is documented here.

| # | Decision | Default in Prompt | Actual Choice | Reason |
|---|---|---|---|---|
| 1 | WebSocket library | ESPAsyncWebServer (preferred) or Links2004/WebSockets | ESPAsyncWebServer + AsyncTCP | Non-blocking, event-driven; better concurrency with PWM update loop |
| 2 | JSON library | ArduinoJson v6+ | ArduinoJson v6 (^6.21.3) | Only supported option; v7 API differs, v6 is stable |
| 3 | PWM frequency | 500 Hz | 500 Hz | Matches prompt default; safe for pulseIn() at all duty cycles |
| 4 | pulseIn timeout | 25 ms (example in prompt) | 25 ms | Adopted as-is; 12.5× headroom over a 2 ms period at 500 Hz |
| 5 | Wi-Fi credentials | secrets.h (gitignored) OR NVS | secrets.h + .gitignore | Simplest approach for prototype; NVS noted as upgrade path |
| 6 | SensorState protection | FreeRTOS mutex or critical section | portMUX_TYPE critical section | Shortest possible lock time; avoids FreeRTOS mutex overhead for a simple struct copy |

_Add new rows here if any future phase deviates from documented defaults._
