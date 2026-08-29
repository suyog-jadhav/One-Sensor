import React, { useState, useEffect } from 'react';

export default function FlashPanel({ ports, onFlashESP32, onFlashArduino, toolchainStatus }) {
  const [selectedPortESP, setSelectedPortESP] = useState('');
  const [selectedPortUno, setSelectedPortUno] = useState('');
  const [flashingStatus, setFlashingStatus] = useState(null);

  useEffect(() => {
    if (ports && ports.length > 0) {
      const espCandidate = ports.find(p => p.is_esp32_candidate);
      if (espCandidate) setSelectedPortESP(espCandidate.device);
      else setSelectedPortESP(ports[0].device);

      const unoCandidate = ports.find(p => p.is_arduino_candidate);
      if (unoCandidate) setSelectedPortUno(unoCandidate.device);
      else setSelectedPortUno(ports[0].device);
    }
  }, [ports]);

  const handleFlashESP = async () => {
    setFlashingStatus({ target: 'ESP32', state: 'Flashing merged firmware.bin...' });
    const res = await onFlashESP32(selectedPortESP);
    if (res.success) {
      setFlashingStatus({ target: 'ESP32', state: 'Success! Merged binary written at 0x0.', isSuccess: true });
    } else {
      setFlashingStatus({ target: 'ESP32', state: `Failed: ${res.reason}`, isError: true });
    }
  };

  const handleFlashUno = async () => {
    setFlashingStatus({ target: 'Arduino Uno', state: 'Uploading prebuilt .hex binary...' });
    const res = await onFlashArduino(selectedPortUno);
    if (res.success) {
      setFlashingStatus({ target: 'Arduino Uno', state: 'Success! Hex uploaded.', isSuccess: true });
    } else {
      setFlashingStatus({ target: 'Arduino Uno', state: `Failed: ${res.reason}`, isError: true });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Hardware Flashing Subsystem</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Quick Flash prebuilt binaries with zero toolchain dependencies, or Developer Build from local source code.
        </p>
      </div>

      {flashingStatus && (
        <div style={{
          background: flashingStatus.isError ? 'rgba(239, 68, 68, 0.15)' : flashingStatus.isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          border: `1px solid ${flashingStatus.isError ? '#ef4444' : flashingStatus.isSuccess ? '#10b981' : '#6366f1'}`,
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '14px'
        }}>
          <strong>[{flashingStatus.target}]</strong> {flashingStatus.state}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* ESP32 Flash */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>⚡ ESP32 Quick Flash</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Serial Port</label>
              <select
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={selectedPortESP}
                onChange={(e) => setSelectedPortESP(e.target.value)}
              >
                {ports.map(p => (
                  <option key={p.device} value={p.device}>
                    {p.device} ({p.hint})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Binary: <code>esp32/firmware.bin</code> (merged offset 0x0)
            </div>

            <button className="btn-primary" style={{ marginTop: '12px' }} onClick={handleFlashESP}>
              Flash ESP32 (Quick Flash)
            </button>
          </div>
        </div>

        {/* Arduino Uno Flash */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>⚡ Arduino Uno Quick Flash</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Serial Port</label>
              <select
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={selectedPortUno}
                onChange={(e) => setSelectedPortUno(e.target.value)}
              >
                {ports.map(p => (
                  <option key={p.device} value={p.device}>
                    {p.device} ({p.hint})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Binary: <code>arduino/OneSensor.hex</code>
            </div>

            <button className="btn-primary" style={{ marginTop: '12px', background: '#3b82f6' }} onClick={handleFlashUno}>
              Flash Arduino Uno (Quick Flash)
            </button>
          </div>
        </div>
      </div>

      {/* Developer Build Mode Notice */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>🛠️ Developer Build Mode</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {toolchainStatus && toolchainStatus.developer_build_available
            ? "PlatformIO / arduino-cli toolchains detected on system PATH. Developer Build path enabled."
            : "No external build toolchains detected on PATH. Using Quick Flash prebuilt binaries path."}
        </p>
      </div>
    </div>
  );
}
