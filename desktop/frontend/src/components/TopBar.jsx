import React from 'react';
import OneSensorLogo from './OneSensorLogo';
import { Cpu, Play, Command, Radio } from 'lucide-react';

export default function TopBar({
  activeTab,
  activeTabLabel,
  isConnected,
  onRunDemo,
  isDemoActive,
  onOpenCommandPalette,
  onBackToLanding
}) {
  return (
    <header className="topbar">
      {/* Left: Product mark & Identity (click to return to landing overview) */}
      <div
        className="topbar-left"
        onClick={onBackToLanding}
        style={{ cursor: 'pointer' }}
        title="Return to Landing Page Overview"
      >
        <OneSensorLogo height={42} variant="full" theme="light" />
      </div>

      {/* Center: Clean breadcrumb with Landing return bridge */}
      <div className="topbar-center">
        {onBackToLanding ? (
          <button
            className="breadcrumb-landing-link"
            onClick={onBackToLanding}
            title="Return to Landing Overview"
          >
            Landing
          </button>
        ) : (
          <span className="breadcrumb-root">OneSensor</span>
        )}
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-root">Workbench</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-active">{activeTabLabel}</span>
      </div>

      {/* Right: Truthful Telemetry & Restrained Actions */}
      <div className="topbar-right">
        {/* Backend Sidecar IPC State */}
        <div className="telemetry-chip" title={isConnected ? 'Local Python backend sidecar is running and responding via WebSocket' : 'Local sidecar disconnected. Check backend process.'}>
          <span className={`telemetry-dot ${isConnected ? 'online' : 'offline'}`} />
          <span className="telemetry-label">Sidecar:</span>
          <span style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Operating Mode */}
        <div className="telemetry-chip">
          <Radio size={12} color="var(--accent-teal)" />
          <span className="telemetry-label">Mode:</span>
          <span style={{ color: 'var(--text-secondary)' }}>Simulation</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          className="btn-kbd-hint"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (Ctrl+K)"
          aria-label="Open Command Palette"
        >
          <Command size={12} />
          <span>Ctrl+K</span>
        </button>

        {/* Master Run Demo Action */}
        <button
          className={`btn-primary ${isDemoActive ? 'btn-active-state' : ''}`}
          onClick={onRunDemo}
          title="Run interactive evaluation demonstration workflow"
        >
          <Play size={12} fill="currentColor" />
          <span>{isDemoActive ? 'Demo Running' : 'Run Demo'}</span>
        </button>
      </div>
    </header>
  );
}
