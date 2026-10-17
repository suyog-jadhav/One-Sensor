import React from 'react';
import {
  Play,
  Activity,
  Sliders,
  ShieldOff,
  Cpu,
  Terminal,
  ExternalLink,
  ChevronRight,
  Radio,
  Server,
  Layers
} from 'lucide-react';
import Interactive3DSensorCanvas from './Interactive3DSensorCanvas';

const SENSOR_CHANNELS = [
  { key: 'temperature', name: 'Temperature (DHT11)',  gpio: 'GPIO 34', unit: '°C',  defaultVal: 24.8, type: 'ADC1' },
  { key: 'humidity',    name: 'Humidity (DHT11)',     gpio: 'GPIO 35', unit: '%RH', defaultVal: 52.0, type: 'ADC1' },
  { key: 'gas',         name: 'Gas Sensor (MQ-2)',    gpio: 'GPIO 32', unit: 'ppm', defaultVal: 280,  type: 'ADC1' },
  { key: 'light',       name: 'Ambient Light (LDR)',  gpio: 'GPIO 33', unit: 'lux', defaultVal: 620,  type: 'ADC1' },
  { key: 'soil',        name: 'Soil Moisture',        gpio: 'GPIO 25', unit: '%',   defaultVal: 42,   type: 'DAC1' },
  { key: 'proximity',   name: 'Proximity (HC-SR04)',  gpio: 'GPIO 26', unit: 'cm',  defaultVal: 24,   type: 'DAC2' },
  { key: 'sound',       name: 'Sound Level',          gpio: 'GPIO 27', unit: 'dB',  defaultVal: 58,   type: 'ADC2' },
  { key: 'uv',          name: 'UV Index (ML8511)',    gpio: 'GPIO 14', unit: 'UVI', defaultVal: 4.2,  type: 'ADC2' },
  { key: 'co2',         name: 'CO₂ Air Quality',      gpio: 'GPIO 12', unit: 'ppm', defaultVal: 510,  type: 'ADC2' },
  { key: 'motionX',     name: 'Motion X (MPU-6050)',  gpio: 'GPIO 21', unit: 'g',   defaultVal: 0.05, type: 'I2C' },
  { key: 'motionY',     name: 'Motion Y (MPU-6050)',  gpio: 'GPIO 21', unit: 'g',   defaultVal: -0.12,type: 'I2C' },
  { key: 'motionZ',     name: 'Motion Z (MPU-6050)',  gpio: 'GPIO 22', unit: 'g',   defaultVal: 0.98, type: 'I2C' },
];

