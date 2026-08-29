import React, { useState, useEffect, useRef } from 'react';

const BAUDRATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800];

function SerialPanel({
  title,
  icon,
  color,
  device,
  logs,
  ports,
  onStart,
  onStop,
  onClear,
}) {
  const [selectedPort, setSelectedPort] = useState('');
  const [baudrate, setBaudrate] = useState(115200);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const scrollContainerRef = useRef(null);

  // Auto-select default port for each device
  useEffect(() => {
    if (!ports || ports.length === 0) return;
    if (selectedPort) return;

    if (device === 'esp32') {
      const cand = ports.find(p => p.is_esp32_candidate) || ports[0];
      setSelectedPort(cand.device);
    } else {
      const cand = ports.find(p => p.is_arduino_candidate) || ports[0];
      setSelectedPort(cand.device);
    }
  }, [ports, device]);

  // Scroll strictly inside the terminal box container without pulling down the main browser window
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleToggle = async () => {
    if (isMonitoring) {
      await onStop(device);
      setIsMonitoring(false);
      setStatusMsg('');
    } else {
      if (!selectedPort) return;
      const res = await onStart(selectedPort, baudrate, device);
      if (res && res.success) {
        setIsMonitoring(true);
        setStatusMsg(`Monitoring ${selectedPort} @ ${baudrate} baud`);
      } else {
        setStatusMsg(`Error: ${res?.reason || 'Could not open port'}`);
      }
    }
  };

  const inputStyle = {
    padding: '7px 10px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid var(--border-color)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', gap: '10px',
      background: 'var(--bg-card)', border: `1px solid ${isMonitoring ? color + '55' : 'var(--border-color)'}`,
      borderRadius: '16px', padding: '18px', minWidth: 0, overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isMonitoring
                ? <span style={{ color }}>{statusMsg}</span>
                : <span>Not monitoring</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isMonitoring ? color : 'rgba(255,255,255,0.15)',
            boxShadow: isMonitoring ? `0 0 6px ${color}` : 'none',
            display: 'inline-block', transition: 'all 0.3s',
          }} />
          <button
            onClick={onClear}
            style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          style={{ ...inputStyle, flex: '1', minWidth: '120px' }}
          value={selectedPort}
          onChange={e => setSelectedPort(e.target.value)}
          disabled={isMonitoring}
        >
          {ports && ports.map(p => (
            <option key={p.device} value={p.device}>
              {p.device} ({p.hint})
            </option>
          ))}
        </select>

        <select
          style={{ ...inputStyle, width: '120px' }}
          value={baudrate}
          onChange={e => setBaudrate(parseInt(e.target.value))}
          disabled={isMonitoring}
        >
          {BAUDRATES.map(b => (
            <option key={b} value={b}>{b.toLocaleString()} baud</option>
          ))}
        </select>

        <button
          onClick={handleToggle}
          style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', border: 'none',
            background: isMonitoring ? 'rgba(239,68,68,0.2)' : color + '33',
            color: isMonitoring ? '#fca5a5' : color,
            outline: `1px solid ${isMonitoring ? 'rgba(239,68,68,0.4)' : color + '66'}`,
            transition: 'all 0.2s',
          }}
        >
          {isMonitoring ? '⏹ Stop' : '▶ Start'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>

      {/* Terminal output box */}
      <div
        ref={scrollContainerRef}
        style={{
          height: '320px', maxHeight: '320px',
          overflowY: 'auto', overflowX: 'hidden',
          background: '#0a0a0f', borderRadius: '10px', padding: '14px',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontSize: '12px', lineHeight: '1.7',
          border: '1px solid rgba(255,255,255,0.06)',
          boxSizing: 'border-box',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            {isMonitoring ? 'Waiting for data...' : `Select port and click ▶ Start to begin monitoring ${title}.`}
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '1px', wordBreak: 'break-all' }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontSize: '11px', paddingTop: '1px' }}>
                {log.timestamp}
              </span>
              <span style={{ color: log.type === 'error' ? '#fca5a5' : 'rgba(255,255,255,0.85)' }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ConsoleLog({ logs, ports, onStartSerialMonitor, onStopSerialMonitor, onClear }) {
  const esp32Logs   = logs.filter(l => l.source === 'esp32_serial');
  const arduinoLogs = logs.filter(l => l.source === 'arduino_serial');
  const systemLogs  = logs.filter(l => !l.source || (l.source !== 'esp32_serial' && l.source !== 'arduino_serial'));

  const systemScrollRef = useRef(null);

  useEffect(() => {
    if (systemScrollRef.current) {
      systemScrollRef.current.scrollTop = systemScrollRef.current.scrollHeight;
    }
  }, [systemLogs]);

  const clearEsp32   = () => onClear('esp32_serial');
  const clearArduino = () => onClear('arduino_serial');
  const clearSystem  = () => onClear('system');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Serial Monitor & Console</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Monitor ESP32 and Arduino simultaneously — each in its own panel
          </p>
        </div>
        <button className="btn-secondary" onClick={() => onClear('all')}>Clear All Logs</button>
      </div>

      {/* Dual Serial Panels */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <SerialPanel
          title="ESP32 Serial"
          icon="🔷"
          color="#38bdf8"
          device="esp32"
          logs={esp32Logs}
          ports={ports}
          onStart={onStartSerialMonitor}
          onStop={onStopSerialMonitor}
          onClear={clearEsp32}
        />
        <SerialPanel
          title="Arduino Serial"
          icon="🟠"
          color="#fb923c"
          device="arduino"
          logs={arduinoLogs}
          ports={ports}
          onStart={onStartSerialMonitor}
          onStop={onStopSerialMonitor}
          onClear={clearArduino}
        />
      </div>

      {/* System / WebSocket Console */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>⚡ System & WebSocket Console</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Backend events, WS protocol traffic, connection logs</div>
          </div>
          <button
            onClick={clearSystem}
            style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        <div
          ref={systemScrollRef}
          style={{
            height: '180px', maxHeight: '180px',
            overflowY: 'auto', overflowX: 'hidden',
            background: '#0a0a0f', borderRadius: '10px', padding: '14px',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: '12px', lineHeight: '1.7',
            border: '1px solid rgba(255,255,255,0.06)',
            boxSizing: 'border-box',
          }}
        >
          {systemLogs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No system events yet.</div>
          ) : (
            systemLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '1px', wordBreak: 'break-all' }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontSize: '11px', paddingTop: '1px' }}>
                  {log.timestamp}
                </span>
                <span style={{
                  color: log.type === 'error' ? '#fca5a5'
                       : log.type === 'success' ? '#6ee7b7'
                       : 'rgba(255,255,255,0.75)'
                }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
