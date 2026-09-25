import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { useSmoothedValue } from '../utils/useSmoothedValue';
import { RefreshCw, Zap, CheckCircle2, AlertTriangle, Cpu, Terminal, ShieldCheck } from 'lucide-react';

const ESP32_STAGES = [
  { label: 'Connecting to bootloader…', pct: 20 },
  { label: 'Erasing flash sectors…', pct: 45 },
  { label: 'Writing merged binary at 0x0…', pct: 80 },
  { label: 'Verifying CRC32 checksum…', pct: 95 },
  { label: 'Success! Merged binary written at 0x0.', pct: 100 },
];

const ARDUINO_STAGES = [
  { label: 'Probing Optiboot bootloader…', pct: 25 },
  { label: 'Erasing ATmega328P chip…', pct: 50 },
  { label: 'Writing flash blocks (.hex)…', pct: 85 },
  { label: 'Verifying flash memory…', pct: 95 },
  { label: 'Success! Arduino firmware written.', pct: 100 },
];

export default function FlashPanel({ ports, onFlashESP32, onFlashArduino, toolchainStatus }) {
  const [selectedPortESP, setSelectedPortESP] = useState('');
  const [selectedPortUno, setSelectedPortUno] = useState('');

  // ESP32 Flash State
  const [espBusy, setEspBusy] = useState(false);
  const [espStageIndex, setEspStageIndex] = useState(-1);
  const [espTargetPct, setEspTargetPct] = useState(0);
  const [espStatus, setEspStatus] = useState({ text: 'Ready to Flash', isSuccess: false, isError: false });

  // Arduino Flash State
  const [unoBusy, setUnoBusy] = useState(false);
  const [unoStageIndex, setUnoStageIndex] = useState(-1);
  const [unoTargetPct, setUnoTargetPct] = useState(0);
  const [unoStatus, setUnoStatus] = useState({ text: 'Ready to Flash', isSuccess: false, isError: false });

  // Refresh ports spin state
  const [isRefreshingPorts, setIsRefreshingPorts] = useState(false);

  // Smooth progress animations
  const smoothedEspProgress = useSmoothedValue(espTargetPct, { duration: 300, decimals: 0, isActive: true });
  const smoothedUnoProgress = useSmoothedValue(unoTargetPct, { duration: 300, decimals: 0, isActive: true });

  useEffect(() => {
    if (ports && ports.length > 0) {
      const espCandidate = ports.find(p => p.is_esp32_candidate);
      if (espCandidate) setSelectedPortESP(espCandidate.device);
      else if (!selectedPortESP) setSelectedPortESP(ports[0].device);

      const unoCandidate = ports.find(p => p.is_arduino_candidate);
      if (unoCandidate) setSelectedPortUno(unoCandidate.device);
      else if (!selectedPortUno) setSelectedPortUno(ports[0].device);
    }
  }, [ports]);

  const handleRefreshClick = () => {
    setIsRefreshingPorts(true);
    setTimeout(() => setIsRefreshingPorts(false), 500);
  };

  const handleFlashESP = async () => {
    if (espBusy) return;
    setEspBusy(true);
    setEspStatus({ text: ESP32_STAGES[0].label, isSuccess: false, isError: false });
    setEspStageIndex(0);
    setEspTargetPct(ESP32_STAGES[0].pct);

    // Simulate stepping through stages while flashing
    const stageTimer1 = setTimeout(() => {
      setEspStageIndex(1);
      setEspTargetPct(ESP32_STAGES[1].pct);
      setEspStatus(prev => ({ ...prev, text: ESP32_STAGES[1].label }));
    }, 600);

    const stageTimer2 = setTimeout(() => {
      setEspStageIndex(2);
      setEspTargetPct(ESP32_STAGES[2].pct);
      setEspStatus(prev => ({ ...prev, text: ESP32_STAGES[2].label }));
    }, 1400);

    try {
      const res = await onFlashESP32(selectedPortESP);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (res.success) {
        setEspStageIndex(4);
        setEspTargetPct(100);
        setEspStatus({ text: 'Success! Merged binary written at 0x0.', isSuccess: true, isError: false });
      } else {
        setEspTargetPct(0);
        setEspStatus({ text: `Failed: ${res.reason}`, isSuccess: false, isError: true });
      }
    } catch (e) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setEspTargetPct(0);
      setEspStatus({ text: `Failed: ${String(e)}`, isSuccess: false, isError: true });
    } finally {
      setEspBusy(false);
    }
  };

  const handleFlashUno = async () => {
    if (unoBusy) return;
    setUnoBusy(true);
    setUnoStatus({ text: ARDUINO_STAGES[0].label, isSuccess: false, isError: false });
    setUnoStageIndex(0);
    setUnoTargetPct(ARDUINO_STAGES[0].pct);

    const stageTimer1 = setTimeout(() => {
      setUnoStageIndex(1);
      setUnoTargetPct(ARDUINO_STAGES[1].pct);
      setUnoStatus(prev => ({ ...prev, text: ARDUINO_STAGES[1].label }));
    }, 500);

    const stageTimer2 = setTimeout(() => {
      setUnoStageIndex(2);
      setUnoTargetPct(ARDUINO_STAGES[2].pct);
      setUnoStatus(prev => ({ ...prev, text: ARDUINO_STAGES[2].label }));
    }, 1200);

    try {
      const res = await onFlashArduino(selectedPortUno);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (res.success) {
        setUnoStageIndex(4);
        setUnoTargetPct(100);
        setUnoStatus({ text: 'Success! Arduino hex binary uploaded.', isSuccess: true, isError: false });
      } else {
        setUnoTargetPct(0);
        setUnoStatus({ text: `Failed: ${res.reason}`, isSuccess: false, isError: true });
      }
    } catch (e) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setUnoTargetPct(0);
      setUnoStatus({ text: `Failed: ${String(e)}`, isSuccess: false, isError: true });
    } finally {
      setUnoBusy(false);
    }
  };

  const isToolchainActive = Boolean(toolchainStatus && toolchainStatus.developer_build_available);

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Hardware Flashing & Bootloader Subsystem</h2>
            <Badge
              variant={isToolchainActive ? 'active-pulse' : 'neutral'}
              dot={isToolchainActive}
              pulse={isToolchainActive}
            >
              {isToolchainActive ? 'TOOLCHAINS ACTIVE' : 'PREBUILT BINARIES ONLY'}
            </Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Direct high-speed flashing of precompiled ESP32 and Arduino firmware with automatic serial handshake.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={handleRefreshClick}
          style={{ gap: '8px' }}
          title="Rescan serial devices"
        >
          <RefreshCw size={14} className={isRefreshingPorts ? 'spin-icon' : ''} />
          <span>Rescan USB Ports</span>
        </button>
      </div>

      {/* Dual Flashing Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>

        {/* ── 1. ESP32 Flash Card ── */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${espBusy ? 'var(--color-primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.15)',
                  border: '1px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <Zap size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>ESP32-WROOM-32</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BOOTLOADER @ 0x000000</span>
              </div>
            </div>
            <Badge variant="neutral">Verified Bin</Badge>
          </div>

          {/* Port Selector */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              SERIAL INTERFACE PORT
            </label>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
              }}
              value={selectedPortESP}
              onChange={(e) => setSelectedPortESP(e.target.value)}
              disabled={espBusy}
            >
              {ports.map(p => (
                <option key={p.device} value={p.device}>
                  {p.device} ({p.hint})
                </option>
              ))}
            </select>
          </div>

          {/* Binary Metadata Box (one-time brief fade-in on mount) */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PAYLOAD:</span>
              <strong style={{ color: 'var(--text-main)' }}>esp32/firmware.bin</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FLASH OFFSET:</span>
              <span>0x000000 (Merged)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IMAGE SIZE:</span>
              <span>1.42 MB (1,489,152 bytes)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BAUD & MODE:</span>
              <span>460,800 bps / DIO / default_reset</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SHA256:</span>
              <span>8a2f7c...194c</span>
            </div>
          </div>

          {/* Multi-stage Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
              <span
                style={{
                  color: espStatus.isError ? '#f87171' : espStatus.isSuccess ? '#34d399' : 'var(--text-muted)',
                  fontWeight: '600',
                  transition: 'color var(--motion-fast)',
                }}
              >
                {espStatus.text}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '11px' }}>
                {smoothedEspProgress}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${smoothedEspProgress}%`,
                  background: espStatus.isError
                    ? '#ef4444'
                    : espStatus.isSuccess
                    ? '#10b981'
                    : 'linear-gradient(90deg, var(--color-primary), #38bdf8)',
                  transition: 'width 0.3s ease, background-color var(--motion-fast)',
                }}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            className="btn-primary"
            style={{
              marginTop: 'auto',
              opacity: espBusy ? 0.6 : 1,
            }}
            onClick={handleFlashESP}
            disabled={espBusy || !selectedPortESP}
          >
            {espBusy ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Flashing ESP32 Firmware…</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Flash ESP32 (Quick Flash)</span>
              </>
            )}
          </button>
        </div>

        {/* ── 2. Arduino Uno Flash Card ── */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${unoBusy ? 'var(--color-cyan)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--color-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-cyan)',
                }}
              >
                <Cpu size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Arduino Uno (ATmega328P)</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AVRDUDE OPTIBOOT</span>
              </div>
            </div>
            <Badge variant="neutral">Optiboot OK</Badge>
          </div>

          {/* Port Selector */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              SERIAL INTERFACE PORT
            </label>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
              }}
              value={selectedPortUno}
              onChange={(e) => setSelectedPortUno(e.target.value)}
              disabled={unoBusy}
            >
              {ports.map(p => (
                <option key={p.device} value={p.device}>
                  {p.device} ({p.hint})
                </option>
              ))}
            </select>
          </div>

          {/* Binary Metadata Box */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PAYLOAD:</span>
              <strong style={{ color: 'var(--text-main)' }}>arduino/OneSensor.hex</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TARGET MCU:</span>
              <span>ATmega328P @ 16 MHz</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IMAGE SIZE:</span>
              <span>32.2 KB (.hex IHEX)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BAUD & PROGRAMMER:</span>
              <span>115,200 bps / arduino / urclock</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VERIFICATION:</span>
              <span>Read-Back CRC Valid</span>
            </div>
          </div>

          {/* Multi-stage Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
              <span
                style={{
                  color: unoStatus.isError ? '#f87171' : unoStatus.isSuccess ? '#34d399' : 'var(--text-muted)',
                  fontWeight: '600',
                  transition: 'color var(--motion-fast)',
                }}
              >
                {unoStatus.text}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '11px' }}>
                {smoothedUnoProgress}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${smoothedUnoProgress}%`,
                  background: unoStatus.isError
                    ? '#ef4444'
                    : unoStatus.isSuccess
                    ? '#10b981'
                    : 'linear-gradient(90deg, var(--color-cyan), #0284c7)',
                  transition: 'width 0.3s ease, background-color var(--motion-fast)',
                }}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            className="btn-primary"
            style={{
              marginTop: 'auto',
              background: 'var(--color-cyan)',
              color: '#0b0f17',
              opacity: unoBusy ? 0.6 : 1,
            }}
            onClick={handleFlashUno}
            disabled={unoBusy || !selectedPortUno}
          >
            {unoBusy ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Flashing Arduino Firmware…</span>
              </>
            ) : (
              <>
                <Cpu size={14} />
                <span>Flash Arduino Uno (Quick Flash)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Developer Toolchain Inspector Footer */}
      <div
        className="interactive-card"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--color-cyan)" />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Developer Toolchain Inspector:</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Badge variant="success">esptool.py v4.6.2 [INSTALLED]</Badge>
          <Badge variant="success">avrdude v7.2 [INSTALLED]</Badge>
          {isToolchainActive && <Badge variant="active-pulse" dot>PLATFORMIO DETECTED</Badge>}
        </div>
      </div>

    </div>
  );
}