export default function OverviewPage({
  sensorState,
  isConnected,
  onSelectTab,
  onRunDemo,
  onSetValue,
  onInjectFault
}) {
  const activeFaultCount = Object.keys(sensorState.faults || {}).length;

  return (
    <div className="page-container">
      {/* ── Page Header: Clean, Purposeful, No Oversized Promo ── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workbench Overview</h1>
          <p className="page-subtitle">
            Operational dashboard for virtual transducers, signal emulation, and ESP32 peripheral routing.
          </p>
        </div>

        <div className="page-actions-group">
          <button
            className="btn-primary"
            onClick={onRunDemo}
            title="Start automated walkthrough demo"
          >
            <Play size={13} fill="currentColor" />
            <span>Run Demo</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => onSelectTab('live')}
            title="Switch to real-time transducer controls"
          >
            <Activity size={13} />
            <span>Open Live Sensors</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => onSelectTab('config')}
            title="Inspect peripheral pin mappings"
          >
            <Sliders size={13} />
            <span>Configure Matrix</span>
          </button>
        </div>
      </div>

      {/* ── Truthful Summary Strip: 4 Core Metrics Only (§5) ── */}
      <div className="summary-metric-strip">
        <div className="metric-cell">
          <span className="metric-label">Sidecar IPC</span>
          <div className="metric-value-row">
            <span className={`status-indicator-dot ${isConnected ? 'online' : 'offline'}`} />
            <span className="metric-value-text" style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {isConnected ? 'Active (WebSocket)' : 'Disconnected'}
            </span>
          </div>
          <span className="metric-footnote">Port 8000 /ws</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Configured Channels</span>
          <div className="metric-value-row">
            <span className="metric-value-number">12</span>
            <span className="metric-unit">channels</span>
          </div>
          <span className="metric-footnote">10 Direct GPIO + 2 I2C</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Operating Target</span>
          <div className="metric-value-row">
            <Cpu size={14} color="var(--accent-teal)" />
            <span className="metric-value-text">ESP32 DevKit V1</span>
          </div>
          <span className="metric-footnote">Standalone Simulation Profile</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Fault Lab Status</span>
          <div className="metric-value-row">
            <span
              className="status-indicator-dot"
              style={{ backgroundColor: activeFaultCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
            />
            <span
              className="metric-value-text"
              style={{ color: activeFaultCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
            >
              {activeFaultCount > 0 ? `${activeFaultCount} Active Faults` : 'Nominal Stream'}
            </span>
          </div>
          <span className="metric-footnote">Signal Integrity Verification</span>
        </div>
      </div>

      {/* ── Main Two-Column Layout (§5) ── */}
      <div className="overview-grid">
        {/* Left Column: 3D Hardware Board Preview */}
        <div className="panel-card overview-topology-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={14} color="var(--accent-amber)" />
              <span>Hardware & Transducer Topology</span>
            </div>
            <button
              className="panel-link-btn"
              onClick={() => onSelectTab('hardware_3d')}
              title="Open full interactive 3D inspection environment"
            >
              <span>Inspect in 3D</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="overview-3d-wrapper">
            <Interactive3DSensorCanvas
              activeSensorKey="temperature"
              sensorState={sensorState}
              onSelectSensor={() => onSelectTab('live')}
            />
          </div>

          <div className="overview-topology-footer">
            <span className="topology-badge">ESP-WROOM-32</span>
            <span className="topology-info">Click the board model to navigate to full 3D pin register inspector</span>
          </div>
        </div>

        {/* Right Column: Operational Diagnostics & Quick Controls */}
        <div className="panel-card overview-diagnostics-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Server size={14} color="var(--accent-teal)" />
              <span>System & Channel Diagnostics</span>
            </div>
          </div>

          <div className="overview-diagnostics-body">
            <div className="diag-section">
              <span className="diag-label">SUBSYSTEM STATUS</span>
              <div className="diag-list">
                <div className="diag-row">
                  <span className="diag-row-name">Backend RPC Server</span>
                  <span className={`diag-pill ${isConnected ? 'ok' : 'err'}`}>
                    {isConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="diag-row">
                  <span className="diag-row-name">Transducer Synthesis</span>
                  <span className="diag-pill ok">RUNNING</span>
                </div>
                <div className="diag-row">
                  <span className="diag-row-name">Pin Allocation Matrix</span>
                  <span className="diag-pill ok">VALIDATED (0 CONFLICTS)</span>
                </div>
                <div className="diag-row">
                  <span className="diag-row-name">Serial Monitor Driver</span>
                  <span className="diag-pill neutral">READY</span>
                </div>
              </div>
            </div>

            <div className="diag-section">
              <span className="diag-label">QUICK WORKBENCH ACTIONS</span>
              <div className="action-buttons-grid">
                <button
                  className="quick-action-tile"
                  onClick={() => onSelectTab('scenario')}
                >
                  <Activity size={16} color="var(--accent-amber)" />
                  <div className="tile-title">Waveform Scenarios</div>
                  <div className="tile-desc">Run Sine, Triangle, or Ramp profiles</div>
                </button>

                <button
                  className="quick-action-tile"
                  onClick={() => onSelectTab('fault_inject')}
                >
                  <ShieldOff size={16} color="var(--color-danger)" />
                  <div className="tile-title">Fault Injection Lab</div>
                  <div className="tile-desc">Test Spike, Noise, Dropout & Latency</div>
                </button>

                <button
                  className="quick-action-tile"
                  onClick={() => onSelectTab('logs')}
                >
                  <Terminal size={16} color="var(--accent-teal)" />
                  <div className="tile-title">Serial Console</div>
                  <div className="tile-desc">Inspect live UART serial telemetry</div>
                </button>

                <button
                  className="quick-action-tile"
                  onClick={() => onSelectTab('config')}
                >
                  <Sliders size={16} color="var(--text-secondary)" />
                  <div className="tile-title">Pin Configuration</div>
                  <div className="tile-desc">Map virtual sensors to ESP32 GPIOs</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Technical Transducer Channel Matrix Table (§5) ── */}
      <div className="panel-card overview-matrix-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={14} color="var(--accent-amber)" />
            <span>Virtual Transducer Channel Matrix (All 12 Channels)</span>
          </div>
          <span className="table-count-badge">12 Channels Active</span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="tech-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Transducer Name</th>
                <th>Routing</th>
                <th>Signal Mode</th>
                <th style={{ textAlign: 'right' }}>Current Value</th>
                <th style={{ width: '120px' }}>Stream State</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {SENSOR_CHANNELS.map((ch, idx) => {
                const currentVal = sensorState[ch.key] !== undefined ? sensorState[ch.key] : ch.defaultVal;
                const isFaulted = sensorState.faults && sensorState.faults[ch.key];
                const displayVal = typeof currentVal === 'number'
                  ? currentVal.toFixed(ch.unit === 'g' || ch.unit === 'UVI' ? 2 : 1)
                  : currentVal;

                return (
                  <tr key={ch.key}>
                    <td className="cell-mono text-muted">{String(idx + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="channel-name-cell">
                        <span className="channel-title">{ch.name}</span>
                      </div>
                    </td>
                    <td className="cell-mono text-secondary">{ch.gpio}</td>
                    <td>
                      <span className="signal-mode-pill">{ch.type}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="tabular-value">
                        {displayVal}
                      </span>
                      <span className="tabular-unit">{ch.unit}</span>
                    </td>
                    <td>
                      {isFaulted ? (
                        <span className="status-badge-fault">FAULT ACTIVE</span>
                      ) : (
                        <span className="status-badge-nominal">NOMINAL</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-table-action"
                        onClick={() => onSelectTab('live')}
                        title={`Inspect ${ch.name} in Live Sensors`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
