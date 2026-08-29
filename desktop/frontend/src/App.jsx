import React, { useState, useEffect, useRef } from 'react';
import LiveControl from './components/LiveControl';
import ConfigEditor from './components/ConfigEditor';
import ScenarioBuilder from './components/ScenarioBuilder';
import FlashPanel from './components/FlashPanel';
import SetupWizard from './components/SetupWizard';
import ConsoleLog from './components/ConsoleLog';

const API_BASE = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isConnected, setIsConnected] = useState(false);
  const [sensorState, setSensorState] = useState({ temperature: 25, humidity: 50, gas: 500, light: 500, soil: 50 });
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
    setSensorState(prev => ({
      ...prev,
      [key]: value,
      [sensor]: value
    }));
    sendWS({ type: 'set', sensor, value });
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
    <div>
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">🌿</div>
          <div className="brand-text">
            <h1>OneSensor Control Suite</h1>
            <p>Virtual Sensor Platform • Desktop Edition</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="nav-tabs">
          <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            Live Control
          </button>
          <button className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
            Config Editor
          </button>
          <button className={`tab-btn ${activeTab === 'scenario' ? 'active' : ''}`} onClick={() => setActiveTab('scenario')}>
            Scenario Builder
          </button>
          <button className={`tab-btn ${activeTab === 'flash' ? 'active' : ''}`} onClick={() => setActiveTab('flash')}>
            Flash Panel
          </button>
          <button className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`} onClick={() => setActiveTab('wizard')}>
            Setup Wizard
          </button>
          <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            Console & Serial
          </button>
        </nav>

        {/* Status Indicator */}
        <div className="status-badge">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Backend Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-container">
        {activeTab === 'live' && (
          <LiveControl
            state={sensorState}
            onSetValue={handleSetValue}
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
    </div>
  );

}
