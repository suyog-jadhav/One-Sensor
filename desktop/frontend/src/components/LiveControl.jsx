import React, { useState, useEffect, useRef } from 'react';

const SENSOR_META = [
  { key: 'temperature', name: 'Temperature', unit: '°C', icon: '🌡️', min: 0, max: 50, color: '#ef4444' },
  { key: 'humidity', name: 'Humidity', unit: '%', icon: '💧', min: 0, max: 100, color: '#3b82f6' },
  { key: 'gas', name: 'Gas Concentration', unit: 'ppm', icon: '☁️', min: 0, max: 1000, color: '#8b5cf6' },
  { key: 'light', name: 'Light Intensity', unit: 'lux', icon: '☀️', min: 0, max: 1000, color: '#eab308' },
  { key: 'soil', name: 'Soil Moisture', unit: '%', icon: '🌱', min: 0, max: 100, color: '#10b981' }
];

const API_BASE = 'http://localhost:8000';

export default function LiveControl({ state, onSetValue, onConnectESP32 }) {
  const [targetIP, setTargetIP] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [esp32IP, setEsp32IP] = useState(null);
  const [activeFilter, setActiveFilter] = useState({
    temperature: true, humidity: true, gas: true, light: true, soil: true
  });
  const pollRef = useRef(null);

  // Poll /api/esp32_status every 3s to keep connection badge accurate
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/esp32_status`);
        const data = await res.json();
        setEsp32Connected(data.connected);
        if (data.ip) {
          setEsp32IP(data.ip);
          setTargetIP(prev => prev || data.ip); // pre-fill input if blank
        }
      } catch (_) {}
    };
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleConnect = async () => {
    if (!targetIP) return;
    setConnecting(true);
    const res = await onConnectESP32(targetIP);
    setConnecting(false);
    if (res && res.success) {
      setEsp32Connected(true);
      setEsp32IP(targetIP);
    }
  };

  const toggleSensorFilter = (key) => {
    setActiveFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleSensors = SENSOR_META.filter(s => activeFilter[s.key]);

  const connBadgeStyle = {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: esp32Connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
    border: `1px solid ${esp32Connected ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
    color: esp32Connected ? '#6ee7b7' : '#fca5a5',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header + Connect Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Live Sensor Control</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time sensor value controls & live output telemetry</p>
        </div>

        {/* ESP32 Connection Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Status Badge */}
          <div style={connBadgeStyle}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: esp32Connected ? '#10b981' : '#ef4444', flexShrink: 0, boxShadow: esp32Connected ? '0 0 6px #10b981' : 'none' }} />
            {esp32Connected
              ? `ESP32 Connected — ${esp32IP}`
              : 'ESP32 Not Connected — sliders inactive'}
          </div>

          {/* Connect Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>ESP32 IP:</span>
            <input
              type="text"
              placeholder="10.102.133.78 or onesensor.local"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', width: '220px' }}
              value={targetIP}
              onChange={e => setTargetIP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
            />
            <button
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '13px', whiteSpace: 'nowrap', opacity: connecting ? 0.7 : 1 }}
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting…' : esp32Connected ? '🔄 Reconnect' : '🔌 Connect'}
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner when disconnected */}
      {!esp32Connected && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong>ESP32 not connected.</strong> Sliders will not send commands to the hardware.
            {esp32IP && <span> Last known IP: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>{esp32IP}</code> — click <strong>Reconnect</strong> above.</span>}
          </div>
        </div>
      )}

      {/* Sensor Selection Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 18px', borderRadius: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Active Sensors:</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {SENSOR_META.map(s => (
            <label
              key={s.key}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                background: activeFilter[s.key] ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                border: activeFilter[s.key] ? '1px solid #6366f1' : '1px solid var(--border-color)',
                color: activeFilter[s.key] ? '#fff' : 'var(--text-muted)',
                fontSize: '13px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s'
              }}
            >
              <input type="checkbox" checked={activeFilter[s.key]} onChange={() => toggleSensorFilter(s.key)} style={{ display: 'none' }} />
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {visibleSensors.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          No sensors selected. Enable at least one above.
        </div>
      ) : (
        <div className="cards-grid">
          {visibleSensors.map(s => {
            const rawVal = state[s.key] !== undefined ? state[s.key] : (s.key === 'soil' ? state.soil_moisture : undefined);
            const val = rawVal !== undefined ? Number(rawVal).toFixed(1) : '--';
            const numVal = rawVal !== undefined ? Number(rawVal) : (s.max / 2);

            return (
              <div key={s.key} className="sensor-card" style={{ opacity: esp32Connected ? 1 : 0.7 }}>
                <div className="card-top">
                  <span className="sensor-name">{s.name}</span>
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                </div>

                <div className="sensor-value-large" style={{ color: s.color }}>
                  {val} <span className="unit">{s.unit}</span>
                </div>

                <div className="slider-container" style={{ position: 'relative' }}>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.max > 100 ? 5 : 0.5}
                    value={numVal}
                    disabled={!esp32Connected}
                    onChange={e => {
                      const newVal = parseFloat(e.target.value);
                      onSetValue(s.key === 'soil' ? 'soil_moisture' : s.key, newVal);
                    }}
                    title={esp32Connected ? '' : 'Connect to ESP32 first'}
                    style={{ cursor: esp32Connected ? 'pointer' : 'not-allowed' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>
                  <span>Min: {s.min}{s.unit}</span>
                  <span>Max: {s.max}{s.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
