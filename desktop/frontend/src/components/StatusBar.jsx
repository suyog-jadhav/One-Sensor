import React from 'react';
import { Wifi, WifiOff, Cpu, Activity } from 'lucide-react';

export default function StatusBar({ isConnected, sensorCount = 12, esp32Connected = false }) {
  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          {isConnected ? (
            <Wifi size={11} color="var(--color-success)" />
          ) : (
            <WifiOff size={11} color="var(--color-danger)" />
          )}
          <span>Backend:</span>
          <strong style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {isConnected ? 'Connected' : 'Offline'}
          </strong>
        </div>
        <div className="statusbar-item">
          <Cpu size={11} color="var(--text-muted)" />
          <span>ESP32:</span>
          <strong style={{ color: esp32Connected ? 'var(--color-success)' : 'var(--text-muted)' }}>
            {esp32Connected ? 'Linked' : 'Standalone'}
          </strong>
        </div>
        <div className="statusbar-item">
          <Activity size={11} color="var(--text-muted)" />
          <span>Mode:</span>
          <strong style={{ color: 'var(--accent-teal)' }}>
            {esp32Connected ? 'Hardware' : 'Simulation'}
          </strong>
        </div>
        <div className="statusbar-item">
          <span>Channels:</span>
          <strong>{sensorCount} configured</strong>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="statusbar-item" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          OneSensor — Virtual Sensor Workbench
        </div>
      </div>
    </footer>
  );
}
