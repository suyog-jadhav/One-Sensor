import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  Activity,
  TrendingUp,
  ShieldOff,
  Cpu,
  Sliders,
  Zap,
  Terminal,
  HelpCircle,
  Play,
  X
} from 'lucide-react';

const COMMANDS = [
  { id: 'run_demo', label: 'Run Judge Demo Mode', sub: 'Interactive 8-step guided story', icon: Play, action: 'demo' },
  { id: 'overview', label: 'Open Overview Dashboard', sub: 'System health & 3D hero viewer', icon: LayoutDashboard, tab: 'overview' },
  { id: 'live', label: 'Open Live Sensor Wall', sub: '12-channel transducer matrix', icon: Activity, tab: 'live' },
  { id: 'scenario', label: 'Open Scenario Generator', sub: 'Waveform signal synthesis', icon: TrendingUp, tab: 'scenario' },
  { id: 'fault_inject', label: 'Open Fault Lab', sub: 'Inject spikes, noise, dropouts', icon: ShieldOff, tab: 'fault_inject' },
  { id: 'hardware_3d', label: 'Inspect ESP32 Hardware & 3D', sub: 'Pin matrix & board view', icon: Cpu, tab: 'hardware_3d' },
  { id: 'config', label: 'Open Hardware Configuration', sub: 'GPIO pin routing & channels', icon: Sliders, tab: 'config' },
  { id: 'flash', label: 'Open Firmware Flash Utility', sub: 'Binary flashing & bootloader', icon: Zap, tab: 'flash' },
  { id: 'logs', label: 'Open Serial Console', sub: 'Live COM telemetry feed', icon: Terminal, tab: 'logs' },
  { id: 'wizard', label: 'Open Device Setup Wizard', sub: '5-step hardware provisioning', icon: HelpCircle, tab: 'wizard' },
];

export default function CommandPalette({ isOpen, onClose, onSelectTab, onRunDemo }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredCommands[selectedIndex];
        if (item) {
          executeCommand(item);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.sub.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = (cmd) => {
    if (cmd.action === 'demo') {
      onRunDemo();
    } else if (cmd.tab) {
      onSelectTab(cmd.tab);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '120px'
    }} onClick={onClose}>
      <div style={{
        width: '560px',
        backgroundColor: 'var(--bg-deep)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-soft)'
        }}>
          <Search size={16} color="var(--accent-amber)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or jump to workspace..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            padding: '2px 6px'
          }}>
            ESC
          </span>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--surface-raised)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--accent-amber)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={15} color={isSelected ? 'var(--accent-amber)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {cmd.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {cmd.sub}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                      ↵ SELECT
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
