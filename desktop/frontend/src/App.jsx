import React, { useState, useEffect, useRef } from 'react';
import TopBar from './components/TopBar';
import Sidebar, { WORKFLOW_NAV } from './components/Sidebar';
import StatusBar from './components/StatusBar';
import OverviewPage from './components/OverviewPage';
import LiveControl from './components/LiveControl';
import HardwarePage from './components/HardwarePage';
import ConfigEditor from './components/ConfigEditor';
import ScenarioBuilder from './components/ScenarioBuilder';
import FaultInjection from './components/FaultInjection';
import FlashPanel from './components/FlashPanel';
import SetupWizard from './components/SetupWizard';
import ConsoleLog from './components/ConsoleLog';
import DemoModeOverlay, { DEMO_STEPS } from './components/DemoModeOverlay';
import CommandPalette from './components/CommandPalette';
import LandingPage from './components/LandingPage';
import OneSensorLogo from './components/OneSensorLogo';

const API_BASE = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function App() {
  // Application State Separation: 'landing' (State A) | 'workbench' (State B)
  const [currentView, setCurrentView] = useState(() => {
    return window.location.hash.includes('workbench') ? 'workbench' : 'landing';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [sensorState, setSensorState] = useState({
    temperature: 24.8, humidity: 52.0, gas: 280, light: 620, soil: 42,
    motionX: 0.05, motionY: -0.12, motionZ: 0.98,
    proximity: 24, sound: 58, uv: 4.2, co2: 510,
    faults: {}
  });

  const [configState, setConfigState] = useState({ channels: [] });
  const [configError, setConfigError] = useState(null);
  const [ports, setPorts] = useState([]);
  const [toolchainStatus, setToolchainStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const wsRef = useRef(null);

  // State A -> State B Transition with visual bridge (Â§1)
  const handleEnterWorkbench = (targetTab = 'overview') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (targetTab) setActiveTab(targetTab);
    window.history.pushState({ view: 'workbench', tab: targetTab }, '', '#workbench');

    setTimeout(() => {
      setCurrentView('workbench');
      setIsTransitioning(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 380);
  };

  // State B -> State A Return to Landing
  const handleBackToLanding = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    window.history.pushState({ view: 'landing' }, '', window.location.pathname);

    setTimeout(() => {
      setCurrentView('landing');
      setIsTransitioning(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 350);
  };

  // Browser Back/Forward navigation support
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.view === 'workbench') {
        setCurrentView('workbench');
        if (e.state.tab) setActiveTab(e.state.tab);
      } else if (window.location.hash.includes('workbench')) {
        setCurrentView('workbench');
      } else {
        setCurrentView('landing');
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addLog = (message, type = 'info', source = 'system') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-300), { timestamp, message, type, source }]);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for Command Palette (Â§42)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleRunDemo = () => {
    setDemoStepIndex(0);
    setIsDemoActive(true);
  };

  // Find active label for breadcrumb
  let activeTabLabel = activeTab;
  for (const sec of WORKFLOW_NAV) {
    const item = sec.items.find(i => i.id === activeTab);
    if (item) {
      activeTabLabel = item.label;
      break;
    }
  }

  return (
    <div className={`app-shell ${isTransitioning ? 'transitioning' : ''}`}>
      {/* â”€â”€ Transition Visual Bridge Overlay (Â§1) â”€â”€ */}
      {isTransitioning && (
        <div className="view-transition-overlay" aria-hidden="true">
          <div className="transition-spinner-box">
            <OneSensorLogo height={32} variant="mark" />
            <div className="transition-loading-bar">
              <div className="transition-loading-fill" />
            </div>
            <span className="transition-loading-label">INITIALIZING WORKBENCH ENVIRONMENT...</span>
          </div>
        </div>
      )}

      {/* â”€â”€ STATE A: OneSensor Landing Page (Â§1) â”€â”€ */}
      {currentView === 'landing' && (
        <LandingPage
          sensorState={sensorState}
          isConnected={isConnected}
          onEnterWorkbench={handleEnterWorkbench}
          isTransitioning={isTransitioning}
        />
      )}

      {/* â”€â”€ STATE B: OneSensor Virtual Workbench (Â§1, Â§8, Â§9) â”€â”€ */}
      {currentView === 'workbench' && (
        <div className="workbench-shell animate-fade-in">
          {/* Top Bar with Return to Landing control */}
          <TopBar
            activeTab={activeTab}
            activeTabLabel={activeTabLabel}
            isConnected={isConnected}
            onRunDemo={handleRunDemo}
            isDemoActive={isDemoActive}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onBackToLanding={handleBackToLanding}
          />

          <div className={`app-body-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
            />

            <main className="workstation-content">
              {activeTab === 'overview' && (
                <OverviewPage
                  sensorState={sensorState}
                  isConnected={isConnected}
                  onSelectTab={setActiveTab}
                  onRunDemo={handleRunDemo}
                  onSetValue={handleSetValue}
                  onInjectFault={handleInjectFault}
                />
              )}
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
              {activeTab === 'hardware_3d' && (
                <HardwarePage
                  sensorState={sensorState}
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

          <StatusBar
            isConnected={isConnected}
            sensorCount={12}
          />
        </div>
      )}

      {/* â”€â”€ Judge Demo Mode Controller (Â§11) â”€â”€ */}
      {isDemoActive && (
        <DemoModeOverlay
          currentStepIndex={demoStepIndex}
          onNextStep={() => setDemoStepIndex(prev => Math.min(prev + 1, DEMO_STEPS.length - 1))}
          onPrevStep={() => setDemoStepIndex(prev => Math.max(prev - 1, 0))}
          onExitDemo={() => setIsDemoActive(false)}
          onSelectTab={setActiveTab}
          onSetValue={handleSetValue}
          onInjectFault={handleInjectFault}
          onClearFault={handleClearFault}
        />
      )}

      {/* â”€â”€ Global Command Palette (Â§42) â”€â”€ */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          if (currentView !== 'workbench') {
            handleEnterWorkbench(tab);
          } else {
            setActiveTab(tab);
          }
        }}
        onRunDemo={handleRunDemo}
      />
    </div>
  );
}
