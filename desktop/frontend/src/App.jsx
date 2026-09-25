import React, { useState, useEffect, useRef } from 'react';
import Badge from './components/Badge';
import LiveControl from './components/LiveControl';
import ConfigEditor from './components/ConfigEditor';
import ScenarioBuilder from './components/ScenarioBuilder';
import FlashPanel from './components/FlashPanel';
import SetupWizard from './components/SetupWizard';
import ConsoleLog from './components/ConsoleLog';
import FaultInjection from './components/FaultInjection';
import { Activity, Sliders, TrendingUp, Zap, HelpCircle, Terminal, Radio, ShieldOff } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws';

const TABS = [
  { id: 'live',         label: 'Live Control',    sub: 'Transducers', icon: Activity },
  { id: 'config',       label: 'Config Editor',   sub: 'Pin Matrix',  icon: Sliders },
  { id: 'scenario',     label: 'Scenario Builder',sub: 'Waveforms',   icon: TrendingUp },
  { id: 'fault_inject', label: 'Fault Injection', sub: 'Chaos Engine',icon: ShieldOff },
  { id: 'flash',        label: 'Flash Panel',     sub: 'Bootloader',  icon: Zap },
  { id: 'wizard',       label: 'Setup Wizard',    sub: 'Provisioning',icon: HelpCircle },
  { id: 'logs',         label: 'Console & Serial',sub: 'Telemetry',   icon: Terminal },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isConnected, setIsConnected] = useState(false);
  const [sensorState, setSensorState] = useState({
    temperature: 25, humidity: 50, gas: 300, light: 500, soil: 50,
    motionX: 0, motionY: 0, motionZ: 1,
    proximity: 50, sound: 40, uv: 2, co2: 420,
    faults: {}
  });
  const [configState, setConfigState] = useState({ channels: [] });
  const [configError, setConfigError] = useState(null);
  const [ports, setPorts] = useState([]);
  const [toolchainStatus, setToolchainStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const wsRef = useRef(null);

  const addLog = (message, type = 'info', source = 'system') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-300), { timestamp, message, type, source }]);
  };

  // Connect local WebSocket to Python sidecar
  useEffect(() => {
    let ws;
    let timer;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLog('Connected to desktop backend sidecar.', 'success');
        ws.send(JSON.stringify({ type: 'get_config' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'state') {
            setSensorState(data);
          } else if (data.type === 'config_state') {
            setConfigState(data);
            setConfigError(null);
            addLog('Received updated configuration state from device.', 'info');
          } else if (data.type === 'config_error') {
            setConfigError(data.reason);
            addLog(`Configuration rejected: ${data.reason}`, 'error');
          } else if (data.type === 'serial_log') {
            addLog(data.line, 'info', data.source || 'esp32_serial');
          }
        } catch (e) {
          console.error("WS error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        addLog('Disconnected from backend sidecar. Retrying...', 'error');
        timer = setTimeout(connect, 3000);
      };
    };

    connect();
    fetchPorts();
    fetchToolchain();

    return () => {
      if (ws) ws.close();
      clearTimeout(timer);
    };
  }, []);

  const fetchPorts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ports`);
      const data = await res.json();
      setPorts(data.ports || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchToolchain = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/toolchain`);
      const data = await res.json();
      setToolchainStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  // WebSocket Outbound helpers
  const sendWS = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      addLog(`Sent [${payload.type}]: ${JSON.stringify(payload)}`, 'info');
    } else {
      addLog('Failed to send: WebSocket disconnected', 'error');
    }
  };

  const handleSetValue = (sensor, value) => {
    const key = (sensor === 'soil_moisture' || sensor === 'soil') ? 'soil' : sensor;
    setSensorState(prev => ({ ...prev, [key]: value, [sensor]: value }));
    sendWS({ type: 'set', sensor, value });
  };

  const handleSetMotion = (x, y, z) => {
    setSensorState(prev => ({ ...prev, motionX: x, motionY: y, motionZ: z }));
    sendWS({ type: 'motion', x, y, z });
  };

  const handleInjectFault = (sensor, faultType, magnitude = 0, durationMs = 0, latencyMs = 0) => {
    sendWS({ type: 'fault', sensor, fault: faultType, magnitude, durationMs, latencyMs });
    addLog(`Fault injected [${faultType}] on ${sensor} (magnitude=${magnitude}, dur=${durationMs}ms)`, 'warning');
  };

  const handleClearFault = (sensor = 'all') => {
    sendWS({ type: 'fault_clear', sensor });
    addLog(`Fault cleared: ${sensor}`, 'info');
  };

  const handleConnectESP32 = async (ip) => {
    try {
      const res = await fetch(`${API_BASE}/api/connect_esp32`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Initiated WebSocket connection to ESP32 at ${ip}`, 'success');
      }
      return data;
    } catch (e) {
      addLog(`Error connecting to ESP32: ${e}`, 'error');
      return { success: false };
    }
  };

  const handleApplyConfig = (channels) => {
    sendWS({ type: 'set_config', channels });
  };

  const handleResetConfig = () => {
    sendWS({ type: 'reset_config' });
  };

  const handleStartRamp = (sensor, fromVal, toVal, duration) => {
    sendWS({ type: 'start_ramp', sensor, from: fromVal, to: toVal, duration });
  };

  const handleStartStatic = (sensor, value) => {
    sendWS({ type: 'start_static', sensor, value });
  };

  const handleStopScenario = (sensor) => {
    sendWS({ type: 'stop_scenario', sensor });
  };

  const handleStopAllScenarios = () => {
    sendWS({ type: 'stop_all_scenarios' });
  };

  // Serial Monitor REST helpers
  const handleStartSerialMonitor = async (port, baudrate, device = 'esp32') => {
    try {
      const res = await fetch(`${API_BASE}/api/serial/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, baudrate, device })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`Started ${device.toUpperCase()} Serial Monitor on ${port} @ ${baudrate} baud`, 'success');
      } else {
        const errStr = data.reason || data.detail || data.message || res.statusText || 'Unknown error';
        addLog(`Failed to start Serial Monitor: ${errStr}`, 'error');
      }
      return data;
    } catch (e) {
      addLog(`Error starting Serial Monitor: ${e.message || String(e)}`, 'error');
      return { success: false };
    }
  };

  const handleStopSerialMonitor = async (device = 'esp32') => {
    try {
      const res = await fetch(`${API_BASE}/api/serial/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device })
      });
      const data = await res.json();
      addLog(`Stopped ${device.toUpperCase()} Serial Monitor.`, 'info');
      return data;
    } catch (e) {
      return { success: false };
    }
  };

  // Flashing & Provisioning REST helpers
  const handleFlashESP32 = async (port) => {
    try {
      const res = await fetch(`${API_BASE}/api/flash/esp32`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      return await res.json();
    } catch (e) {
      return { success: false, reason: String(e) };
    }
  };

  const handleProvisionESP32 = async (port, ssid, password, deviceName) => {
    try {
      const res = await fetch(`${API_BASE}/api/provision/esp32`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, ssid, password, deviceName })
      });
      return await res.json();
    } catch (e) {
      return { success: false, reason: String(e) };
    }
  };

  const handleBuildFlashESP32 = async (port, ssid, password, deviceName) => {
    try {
      const res = await fetch(`${API_BASE}/api/build_flash_esp32`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, ssid, password, device_name: deviceName })
      });
      return await res.json();
    } catch (e) {
      return { success: false, reason: String(e) };
    }
  };

  const handleFlashArduino = async (port) => {
    try {
      const res = await fetch(`${API_BASE}/api/flash/arduino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      return await res.json();
    } catch (e) {
      return { success: false, reason: String(e) };
    }
  };

  const handleProvisionArduino = async (port, channels) => {
    try {
      const res = await fetch(`${API_BASE}/api/provision/arduino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, channels })
      });
      return await res.json();
    } catch (e) {
      return { success: false, reason: String(e) };
    }
  };

  const handleClearLogs = (targetSource = 'all') => {
    if (targetSource === 'all') {
      setLogs([]);
    } else if (targetSource === 'system') {
      setLogs(prev => prev.filter(l => l.source === 'esp32_serial' || l.source === 'arduino_serial'));
    } else {
      setLogs(prev => prev.filter(l => l.source !== targetSource));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* ── Top Header ── */}
      <header className="app-header">
        {/* Brand Block */}
        <div className="brand">
          <div className="brand-icon">
            <Radio size={20} color="#fff" />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1>OneSensor Control Suite</h1>
              <Badge variant="neutral" size="sm">v2.0.0</Badge>
            </div>
            <p>PRECISION MULTI-CHANNEL TRANSDUCER EMULATOR</p>
          </div>
        </div>

        {/* Tab Navigation (6 two-line pill buttons with sliding indicator) */}
        <nav className="nav-tabs">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </div>
                <span style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.6, fontFamily: 'var(--font-mono)' }}>
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Connection Status Badge (Dot + two-line telemetry with crossfade) */}
        <div
          className="status-badge"
          style={{
            background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
            <span style={{ color: isConnected ? '#34d399' : '#f87171', fontWeight: '700', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              {isConnected ? 'BACKEND LINKED' : 'SIDECAR OFFLINE'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {isConnected ? 'PORT 8000 WS OK' : 'RECONNECTING…'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Area (Crossfade tab content, pauses inactive tabs) ── */}
      <main className="main-container" style={{ flex: 1 }}>
        {activeTab === 'live' && (
          <LiveControl
            state={sensorState}
            onSetValue={handleSetValue}
            onSetMotion={handleSetMotion}
            onInjectFault={handleInjectFault}
            onClearFault={handleClearFault}
            onConnectESP32={handleConnectESP32}
          />
        )}
        {activeTab === 'config' && (
          <ConfigEditor
            configState={configState}
            configError={configError}
            onApplyConfig={handleApplyConfig}
            onResetConfig={handleResetConfig}
          />
        )}
        {activeTab === 'scenario' && (
          <ScenarioBuilder
            onStartRamp={handleStartRamp}
            onStartStatic={handleStartStatic}
            onStopScenario={handleStopScenario}
            onStopAll={handleStopAllScenarios}
            onInjectFault={handleInjectFault}
            onClearFault={handleClearFault}
          />
        )}
        {activeTab === 'fault_inject' && (
          <FaultInjection
            onInjectFault={handleInjectFault}
            onClearFault={handleClearFault}
          />
        )}
        {activeTab === 'flash' && (
          <FlashPanel
            ports={ports}
            toolchainStatus={toolchainStatus}
            onFlashESP32={handleFlashESP32}
            onFlashArduino={handleFlashArduino}
          />
        )}
        {activeTab === 'wizard' && (
          <SetupWizard
            ports={ports}
            onFlashESP32={handleFlashESP32}
            onProvisionESP32={handleProvisionESP32}
            onBuildFlashESP32={handleBuildFlashESP32}
            onFlashArduino={handleFlashArduino}
            onProvisionArduino={handleProvisionArduino}
            onFinishWizard={() => setActiveTab('live')}
          />
        )}
        {activeTab === 'logs' && (
          <ConsoleLog
            logs={logs}
            ports={ports}
            onStartSerialMonitor={handleStartSerialMonitor}
            onStopSerialMonitor={handleStopSerialMonitor}
            onClear={handleClearLogs}
          />
        )}
      </main>

      {/* ── Footer Diagnostics Bar ── */}
      <footer className="app-footer">
        <div className="footer-telemetry">
          <span>SESSION: <strong>0x4F1A</strong></span>
          <span>BAUD: <strong>115200 8N1</strong></span>
          <span>CORE: <strong>v2.0-SYNTH</strong></span>
        </div>
        <div>
          <span>ONESENSOR DESKTOP CONTROL SUITE • v2.0.0</span>
        </div>
      </footer>
    </div>
  );
}
