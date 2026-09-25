import React, { useState, useEffect, useRef } from 'react';
import Badge from './Badge';
import { RefreshCw, Play, Square, Trash2, Filter, Terminal, Activity } from 'lucide-react';

const BAUDRATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800];
const CATEGORY_FILTERS = ['ALL', 'IPC', 'WEBSOCKET', 'TELEMETRY', 'SYSTEM'];

function SerialPanel({
  title,
  icon,
  accentColor,
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
  const [isStarting, setIsStarting] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  const scrollContainerRef = useRef(null);

  // Auto-select default port
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

  // Terminal scroll handling
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
      setIsStarting(true);
      const res = await onStart(selectedPort, baudrate, device);
      setIsStarting(false);
      if (res && res.success) {
        setIsMonitoring(true);
        setStatusMsg(`${selectedPort} @ ${baudrate} baud`);
      } else {
        setStatusMsg(`Error: ${res?.reason || 'Failed to open'}`);
      }
    }
  };

  const handleClearWithWipe = () => {
    setIsWiping(true);
    setTimeout(() => {
      onClear();
      setIsWiping(false);
    }, 150);
  };

  return (
    <div
      className="interactive-card"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-card)',
        border: `1px solid ${isMonitoring ? accentColor + '66' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{title}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {isMonitoring ? statusMsg : 'Disconnected / Standby'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge
            variant={isMonitoring ? 'active-pulse' : 'neutral'}
            dot
            pulse={isMonitoring}
          >
            {isMonitoring ? 'STREAMING' : 'IDLE'}
          </Badge>
          <button
            onClick={handleClearWithWipe}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Clear panel logs"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '7px 10px',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
          }}
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
          style={{
            width: '120px',
            padding: '7px 10px',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
          }}
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
            padding: '7px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: isMonitoring ? 'rgba(239, 68, 68, 0.2)' : accentColor,
            color: isMonitoring ? '#fca5a5' : '#0b0f17',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <RefreshCw size={13} className="spin-icon" />
              <span>Starting…</span>
            </>
          ) : isMonitoring ? (
            <>
              <Square size={13} />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span>Start</span>
            </>
          )}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto', userSelect: 'none' }}>
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>

      {/* Terminal Canvas */}
      <div
        ref={scrollContainerRef}
        style={{
          height: '300px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#07090e',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.6',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          opacity: isWiping ? 0 : 1,
          transition: 'opacity var(--motion-fast)',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'rgba(255, 255, 255, 0.25)', fontStyle: 'italic', paddingTop: '10px' }}>
            {isMonitoring ? 'Waiting for incoming frames…' : `Select port and click Start to begin monitoring ${title}.`}
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="terminal-line"
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '2px',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontSize: '10px', paddingTop: '1px' }}>
                {String(idx + 1).padStart(3, '0')}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', flexShrink: 0, fontSize: '11px', paddingTop: '1px' }}>
                {log.timestamp}
              </span>
              <span style={{ color: log.type === 'error' ? '#f87171' : 'rgba(255, 255, 255, 0.85)' }}>
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

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [filterFade, setFilterFade] = useState(false);
  const [isGlobalWiping, setIsGlobalWiping] = useState(false);

  const systemScrollRef = useRef(null);

  // Filter system logs by category
  const filteredSystemLogs = systemLogs.filter(log => {
    if (activeFilter === 'ALL') return true;
    const msg = (log.message || '').toUpperCase();
    if (activeFilter === 'WEBSOCKET') return msg.includes('WS') || msg.includes('WEBSOCKET');
    if (activeFilter === 'TELEMETRY') return msg.includes('STATE') || msg.includes('VAL') || msg.includes('SET');
    if (activeFilter === 'IPC') return msg.includes('IPC') || msg.includes('SIDECAR');
    if (activeFilter === 'SYSTEM') return !msg.includes('WS') && !msg.includes('STATE');
    return true;
  });

  useEffect(() => {
    if (systemScrollRef.current) {
      systemScrollRef.current.scrollTop = systemScrollRef.current.scrollHeight;
    }
  }, [filteredSystemLogs]);

  const handleFilterClick = (filter) => {
    setFilterFade(true);
    setActiveFilter(filter);
    setTimeout(() => setFilterFade(false), 150);
  };

  const handleGlobalClear = () => {
    setIsGlobalWiping(true);
    setTimeout(() => {
      onClear('all');
      setIsGlobalWiping(false);
    }, 150);
  };

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Console & Serial Telemetry Monitor</h2>
            <Badge variant="neutral">TRIPLE ENGINE IPC</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Bi-directional serial streams and WebSocket packet inspection in real-time.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleGlobalClear} style={{ gap: '8px' }}>
          <Trash2 size={14} />
          <span>Clear All Streams</span>
        </button>
      </div>

      {/* Dual Serial Monitors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        <SerialPanel
          title="ESP32 Serial Stream"
          icon="🔷"
          accentColor="var(--color-primary)"
          device="esp32"
          logs={esp32Logs}
          ports={ports}
          onStart={onStartSerialMonitor}
          onStop={onStopSerialMonitor}
          onClear={() => onClear('esp32_serial')}
        />
        <SerialPanel
          title="Arduino Serial Stream"
          icon="🟠"
          accentColor="var(--color-cyan)"
          device="arduino"
          logs={arduinoLogs}
          ports={ports}
          onStart={onStartSerialMonitor}
          onStop={onStopSerialMonitor}
          onClear={() => onClear('arduino_serial')}
        />
      </div>

      {/* System & WebSocket IPC Console */}
      <div
        className="interactive-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--color-cyan)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>System & WebSocket IPC Console</h3>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="var(--text-dim)" />
            {CATEGORY_FILTERS.map(f => {
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFilterClick(f)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                    transition: 'all var(--motion-fast)',
                  }}
                >
                  {f}
                </button>
              );
            })}

            <button
              onClick={() => onClear('system')}
              style={{
                marginLeft: '8px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Terminal Canvas */}
        <div
          ref={systemScrollRef}
          style={{
            height: '200px',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#07090e',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            opacity: filterFade || isGlobalWiping ? 0.3 : 1,
            transition: 'opacity var(--motion-fast)',
          }}
        >
          {filteredSystemLogs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', paddingTop: '10px' }}>
              No IPC or system event logs matching filter [{activeFilter}].
            </div>
          ) : (
            filteredSystemLogs.map((log, idx) => (
              <div
                key={idx}
                className="terminal-line"
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '2px',
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontSize: '10px', paddingTop: '1px' }}>
                  {String(idx + 1).padStart(3, '0')}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, fontSize: '11px', paddingTop: '1px' }}>
                  {log.timestamp}
                </span>
                <span
                  style={{
                    color: log.type === 'error'
                      ? '#f87171'
                      : log.type === 'success'
                      ? '#34d399'
                      : 'rgba(255, 255, 255, 0.75)'
                  }}
                >
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
