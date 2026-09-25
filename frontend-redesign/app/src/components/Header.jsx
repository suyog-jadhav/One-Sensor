import React, { useState } from 'react';
import { useSensors } from '../context/SensorContext';
import { Activity, Wifi, WifiOff, Sun, Moon, Cpu, Server, PlayCircle, Settings2 } from 'lucide-react';

export default function Header() {
  const {
    connectionStatus,
    connectionMode,
    setConnectionMode,
    targetIp,
    setTargetIp,
    theme,
    setTheme,
    sensorValues
  } = useSensors();

  const [isEditingIp, setIsEditingIp] = useState(false);
  const [ipDraft, setIpDraft] = useState(targetIp);

  const handleSaveIp = (e) => {
    e.preventDefault();
    setTargetIp(ipDraft);
    setIsEditingIp(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'mock': return '#06b6d4';
      case 'connecting': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.9rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Cpu size={20} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              OneSensor Studio
            </h1>
            <span
              className="mono-tag"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600'
              }}
            >
              v3.0 3D
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-Time Hardware Sensor Simulator & Live Circuit Visualizer
          </p>
        </div>
      </div>

      {/* Middle: Scenario Status / Telemetry Rate */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem'
        }}
      >
        <Activity size={14} color="var(--accent-cyan)" />
        <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
        <span style={{ fontWeight: '700', color: sensorValues.scenario !== 'IDLE' ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
          {sensorValues.scenario || 'IDLE'}
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <span className="mono-tag" style={{ color: 'var(--text-muted)' }}>4 Hz WebSocket</span>
      </div>

      {/* Right Controls: Mode Selector, Connection Pill, Theme Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mode Dropdown */}
        <select
          value={connectionMode}
          onChange={(e) => setConnectionMode(e.target.value)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: '600',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="backend">Desktop Backend (Proxy)</option>
          <option value="direct">Direct ESP32 IP</option>
          <option value="mock">Standalone Simulator (Mock)</option>
        </select>

        {/* IP configuration pill */}
        {connectionMode !== 'mock' && (
          isEditingIp ? (
            <form onSubmit={handleSaveIp} style={{ display: 'flex', gap: '0.3rem' }}>
              <input
                type="text"
                value={ipDraft}
                onChange={(e) => setIpDraft(e.target.value)}
                placeholder="192.168.1.50 or 127.0.0.1:8000"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-indigo)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '140px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--accent-indigo)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingIp(true)}
              title="Click to edit Target IP / Port"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Settings2 size={13} />
              {targetIp}
            </button>
          )
        )}

        {/* Live Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: `${getStatusColor()}18`,
            border: `1px solid ${getStatusColor()}40`,
            fontSize: '0.8rem',
            fontWeight: '600',
            color: getStatusColor()
          }}
        >
          <span
            className="pulse-indicator"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor()
            }}
          />
          {connectionStatus.toUpperCase()}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
