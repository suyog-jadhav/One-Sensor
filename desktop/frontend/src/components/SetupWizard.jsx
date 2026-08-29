import React, { useState, useEffect } from 'react';

export default function SetupWizard({
  ports,
  onFlashESP32,
  onProvisionESP32,
  onBuildFlashESP32,
  onFlashArduino,
  onProvisionArduino,
  onFinishWizard
}) {
  const [step, setStep] = useState(1);
  const [selectedPortESP, setSelectedPortESP] = useState('');
  const [selectedPortUno, setSelectedPortUno] = useState('');

  // Step 3 Wi-Fi form
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceName, setDeviceName] = useState('onesensor');
  // Which method: 'build' | 'serial'
  const [wifiMethod, setWifiMethod] = useState('build');

  // Status state
  const [statusMsg, setStatusMsg] = useState('');
  const [statusStage, setStatusStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectedIP, setConnectedIP] = useState('');

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

  const handleStep2FlashESP = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Flashing ESP32 firmware...');

    const res = await onFlashESP32(selectedPortESP);
    setLoading(false);
    if (res.success) {
      setStatusMsg('ESP32 flashed successfully!');
      setStep(3);
    } else {
      setErrorMsg(`Flashing failed: ${res.reason}. If stuck in bootloader, hold the BOOT button on the ESP32 while clicking Flash.`);
    }
  };

  const handleStep3WiFi = async () => {
    if (!ssid) {
      setErrorMsg('Please enter your Wi-Fi SSID.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    if (wifiMethod === 'build') {
      // Build & Flash approach — most reliable
      setStatusStage('📝 Writing Wi-Fi credentials...');
      setStatusMsg('');
      const res = await onBuildFlashESP32(selectedPortESP, ssid, password, deviceName);
      setLoading(false);
      setStatusStage('');

      if (res.success) {
        const ip = res.ip || null;
        setConnectedIP(ip || '');
        if (ip) {
          setStatusMsg(`✅ Connected! ESP32 acquired IP: ${ip}`);
        } else {
          setStatusMsg(`✅ Flashed! ${res.note || 'Use onesensor.local or enter IP manually.'}`);
        }
        setStep(4);
      } else {
        const stageLabel = { write_secrets: 'Write credentials', build: 'Compile firmware', flash: 'Flash ESP32' }[res.stage] || res.stage;
        setErrorMsg(`${stageLabel} failed: ${res.reason}`);
      }
    } else {
      // USB Serial provisioning (fallback)
      setStatusMsg('Sending Wi-Fi credentials over USB serial...');
      const res = await onProvisionESP32(selectedPortESP, ssid, password, deviceName);
      setLoading(false);
      if (res.success) {
        setConnectedIP(res.ip);
        setStatusMsg(`✅ Connected! ESP32 acquired IP: ${res.ip}`);
        setStep(4);
      } else {
        setErrorMsg(`Provisioning failed: ${res.reason}. Verify SSID/Password and ensure device is in range.`);
      }
    }
  };

  const handleStep5Arduino = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Flashing Arduino Uno & provisioning pin layout...');

    const flashRes = await onFlashArduino(selectedPortUno);
    if (!flashRes.success) {
      setLoading(false);
      setErrorMsg(`Arduino Flash failed: ${flashRes.reason}`);
      return;
    }

    const defaultChannels = [
      { sensor: 'temperature', pin: 2, signal: 'pwm' },
      { sensor: 'humidity', pin: 3, signal: 'pwm' },
      { sensor: 'gas', pin: 4, signal: 'pwm' },
      { sensor: 'light', pin: 5, signal: 'pwm' },
      { sensor: 'soil_moisture', pin: 6, signal: 'pwm' }
    ];

    const provRes = await onProvisionArduino(selectedPortUno, defaultChannels);
    setLoading(false);

    if (provRes.success) {
      onFinishWizard();
    } else {
      setErrorMsg(`Arduino Pin Provisioning failed: ${provRes.reason}`);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid var(--border-color)',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  };
  const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '36px' }}>
      {/* Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: '600' }}>First-Time Setup Wizard</span>
        <span>Step {step} of 5</span>
      </div>

      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '32px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(step / 5) * 100}%`, background: 'linear-gradient(90deg, var(--accent-primary), #818cf8)', transition: 'width 0.4s ease', borderRadius: '2px' }} />
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>⚠ Error:</strong> {errorMsg}
        </div>
      )}

      {/* Status banner */}
      {(statusMsg || statusStage) && !errorMsg && (
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
          {statusStage && <div style={{ fontWeight: '600', marginBottom: statusMsg ? '4px' : 0 }}>{statusStage}</div>}
          {statusMsg && <div>{statusMsg}</div>}
        </div>
      )}

      {/* ── Step 1: Select ESP32 Port ── */}
      {step === 1 && (
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px' }}>Step 1: Select ESP32 Serial Port</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
            Plug in your ESP32 board via USB and select its serial port below.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Available Ports</label>
            <select style={inputStyle} value={selectedPortESP} onChange={e => setSelectedPortESP(e.target.value)}>
              {ports.map(p => (
                <option key={p.device} value={p.device}>{p.device} ({p.hint})</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>
            Next: Flash ESP32 Firmware →
          </button>
        </div>
      )}

      {/* ── Step 2: Flash ESP32 ── */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px' }}>Step 2: Flash ESP32 Firmware</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            Flash the OneSensor firmware onto your ESP32 at <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{selectedPortESP}</code>.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '28px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.06)' }}>
            💡 <strong>Tip:</strong> If auto-flash times out, hold the <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>BOOT</code> button on your ESP32 while clicking Flash.
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setStep(1)} disabled={loading}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleStep2FlashESP} disabled={loading}>
              {loading ? 'Flashing...' : '⚡ Flash ESP32 Binary'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Wi-Fi Credentials ── */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px' }}>Step 3: Configure Wi-Fi</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            Enter your <strong>2.4 GHz</strong> Wi-Fi credentials so the ESP32 can connect to your network.
          </p>

          {/* Method selector */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => setWifiMethod('build')}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${wifiMethod === 'build' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: wifiMethod === 'build' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)',
                color: wifiMethod === 'build' ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>⚡ Build & Flash</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Embeds Wi-Fi in firmware. Most reliable. ~60s.</div>
            </button>
            <button
              onClick={() => setWifiMethod('serial')}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${wifiMethod === 'serial' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: wifiMethod === 'serial' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)',
                color: wifiMethod === 'serial' ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>🔌 USB Serial</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Sends over serial. Requires flashed firmware. ~15s.</div>
            </button>
          </div>

          {wifiMethod === 'build' && (
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#6ee7b7' }}>
              ✅ <strong>Recommended.</strong> Your credentials are compiled directly into the firmware and saved to the ESP32's NVS — the device reconnects automatically on every reboot.
            </div>
          )}
          {wifiMethod === 'serial' && (
            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#fcd34d' }}>
              ⚠ <strong>Requires Step 2 flashed firmware.</strong> If you see <code>auth_timeout</code>, switch to Build & Flash instead.
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Wi-Fi Network Name (SSID) — 2.4 GHz only</label>
              <input
                id="wifi-ssid"
                type="text"
                style={inputStyle}
                placeholder="MyHomeNetwork"
                value={ssid}
                onChange={e => setSsid(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label style={labelStyle}>Wi-Fi Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="wifi-password"
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: '2px' }}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Device Name (used for mDNS — <code style={{ fontSize: '11px' }}>{deviceName}.local</code>)</label>
              <input
                id="device-name"
                type="text"
                style={inputStyle}
                placeholder="onesensor"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              />
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              {wifiMethod === 'build'
                ? '⚙️ Compiling firmware & flashing… this takes ~60 seconds. Please wait.'
                : '🔌 Sending credentials over serial…'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setStep(2)} disabled={loading}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleStep3WiFi} disabled={loading}>
              {loading
                ? (wifiMethod === 'build' ? 'Building & Flashing...' : 'Provisioning...')
                : (wifiMethod === 'build' ? '⚡ Build, Flash & Connect' : '📡 Send Credentials')}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Connection Confirmed ── */}
      {step === 4 && (
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px' }}>Step 4: Connection Confirmed! 🎉</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            {connectedIP
              ? `The ESP32 connected to Wi-Fi and is reachable at ws://${connectedIP}/ws.`
              : `The ESP32 was flashed successfully. Use mDNS (${deviceName}.local) or enter IP manually in Live Control.`}
          </p>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: '18px', borderRadius: '14px', marginBottom: '28px', fontSize: '14px', lineHeight: '1.8' }}>
            {connectedIP && <div>🌐 <strong>IP Address:</strong> {connectedIP}</div>}
            <div>📡 <strong>mDNS Hostname:</strong> {deviceName}.local</div>
            <div>🔌 <strong>WebSocket:</strong> {connectedIP ? `ws://${connectedIP}/ws` : `ws://${deviceName}.local/ws`}</div>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStep(5)}>
            Next: Setup Arduino Uno (Optional) →
          </button>
        </div>
      )}

      {/* ── Step 5: Arduino (Optional) ── */}
      {step === 5 && (
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px' }}>Step 5: Setup Arduino Uno <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            Flash prebuilt firmware and provision pin mappings to your Arduino Uno.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Arduino Serial Port</label>
            <select style={inputStyle} value={selectedPortUno} onChange={e => setSelectedPortUno(e.target.value)}>
              {ports.map(p => (
                <option key={p.device} value={p.device}>{p.device} ({p.hint})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={onFinishWizard}>Skip — Go to Dashboard</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleStep5Arduino} disabled={loading}>
              {loading ? 'Flashing & Provisioning...' : '🔧 Flash & Provision Arduino'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
