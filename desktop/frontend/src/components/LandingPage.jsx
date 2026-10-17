import React, { useState, useEffect, useRef } from 'react';
import OneSensorLogo from './OneSensorLogo';
import {
  Activity,
  TrendingUp,
  ShieldOff,
  Cpu,
  Sliders,
  Terminal,
  ArrowRight,
  ChevronDown,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Compass,
  CheckCircle2,
  ArrowUp,
  Radio,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';

/**
 * State A: OneSensor Premium Engineering Landing Page
 * Completely separate from State B (Workbench).
 * Ends cleanly at the footer with zero dashboard leakage below it.
 */
export default function LandingPage({
  sensorState = {},
  isConnected = false,
  onEnterWorkbench,
  isTransitioning = false
}) {
  const [capabilitiesInView, setCapabilitiesInView] = useState(false);
  const [workflowInView, setWorkflowInView] = useState(false);
  const [ctaInView, setCtaInView] = useState(false);

  const capabilitiesRef = useRef(null);
  const workflowRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === capabilitiesRef.current) setCapabilitiesInView(true);
          if (entry.target === workflowRef.current) setWorkflowInView(true);
          if (entry.target === ctaRef.current) setCtaInView(true);
        }
      });
    }, observerOptions);

    if (capabilitiesRef.current) observer.observe(capabilitiesRef.current);
    if (workflowRef.current) observer.observe(workflowRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe live sensor readings directly bound to real telemetry
  const tempVal = sensorState.temperature !== undefined ? Number(sensorState.temperature).toFixed(1) : '24.8';
  const humidVal = sensorState.humidity !== undefined ? Number(sensorState.humidity).toFixed(1) : '52.0';
  const gasVal = sensorState.gas !== undefined ? Number(sensorState.gas).toFixed(0) : '280';
  const lightVal = sensorState.light !== undefined ? Number(sensorState.light).toFixed(0) : '620';
  const soilVal = sensorState.soil !== undefined ? Number(sensorState.soil).toFixed(1) : '42.0';
  const motionVal = sensorState.motionZ !== undefined ? Number(sensorState.motionZ).toFixed(2) : '0.98';

  const capabilities = [
    {
      id: '01',
      tab: 'live',
      category: 'LIVE TELEMETRY',
      featureTitle: 'Virtual Sensors',
      title: '12 configurable sensor channels',
      desc: 'Control values for temperature, humidity, gas concentration, ambient light, soil moisture, proximity, sound level, UV index, air quality, and three motion axes.',
      ctaText: 'Explore Live Sensors',
      icon: Activity,
      styleType: 'blue-accent',
      accentColor: '#4169F5'
    },
    {
      id: '02',
      tab: 'scenario',
      category: 'WAVEFORM SYNTHESIS',
      featureTitle: 'Signal Scenarios',
      title: 'Generate repeatable sensor behavior',
      desc: 'Configure sine, square, triangle, and ramp waveforms with adjustable baseline, amplitude, frequency, and duration.',
      ctaText: 'Explore Scenarios',
      icon: TrendingUp,
      styleType: 'violet-accent',
      accentColor: '#8975F5'
    },
    {
      id: '03',
      tab: 'fault_inject',
      category: 'CHAOS & DEGRADATION',
      featureTitle: 'Fault Injection',
      title: 'Test abnormal signal conditions',
      desc: 'Inject supported faults such as spikes, noise, dropouts, stuck values, drift, disconnection, and latency.',
      ctaText: 'Explore Fault Lab',
      icon: ShieldOff,
      styleType: 'red-accent',
      accentColor: '#DF4A55'
    },
    {
      id: '04',
      tab: 'hardware_3d',
      category: 'MICROCONTROLLER TOPOLOGY',
      featureTitle: 'ESP32 Hardware & 3D',
      title: 'Inspect the hardware model',
      desc: 'Explore the existing interactive 3D hardware viewer, GPIO allocation, and pin-level information.',
      ctaText: 'Inspect Hardware',
      icon: Cpu,
      styleType: 'cyan-accent',
      accentColor: '#11BCD2'
    },
    {
      id: '05',
      tab: 'config',
      category: 'SIGNAL ROUTING',
      featureTitle: 'Channel Configuration',
      title: 'Control sensor-to-pin mapping',
      desc: 'Configure channel activation, signal type, GPIO routing, frequency, range, and calibration settings supported by the existing implementation.',
      ctaText: 'Configure Channels',
      icon: Sliders,
      styleType: 'cyan-accent',
      accentColor: '#11BCD2'
    },
    {
      id: '06',
      tab: 'logs',
      category: 'COMMUNICATION LINK',
      featureTitle: 'Serial & Firmware Tools',
      title: 'Inspect device communication',
      desc: 'Access the existing serial telemetry tools, device setup flow, and firmware utilities.',
      ctaText: 'Explore Device Tools',
      icon: Terminal,
      styleType: 'muted-violet-accent',
      accentColor: '#8975F5'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Configure',
      desc: 'Select sensor channels, choose signal types, assign GPIO mappings, and adjust supported calibration settings.',
      icon: Sliders,
      tag: 'PIN MAPPING & CALIBRATION',
      color: '#4169F5',
      accentClass: 'step-blue'
    },
    {
      num: '02',
      title: 'Simulate',
      desc: 'Change virtual readings, synthesize waveforms, run scenarios, and inject controlled faults.',
      icon: Activity,
      tag: 'DYNAMIC SYNTHESIS',
      color: '#11BCD2',
      accentClass: 'step-cyan'
    },
    {
      num: '03',
      title: 'Validate',
      desc: 'Inspect telemetry, waveform behavior, fault events, hardware information, and available serial output.',
      icon: CheckCircle2,
      tag: 'TELEMETRY & LOGGING',
      color: '#8975F5',
      accentClass: 'step-violet'
    }
  ];

  return (
    <div className="landing-page-root" id="landing-root">
      {/* ── 1. Minimal Header & Brand ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand-col">
            <OneSensorLogo height={42} variant="horizontal" theme="light" />
            <span className="landing-brand-badge">Virtual Sensor Workbench</span>
          </div>

          <nav className="landing-header-nav" aria-label="Landing Links">
            <button className="landing-nav-item" onClick={() => scrollToSection('landing-hero')}>
              Overview
            </button>
            <button className="landing-nav-item" onClick={() => scrollToSection('capabilities')}>
              Capabilities
            </button>
            <button className="landing-nav-item" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
          </nav>

          <div className="landing-header-actions">
            <button
              className="btn-header-workbench"
              onClick={() => onEnterWorkbench('overview')}
              disabled={isTransitioning}
              title="Open full OneSensor virtual sensor workbench"
            >
              <span>Open Workbench</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section: Rich Technical Identity ── */}
      <section className="landing-hero-block" id="landing-hero">
        {/* Subtle Ambient Radial Lighting & Grid Overlay */}
        <div className="hero-grid-pattern" />
        <div className="hero-radial-glow glow-cyan" />
        <div className="hero-radial-glow glow-blue" />

        <div className="landing-hero-wrapper">
          {/* Left Column: Product Positioning & Value Prop */}
          <div className="landing-hero-left">
            <div className="hero-eyebrow-pill">
              <span className="eyebrow-beacon" />
              <span>VIRTUAL SENSOR WORKBENCH</span>
            </div>

            <h1 className="hero-main-heading">
              One platform.<br />
              Multiple sensors.<br />
              <span className="hero-heading-highlight">Complete control.</span>
            </h1>

            <p className="hero-copy-text">
              <span className="copy-hl hl-blue">Simulate sensor inputs</span>,{' '}
              <span className="copy-hl hl-violet">configure ESP32 routing</span>, generate repeatable signal scenarios, and{' '}
              <span className="copy-hl hl-cyan">test fault conditions</span> — all from one engineering workbench.
            </p>

            <div className="hero-buttons-group">
              <button
                className="btn-primary-action"
                onClick={() => onEnterWorkbench('overview')}
                disabled={isTransitioning}
              >
                <span>Open Workbench</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="btn-secondary-action"
                onClick={() => scrollToSection('capabilities')}
              >
                <span>Explore Capabilities</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Three Compact Engineering Facts */}
            <div className="hero-facts-row">
              <div className="fact-box">
                <span className="fact-num mono">12</span>
                <span className="fact-lbl">Configured sensor channels</span>
              </div>
              <div className="fact-separator" />
              <div className="fact-box">
                <span className="fact-num mono">7</span>
                <span className="fact-lbl">Supported fault models</span>
              </div>
              <div className="fact-separator" />
              <div className="fact-box">
                <span className="fact-num mono">3D</span>
                <span className="fact-lbl">ESP32 hardware inspector</span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Virtual Sensor Network Visualization */}
          <div className="landing-hero-right">
            <div className="hero-visual-container">
              {/* Card Terminal Header */}
              <div className="visual-top-strip">
                <div className="visual-status-indicator">
                  <span className={`beacon-dot ${isConnected ? 'live' : 'sim'}`} />
                  <span className="beacon-text mono">
                    {isConnected ? 'ESP32 LINK ACTIVE' : 'VIRTUAL TRANSDUCER HUB'}
                  </span>
                </div>
                <span className="visual-meta-chip mono">12 CHANNELS ROUTED</span>
              </div>

              {/* Sensor Hub Visual Canvas */}
              <div className="visual-stage-canvas">
                {/* Center Virtual Hub Core */}
                <div
                  className="central-hub-circle"
                  onClick={() => onEnterWorkbench('overview')}
                  title="Click to enter Workbench Overview"
                >
                  <div className="hub-ripple-glow" />
                  <div className="hub-core-halo" />
                  <OneSensorLogo height={28} variant="mark" />
                  <span className="hub-title-mono mono">VIRTUAL HUB</span>
                  <span className="hub-rate-mono mono">120 FPS STREAM</span>
                </div>

                {/* Satellite Connected Sensor Nodes */}
                <div className="satellites-container">
                  <div
                    className="sat-card sat-top-left"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Temperature (CH01)"
                  >
                    <div className="sat-icon-circle danger">
                      <Thermometer size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Temperature</span>
                      <span className="sat-reading mono">{tempVal} °C</span>
                    </div>
                  </div>

                  <div
                    className="sat-card sat-top-right"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Humidity (CH02)"
                  >
                    <div className="sat-icon-circle cyan">
                      <Droplets size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Humidity</span>
                      <span className="sat-reading mono">{humidVal} %RH</span>
                    </div>
                  </div>

                  <div
                    className="sat-card sat-mid-left"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Gas Concentration (CH03)"
                  >
                    <div className="sat-icon-circle violet">
                      <Wind size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Gas Index</span>
                      <span className="sat-reading mono">{gasVal} ppm</span>
                    </div>
                  </div>

                  <div
                    className="sat-card sat-mid-right"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Ambient Light (CH04)"
                  >
                    <div className="sat-icon-circle amber">
                      <Sun size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Ambient Light</span>
                      <span className="sat-reading mono">{lightVal} lux</span>
                    </div>
                  </div>

                  <div
                    className="sat-card sat-bot-left"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Soil Moisture (CH05)"
                  >
                    <div className="sat-icon-circle green">
                      <Layers size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Soil Moisture</span>
                      <span className="sat-reading mono">{soilVal} %</span>
                    </div>
                  </div>

                  <div
                    className="sat-card sat-bot-right"
                    onClick={() => onEnterWorkbench('live')}
                    title="Inspect Inertial Motion (CH12)"
                  >
                    <div className="sat-icon-circle blue">
                      <Compass size={14} />
                    </div>
                    <div className="sat-text-group">
                      <span className="sat-label">Motion Z-Axis</span>
                      <span className="sat-reading mono">{motionVal} g</span>
                    </div>
                  </div>
                </div>

                {/* Animated SVG Circuit Bus Overlay with Signal Pulses */}
                <svg className="hub-circuit-traces" viewBox="0 0 520 340" fill="none">
                  <defs>
                    <linearGradient id="traceGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4169F5" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#11BCD2" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="traceGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#11BCD2" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#4169F5" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Base circuit traces */}
                  <path id="path-top-left" d="M 260 170 L 105 70" stroke="rgba(65, 105, 245, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path id="path-top-right" d="M 260 170 L 415 70" stroke="rgba(17, 188, 210, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path id="path-mid-left" d="M 260 170 L 95 170" stroke="rgba(137, 117, 245, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path id="path-mid-right" d="M 260 170 L 425 170" stroke="rgba(217, 145, 39, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path id="path-bot-left" d="M 260 170 L 105 270" stroke="rgba(21, 154, 117, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path id="path-bot-right" d="M 260 170 L 415 270" stroke="rgba(65, 105, 245, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Flowing animated signal packets */}
                  <circle className="signal-pulse pulse-1" r="3.5" fill="#4169F5">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path="M 260 170 L 105 70" />
                  </circle>
                  <circle className="signal-pulse pulse-2" r="3.5" fill="#11BCD2">
                    <animateMotion dur="2.8s" repeatCount="indefinite" path="M 260 170 L 415 70" />
                  </circle>
                  <circle className="signal-pulse pulse-3" r="3.5" fill="#8975F5">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 260 170 L 95 170" />
                  </circle>
                  <circle className="signal-pulse pulse-4" r="3.5" fill="#D99127">
                    <animateMotion dur="3.0s" repeatCount="indefinite" path="M 260 170 L 425 170" />
                  </circle>
                  <circle className="signal-pulse pulse-5" r="3.5" fill="#159A75">
                    <animateMotion dur="2.6s" repeatCount="indefinite" path="M 260 170 L 105 270" />
                  </circle>
                  <circle className="signal-pulse pulse-6" r="3.5" fill="#4169F5">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 260 170 L 415 270" />
                  </circle>
                </svg>
              </div>

              {/* Bottom Card Strip */}
              <div className="visual-bottom-strip">
                <span className="visual-footer-note">Simulated transducer telemetry & routing bus</span>
                <button
                  className="visual-launch-link"
                  onClick={() => onEnterWorkbench('overview')}
                >
                  <span>Launch Live Matrix</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Capabilities Section: Dark Slate Section with Distinct Accent Cards ── */}
      <section
        className={`landing-capabilities-section ${capabilitiesInView ? 'in-view' : ''}`}
        id="capabilities"
        ref={capabilitiesRef}
      >
        <div className="capabilities-inner">
          <div className="section-title-wrapper dark-theme">
            <span className="section-pre-eyebrow">BUILT FOR EMBEDDED ENGINEERING</span>
            <h2 className="section-main-title">A complete virtual sensor testing toolkit</h2>
            <p className="section-main-copy">
              Configure sensor channels, generate predictable signal behavior, inspect hardware routing, and validate fault responses from one workbench.
            </p>
          </div>

          <div className="capabilities-feature-grid">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className={`feature-card card-${cap.styleType}`}
                  style={{ '--stagger-delay': `${idx * 0.08}s` }}
                  onClick={() => onEnterWorkbench(cap.tab)}
                  title={`Open ${cap.featureTitle} in Workbench`}
                >
                  <div className="feature-top-accent-bar" style={{ backgroundColor: cap.accentColor }} />
                  
                  <div className="feature-card-header">
                    <span className="feature-num-badge mono">{cap.id}</span>
                    <span className="feature-category-tag mono">{cap.category}</span>
                    <div className="feature-icon-bubble" style={{ color: cap.accentColor }}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="feature-card-body">
                    <span className="feature-subheading" style={{ color: cap.accentColor }}>{cap.featureTitle}</span>
                    <h3 className="feature-headline">{cap.title}</h3>
                    <p className="feature-description">{cap.desc}</p>
                  </div>

                  <div className="feature-card-footer">
                    <span className="feature-cta-label">
                      <span>{cap.ctaText}</span>
                      <ArrowRight size={14} className="cta-arrow-shift" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. How It Works: Connected Engineering Timeline (Cool Grey Canvas) ── */}
      <section
        className={`landing-workflow-section ${workflowInView ? 'in-view' : ''}`}
        id="how-it-works"
        ref={workflowRef}
      >
        <div className="workflow-inner">
          <div className="section-title-wrapper">
            <span className="section-pre-eyebrow">SIMPLE THREE-STEP WORKFLOW</span>
            <h2 className="section-main-title">From configuration to validation</h2>
            <p className="section-main-copy">
              Move from sensor mapping to controlled simulation and inspect the resulting system behavior.
            </p>
          </div>

          <div className="workflow-timeline-track">
            {/* Desktop Connected Signal Bus Line */}
            <div className="workflow-timeline-bus" />

            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className={`workflow-step-card ${st.accentClass}`}
                  style={{ '--step-delay': `${i * 0.15}s` }}
                >
                  <div className="step-header-row">
                    <div className="step-pill-indicator mono" style={{ borderColor: st.color, color: st.color }}>
                      <span className="step-badge-dot" style={{ backgroundColor: st.color }} />
                      <span>STEP {st.num}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="step-connector-arrow">
                        <ArrowRight size={14} color={st.color} />
                      </div>
                    )}
                  </div>

                  <div className="step-icon-container" style={{ color: st.color, backgroundColor: `${st.color}15` }}>
                    <Icon size={22} />
                  </div>

                  <span className="step-tag-pill mono">{st.tag}</span>
                  <h3 className="step-title">{st.title}</h3>
                  <p className="step-description">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Final Landing Section: The Definite Deep-Navy Ending ── */}
      <section
        className={`landing-final-entry-section ${ctaInView ? 'in-view' : ''}`}
        ref={ctaRef}
      >
        <div className="final-entry-backdrop-grid" />
        <div className="final-entry-radial-glow" />

        <div className="final-entry-content-box">
          <div className="final-entry-network-icon">
            <OneSensorLogo height={36} variant="mark" />
          </div>

          <span className="final-entry-eyebrow mono">READY TO COMMENCE TESTING</span>
          <h2 className="final-entry-headline">Ready to build. Simulate. Validate.</h2>
          <p className="final-entry-copy">
            Enter the virtual sensor workbench to configure channels, simulate sensor behavior, explore hardware routing, and test system responses.
          </p>

          <div className="final-entry-actions">
            <button
              className="btn-final-enter"
              onClick={() => onEnterWorkbench('overview')}
              disabled={isTransitioning}
            >
              <span>Enter Workbench</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <button className="btn-back-to-top" onClick={scrollToTop}>
            <ArrowUp size={13} />
            <span>Back to top ↑</span>
          </button>
        </div>
      </section>

      {/* ── 6. Compact Landing Footer (True End of Landing Experience) ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-left">
            <OneSensorLogo height={36} variant="horizontal" theme="dark" />
            <span className="landing-footer-sub">Virtual Sensor Workbench</span>
            <p className="landing-footer-desc">
              Precision multi-channel virtual sensor simulation, ESP32 hardware mapping, and fault injection for embedded firmware development.
            </p>
          </div>

          <div className="landing-footer-links">
            <button className="footer-link-btn" onClick={() => scrollToSection('landing-hero')}>
              Overview
            </button>
            <button className="footer-link-btn" onClick={() => scrollToSection('capabilities')}>
              Capabilities
            </button>
            <button className="footer-link-btn" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
            <button
              className="footer-link-btn highlight"
              onClick={() => onEnterWorkbench('overview')}
            >
              Launch Workbench
            </button>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>OneSensor Virtual Sensor Workbench © 2026. Production Embedded IoT Platform.</span>
        </div>
      </footer>
    </div>
  );
}
