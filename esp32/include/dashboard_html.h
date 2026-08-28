/**
 * dashboard_html.h — OneSensor Browser Dashboard (Phase 9)
 *
 * Served from ESP32 flash at GET /
 * WebSocket connects to ws://<esp32-ip>/ws automatically.
 *
 * Features:
 *  - 5 sensor cards with individual colour themes
 *  - Sliders send {"type":"set","sensor":"...","value":X} via WebSocket
 *  - onmessage updates all 5 readouts instantly (no refresh)
 *  - Reconnects automatically every 3 s on disconnect
 *  - Responsive: 2-column grid on desktop, 1-column on mobile
 */
#pragma once

static const char DASHBOARD_HTML[] PROGMEM = R"rawhtml(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OneSensor Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#0a0f1e;color:#e2e8f0;min-height:100vh;padding:20px}

  /* ── Header ─────────────────────────────────────────────── */
  header{display:flex;align-items:center;justify-content:space-between;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:16px;padding:14px 24px;margin-bottom:24px;backdrop-filter:blur(12px)}
  .logo{display:flex;align-items:center;gap:12px}
  .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
    border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
  .logo-text h1{font-size:16px;font-weight:700;color:#fff}
  .logo-text p{font-size:11px;color:#94a3b8}
  .status{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}
  .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;
    box-shadow:0 0 8px #22c55e;transition:background .3s,box-shadow .3s}
  .dot.disconnected{background:#ef4444;box-shadow:0 0 8px #ef4444}
  .dot.connecting{background:#f59e0b;box-shadow:0 0 8px #f59e0b;animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  #ip-display{font-size:12px;color:#64748b}

  /* ── Grid ───────────────────────────────────────────────── */
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
  @media(max-width:600px){.grid{grid-template-columns:1fr}}

  /* ── Sensor Card ─────────────────────────────────────────── */
  .card{border-radius:20px;padding:24px;position:relative;overflow:hidden;
    border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(16px);
    transition:transform .2s,box-shadow .2s}
  .card:hover{transform:translateY(-2px);box-shadow:0 20px 40px rgba(0,0,0,.4)}
  .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .card-title{font-size:14px;font-weight:600;color:rgba(255,255,255,.7)}
  .card-icon{font-size:22px;opacity:.8}
  .card-value{font-size:42px;font-weight:700;color:#fff;margin-bottom:4px;letter-spacing:-1px}
  .card-unit{font-size:18px;font-weight:400;color:rgba(255,255,255,.5)}
  .progress-bar{height:3px;border-radius:2px;margin:16px 0 12px;opacity:.4}
  .progress-fill{height:100%;border-radius:2px;transition:width .4s ease}

  /* ── Slider ─────────────────────────────────────────────── */
  input[type=range]{width:100%;-webkit-appearance:none;height:6px;border-radius:3px;
    background:rgba(255,255,255,.1);outline:none;cursor:pointer}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;
    border-radius:50%;border:2px solid rgba(255,255,255,.3);cursor:pointer;
    box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .15s}
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2)}

  /* ── Per-sensor themes ──────────────────────────────────── */
  .temp  {background:linear-gradient(135deg,rgba(239,68,68,.15),rgba(234,179,8,.08))}
  .humid {background:linear-gradient(135deg,rgba(59,130,246,.15),rgba(6,182,212,.08))}
  .gas   {background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(168,85,247,.08))}
  .light {background:linear-gradient(135deg,rgba(234,179,8,.15),rgba(251,191,36,.08))}
  .soil  {background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(16,185,129,.08))}

  .temp  input[type=range]::-webkit-slider-thumb{background:linear-gradient(135deg,#ef4444,#f97316)}
  .humid input[type=range]::-webkit-slider-thumb{background:linear-gradient(135deg,#3b82f6,#06b6d4)}
  .gas   input[type=range]::-webkit-slider-thumb{background:linear-gradient(135deg,#8b5cf6,#a855f7)}
  .light input[type=range]::-webkit-slider-thumb{background:linear-gradient(135deg,#eab308,#fbbf24)}
  .soil  input[type=range]::-webkit-slider-thumb{background:linear-gradient(135deg,#22c55e,#10b981)}

  .temp  .progress-fill{background:linear-gradient(90deg,#ef4444,#f97316)}
  .humid .progress-fill{background:linear-gradient(90deg,#3b82f6,#06b6d4)}
  .gas   .progress-fill{background:linear-gradient(90deg,#8b5cf6,#a855f7)}
  .light .progress-fill{background:linear-gradient(90deg,#eab308,#fbbf24)}
  .soil  .progress-fill{background:linear-gradient(90deg,#22c55e,#10b981)}

  .temp  input[type=range]{background:linear-gradient(90deg,rgba(239,68,68,.3),rgba(249,115,22,.1))}
  .humid input[type=range]{background:linear-gradient(90deg,rgba(59,130,246,.3),rgba(6,182,212,.1))}
  .gas   input[type=range]{background:linear-gradient(90deg,rgba(139,92,246,.3),rgba(168,85,247,.1))}
  .light input[type=range]{background:linear-gradient(90deg,rgba(234,179,8,.3),rgba(251,191,36,.1))}
  .soil  input[type=range]{background:linear-gradient(90deg,rgba(34,197,94,.3),rgba(16,185,129,.1))}

  /* ── Toast ──────────────────────────────────────────────── */
  #toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:12px;
    font-size:13px;font-weight:600;opacity:0;transform:translateY(20px);
    transition:all .3s;pointer-events:none;backdrop-filter:blur(8px)}
  #toast.show{opacity:1;transform:translateY(0)}
</style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-icon">🌿</div>
    <div class="logo-text"><h1>OneSensor</h1><p>Real-time IoT Dashboard</p></div>
  </div>
  <div class="status">
    <div class="dot connecting" id="dot"></div>
    <span id="ws-status">Connecting...</span>
  </div>
  <div id="ip-display">ESP32: loading...</div>
</header>

<div class="grid">

  <!-- Temperature -->
  <div class="card temp">
    <div class="card-header">
      <span class="card-title">🌡️ Temperature</span>
      <span class="card-icon">🔴</span>
    </div>
    <div><span class="card-value" id="v-temp">--</span><span class="card-unit"> °C</span></div>
    <div class="progress-bar"><div class="progress-fill" id="p-temp" style="width:50%"></div></div>
    <input type="range" id="s-temp" min="0" max="50" step="0.5" value="25"
      oninput="sendSet('temperature',+this.value)">
  </div>

  <!-- Humidity -->
  <div class="card humid">
    <div class="card-header">
      <span class="card-title">💧 Humidity</span>
      <span class="card-icon">🔵</span>
    </div>
    <div><span class="card-value" id="v-humid">--</span><span class="card-unit"> %</span></div>
    <div class="progress-bar"><div class="progress-fill" id="p-humid" style="width:50%"></div></div>
    <input type="range" id="s-humid" min="0" max="100" step="1" value="50"
      oninput="sendSet('humidity',+this.value)">
  </div>

  <!-- Gas -->
  <div class="card gas">
    <div class="card-header">
      <span class="card-title">☁️ Gas</span>
      <span class="card-icon">🟣</span>
    </div>
    <div><span class="card-value" id="v-gas">--</span><span class="card-unit"> ppm</span></div>
    <div class="progress-bar"><div class="progress-fill" id="p-gas" style="width:50%"></div></div>
    <input type="range" id="s-gas" min="0" max="1000" step="5" value="500"
      oninput="sendSet('gas',+this.value)">
  </div>

  <!-- Light -->
  <div class="card light">
    <div class="card-header">
      <span class="card-title">☀️ Light</span>
      <span class="card-icon">🟡</span>
    </div>
    <div><span class="card-value" id="v-light">--</span><span class="card-unit"> lux</span></div>
    <div class="progress-bar"><div class="progress-fill" id="p-light" style="width:50%"></div></div>
    <input type="range" id="s-light" min="0" max="1000" step="5" value="500"
      oninput="sendSet('light',+this.value)">
  </div>

  <!-- Soil Moisture -->
  <div class="card soil">
    <div class="card-header">
      <span class="card-title">🌱 Soil Moisture</span>
      <span class="card-icon">🟢</span>
    </div>
    <div><span class="card-value" id="v-soil">--</span><span class="card-unit"> %</span></div>
    <div class="progress-bar"><div class="progress-fill" id="p-soil" style="width:50%"></div></div>
    <input type="range" id="s-soil" min="0" max="100" step="0.5" value="50"
      oninput="sendSet('soil_moisture',+this.value)">
  </div>

</div>

<div id="toast"></div>

<script>
const WS_URL = `ws://${location.hostname}/ws`;
let ws, reconnectTimer;

// ── Sensor config ─────────────────────────────────────────────────────────────
const SENSORS = [
  {key:'temperature', valId:'v-temp',  progId:'p-temp',  sliderId:'s-temp',  max:50,   dec:1},
  {key:'humidity',    valId:'v-humid', progId:'p-humid', sliderId:'s-humid', max:100,  dec:1},
  {key:'gas',         valId:'v-gas',   progId:'p-gas',   sliderId:'s-gas',   max:1000, dec:0},
  {key:'light',       valId:'v-light', progId:'p-light', sliderId:'s-light', max:1000, dec:0},
  {key:'soil',        valId:'v-soil',  progId:'p-soil',  sliderId:'s-soil',  max:100,  dec:1},
];

// ── Connect / reconnect ───────────────────────────────────────────────────────
function connect() {
  setStatus('connecting');
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    setStatus('connected');
    document.getElementById('ip-display').textContent = `ESP32: ${location.hostname}`;
    clearTimeout(reconnectTimer);
  };

  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.type !== 'state') return;
    SENSORS.forEach(s => {
      const val = d[s.key];
      if (val === undefined || val === null) return;
      const pct = (val / s.max) * 100;
      document.getElementById(s.valId).textContent  = Number(val).toFixed(s.dec);
      document.getElementById(s.progId).style.width = Math.min(100, pct) + '%';
      // Only move slider if user isn't dragging
      const sl = document.getElementById(s.sliderId);
      if (document.activeElement !== sl) sl.value = val;
    });
  };

  ws.onclose = () => {
    setStatus('disconnected');
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = () => ws.close();
}

// ── Send a set command ────────────────────────────────────────────────────────
function sendSet(sensor, value) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({type:'set', sensor, value}));
    toast(`${sensor}: ${value}`);
  }
}

// ── Status indicator ──────────────────────────────────────────────────────────
function setStatus(state) {
  const dot = document.getElementById('dot');
  const lbl = document.getElementById('ws-status');
  dot.className = 'dot ' + state;
  lbl.textContent = state === 'connected' ? 'Connected'
                  : state === 'connecting' ? 'Connecting...' : 'Disconnected';
}

// ── Toast notification ────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.background = 'rgba(99,102,241,.9)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1500);
}

connect();
</script>
</body>
</html>)rawhtml";
