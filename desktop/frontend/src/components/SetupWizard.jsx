import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { useSmoothedValue } from '../utils/useSmoothedValue';
import { Check, AlertTriangle, RefreshCw, Cpu, Wifi, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';

const WIZARD_STEPS = [
  { id: 1, title: 'Serial Port', desc: 'Select ESP32 USB COM' },
  { id: 2, title: 'Flash Firmware', desc: 'Upload ESP32 image' },
  { id: 3, title: 'Wi-Fi Setup', desc: 'Credentials & mDNS' },
  { id: 4, title: 'Network Link', desc: 'Verify WS endpoint' },
  { id: 5, title: 'Arduino Setup', desc: 'Pin routing matrix' }
];

const ARDUINO_CHANNELS = [
  { name: 'Temperature', pin: 'A0', signal: 'DAC1 Analog', color: '#ef4444' },
  { name: 'Humidity', pin: 'A1', signal: 'DAC2 Analog', color: '#38bdf8' },
  { name: 'Gas', pin: 'D4', signal: 'PWM 500 Hz', color: '#8b5cf6' },
  { name: 'Light', pin: 'D5', signal: 'PWM 500 Hz', color: '#f59e0b' },
  { name: 'Soil Moisture', pin: 'D6', signal: 'PWM 500 Hz', color: '#10b981' }
];

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
  const [wifiMethod, setWifiMethod] = useState('build'); // 'build' | 'serial'

  // Status state
  const [statusMsg, setStatusMsg] = useState('');
  const [statusStage, setStatusStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectedIP, setConnectedIP] = useState('');

  // Flashing progress
  const [flashPct, setFlashPct] = useState(0);
  const smoothedFlashProgress = useSmoothedValue(flashPct, { duration: 260, decimals: 0, isActive: true });

  // Provisioning ticks on Step 5
  const [provisionedIndex, setProvisionedIndex] = useState(-1);

  // SVG Progress Ring calculations
  const targetRingPct = (step / 5) * 100;
  const smoothedRingPct = useSmoothedValue(targetRingPct, { duration: 280, decimals: 0, isActive: true });
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset = ringCircumference - (smoothedRingPct / 100) * ringCircumference;

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

  const handleStep2FlashESP = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Connecting to ESP32 bootloader…');
    setFlashPct(25);

    const timer1 = setTimeout(() => {
      setStatusMsg('Writing firmware image to flash sectors…');
      setFlashPct(65);
    }, 700);

    const timer2 = setTimeout(() => {
      setStatusMsg('Verifying written CRC…');
      setFlashPct(90);
    }, 1500);

    const res = await onFlashESP32(selectedPortESP);
    clearTimeout(timer1);
    clearTimeout(timer2);
    setLoading(false);

    if (res.success) {
      setFlashPct(100);
      setStatusMsg('ESP32 flashed successfully!');
      setTimeout(() => {
        setStep(3);
        setFlashPct(0);
        setStatusMsg('');
      }, 600);
    } else {
      setFlashPct(0);
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
      setStatusStage('📝 Compiling Wi-Fi credentials into firmware…');
      setStatusMsg('');
      const res = await onBuildFlashESP32(selectedPortESP, ssid, password, deviceName);
      setLoading(false);
      setStatusStage('');

      if (res.success) {
        const ip = res.ip || null;
        setConnectedIP(ip || '');
        setStatusMsg(`✅ Connected! ESP32 acquired IP: ${ip || 'onesensor.local'}`);
        setStep(4);
      } else {
        const stageLabel = { write_secrets: 'Write credentials', build: 'Compile firmware', flash: 'Flash ESP32' }[res.stage] || res.stage;
        setErrorMsg(`${stageLabel} failed: ${res.reason}`);
      }
    } else {
      setStatusMsg('Sending Wi-Fi credentials over USB serial…');
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
    setStatusMsg('Flashing Arduino Uno…');

    const flashRes = await onFlashArduino(selectedPortUno);
    if (!flashRes.success) {
      setLoading(false);
      setErrorMsg(`Arduino Flash failed: ${flashRes.reason}`);
      return;
    }

    setStatusMsg('Provisioning channel routes to pins…');

    // Sequential tick animation for provisioned channels
    for (let i = 0; i < ARDUINO_CHANNELS.length; i++) {
      setProvisionedIndex(i);
      await new Promise(r => setTimeout(r, 150));
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

  return (
    <div className="tab-content-enter" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

      {/* ── Left Rail: Stepper & Hardware Tip Card ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Stepper Card */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 16px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: '700' }}>ASSISTANT</span>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Setup Wizard</h3>
            </div>
            {/* SVG Progress Ring */}
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="4"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringStrokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  style={{ transition: 'stroke-dashoffset var(--motion-standard)' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                {smoothedRingPct}%
              </div>
            </div>
          </div>

          {/* Stepper Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            {WIZARD_STEPS.map((s) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'all var(--motion-standard)',
                  }}
                >
                  {/* Badge Morph: Blue circle -> Emerald check */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isCompleted
                        ? 'var(--color-success)'
                        : isActive
                        ? 'var(--color-primary)'
                        : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: isCompleted || isActive ? '#fff' : 'var(--text-dim)',
                      flexShrink: 0,
                      transition: 'all var(--motion-standard)',
                      boxShadow: isCompleted ? '0 0 8px rgba(16, 185, 129, 0.4)' : isActive ? '0 0 8px rgba(37, 99, 235, 0.4)' : 'none',
                    }}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : s.id}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#fff' : isCompleted ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {s.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware Tip Card */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-surface-1)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: '12px',
            lineHeight: '1.6',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontWeight: '600', marginBottom: '6px' }}>
            <span>💡</span>
            <span>HARDWARE TIP</span>
          </div>
          If auto-flashing times out or serial handshake rejects, hold down the physical <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>BOOT</code> button on your ESP32 board while clicking Flash.
        </div>
      </div>

      {/* ── Right Content Area: Active Step View ── */}
      <div
        className="interactive-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Error Banner */}
        {errorMsg && (
          <div
            className="banner-enter"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} color="#ef4444" />
            <div>
              <strong>Error:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Status Banner */}
        {(statusMsg || statusStage) && !errorMsg && (
          <div
            className="banner-enter"
            style={{
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              color: '#93c5fd',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '13px',
            }}
          >
            {statusStage && <div style={{ fontWeight: '600', marginBottom: statusMsg ? '4px' : 0 }}>{statusStage}</div>}
            {statusMsg && <div>{statusMsg}</div>}
          </div>
        )}

        {/* ── Step 1: Select ESP32 Port ── */}
        {step === 1 && (
          <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <Badge variant="neutral">STAGE 01</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>Select ESP32 Serial Interface</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Plug your ESP32 dev board into an available USB port. The device will be opened for flashing and telemetry.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                AVAILABLE SERIAL PORTS
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                }}
                value={selectedPortESP}
                onChange={e => setSelectedPortESP(e.target.value)}
              >
                {ports.map(p => (
                  <option key={p.device} value={p.device}>{p.device} ({p.hint})</option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              onClick={() => setStep(2)}
              disabled={!selectedPortESP}
            >
              <span>Next: Flash ESP32 Firmware</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* ── Step 2: Flash ESP32 Firmware ── */}
        {step === 2 && (
          <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <Badge variant="neutral">STAGE 02</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>Flash OneSensor Embedded Firmware</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Writes compiled PlatformIO binary onto ESP32 at port <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedPortESP}</code>.
              </p>
            </div>

            {/* Binary Info Box */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div>BINARY: <strong>esp32/firmware.bin</strong> (1.42 MB Merged)</div>
              <div>OFFSET: <strong>0x000000</strong></div>
              <div>SPEED: <strong>460,800 baud</strong></div>
            </div>

            {loading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span>{statusMsg || 'Flashing firmware…'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{smoothedFlashProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${smoothedFlashProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), #38bdf8)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button className="btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </button>
              <button className="btn-primary" onClick={handleStep2FlashESP} disabled={loading}>
                {loading ? <RefreshCw size={14} className="spin-icon" /> : <Cpu size={14} />}
                <span>{loading ? 'Flashing ESP32…' : 'Flash Firmware →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Wi-Fi Provisioning ── */}
        {step === 3 && (
          <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <Badge variant="neutral">STAGE 03</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>Configure Wireless Network</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Provide 2.4 GHz Wi-Fi credentials so the ESP32 can connect and host its WebSocket server.
              </p>
            </div>

            {/* Dual Method Selector */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setWifiMethod('build')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${wifiMethod === 'build' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: wifiMethod === 'build' ? 'rgba(37,99,235,0.15)' : 'rgba(0,0,0,0.2)',
                  color: wifiMethod === 'build' ? '#93c5fd' : 'var(--text-dim)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--motion-fast)',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '13px' }}>⚡ Build & Flash</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Embeds credentials into firmware image. Most reliable.</div>
              </button>

              <button
                type="button"
                onClick={() => setWifiMethod('serial')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${wifiMethod === 'serial' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: wifiMethod === 'serial' ? 'rgba(37,99,235,0.15)' : 'rgba(0,0,0,0.2)',
                  color: wifiMethod === 'serial' ? '#93c5fd' : 'var(--text-dim)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--motion-fast)',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '13px' }}>🔌 USB Serial</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Transmits over serial line. Fast ~15s.</div>
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  SSID (2.4 GHz ONLY)
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  placeholder="MyHomeNetwork"
                  value={ssid}
                  onChange={e => setSsid(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ width: '100%', padding: '9px 36px 9px 12px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  DEVICE HOSTNAME (mDNS)
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                  placeholder="onesensor"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button className="btn-secondary" onClick={() => setStep(2)} disabled={loading}>
                ← Back
              </button>
              <button className="btn-primary" onClick={handleStep3WiFi} disabled={loading}>
                {loading ? <RefreshCw size={14} className="spin-icon" /> : <Wifi size={14} />}
                <span>{loading ? 'Provisioning…' : 'Provision Wi-Fi →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Network & Endpoint Reveal ── */}
        {step === 4 && (
          <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <Badge variant="success" dot>CONNECTION ESTABLISHED</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>Network Link Confirmed!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                The ESP32 connected to your local network and initialized its WebSocket server.
              </p>
            </div>

            {/* Line-by-line staggered reveal */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
              }}
            >
              <div className="terminal-line" style={{ animationDelay: '0.1s' }}>
                🌐 <strong>IP ADDRESS:</strong> {connectedIP || '10.102.133.78'}
              </div>
              <div className="terminal-line" style={{ animationDelay: '0.2s' }}>
                📡 <strong>mDNS HOSTNAME:</strong> {deviceName}.local
              </div>
              <div className="terminal-line" style={{ animationDelay: '0.3s' }}>
                🔌 <strong>WEBSOCKET URI:</strong> ws://{connectedIP || `${deviceName}.local`}/ws
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              onClick={() => setStep(5)}
            >
              <span>Next: Arduino Setup (Optional)</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* ── Step 5: Arduino Setup ── */}
        {step === 5 && (
          <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <Badge variant="neutral">STAGE 05</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>Provision Arduino Receiver</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Program the receiver sketch and link physical channels to Arduino analog and timer pins.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                ARDUINO SERIAL PORT
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                }}
                value={selectedPortUno}
                onChange={e => setSelectedPortUno(e.target.value)}
              >
                {ports.map(p => (
                  <option key={p.device} value={p.device}>{p.device} ({p.hint})</option>
                ))}
              </select>
            </div>

            {/* Channel Provisioning List with tick-off animations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Provisioned Transducers:
              </span>
              {ARDUINO_CHANNELS.map((ch, idx) => {
                const isProvisioned = provisionedIndex >= idx;
                return (
                  <div
                    key={ch.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      border: isProvisioned ? '1px solid var(--color-success)' : '1px solid var(--border-subtle)',
                      transition: 'border-color var(--motion-fast)',
                    }}
                  >
                    <span>{ch.name} → <strong>Pin {ch.pin}</strong> ({ch.signal})</span>
                    {isProvisioned ? (
                      <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Ready
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Pending</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button className="btn-secondary" onClick={onFinishWizard} disabled={loading}>
                Skip to Dashboard
              </button>
              <button className="btn-primary" onClick={handleStep5Arduino} disabled={loading}>
                {loading ? <RefreshCw size={14} className="spin-icon" /> : <ShieldCheck size={14} />}
                <span>{loading ? 'Configuring…' : 'Complete Setup & Launch'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
