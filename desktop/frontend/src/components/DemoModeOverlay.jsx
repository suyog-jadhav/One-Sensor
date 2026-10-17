import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, X, CheckCircle, AlertTriangle } from 'lucide-react';

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'System Online & Hardware Telemetry',
    desc: 'Verify ESP32 link, 12 active virtual transducers, and 10 Hz high-frequency telemetry.',
    targetTab: 'overview',
    actionText: 'Inspecting System Overview'
  },
  {
    step: 2,
    title: 'Live 12-Sensor Workstation Matrix',
    desc: 'Displaying complete sensor matrix with 2D instrumentation and actual hardware photos.',
    targetTab: 'live',
    actionText: 'Loading Sensor Wall'
  },
  {
    step: 3,
    title: 'Dynamic Sensor Telemetry Modulation',
    desc: 'Simulating physical temperature spike (24.8°C -> 38.5°C). Observer real-time response.',
    targetTab: 'live',
    actionText: 'Modulating Temperature Value',
    executeAction: (ctx) => {
      ctx.onSetValue('temperature', 38.5);
    }
  },
  {
    step: 4,
    title: 'Waveform Scenario Execution',
    desc: 'Activating automated sinusoidal heating cycle on Channel CH01.',
    targetTab: 'scenario',
    actionText: 'Running Scenario Generator'
  },
  {
    step: 5,
    title: 'Controlled Fault Injection (Fault Lab)',
    desc: 'Injecting a high-frequency transient spike fault into sensor telemetry.',
    targetTab: 'fault_inject',
    actionText: 'Injecting Transient Spike',
    executeAction: (ctx) => {
      ctx.onInjectFault('temperature', 'spike', 25, 3000);
    }
  },
  {
    step: 6,
    title: 'Real-Time Fault Detection & Logging',
    desc: 'Oscilloscope captures signal excursion. Anomaly logged in Event Timeline.',
    targetTab: 'fault_inject',
    actionText: 'Observing Signal Deviation'
  },
  {
    step: 7,
    title: 'Signal Recovery & Baseline Restoration',
    desc: 'Fault engine safely cleared. Transducer waveform returns to nominal baseline.',
    targetTab: 'fault_inject',
    actionText: 'Clearing Fault Engine',
    executeAction: (ctx) => {
      ctx.onClearFault('temperature');
      ctx.onSetValue('temperature', 25.0);
    }
  },
  {
    step: 8,
    title: 'ESP32 Pin Matrix & Hardware Mapping',
    desc: 'Direct GPIO pin-level validation connecting virtual model to real microcontrollers.',
    targetTab: 'config',
    actionText: 'Reviewing Hardware Configuration'
  }
];

export default function DemoModeOverlay({
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onExitDemo,
  onSelectTab,
  onSetValue,
  onInjectFault,
  onClearFault
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];

  useEffect(() => {
    // Navigate tab automatically
    if (currentStep.targetTab) {
      onSelectTab(currentStep.targetTab);
    }
    // Execute action if present
    if (currentStep.executeAction) {
      currentStep.executeAction({ onSetValue, onInjectFault, onClearFault });
    }
  }, [currentStepIndex]);

  // Auto-play timer (6 seconds per step if isPlaying)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (currentStepIndex < DEMO_STEPS.length - 1) {
        onNextStep();
      } else {
        setIsPlaying(false);
      }
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '48px',
      right: '24px',
      zIndex: 9999,
      width: '380px',
      backgroundColor: 'var(--bg-deep)',
      border: '1px solid var(--accent-amber)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(214, 168, 79, 0.25)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      animation: 'fadeIn 0.2s ease'
    }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--surface-raised)',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-amber)',
            boxShadow: '0 0 8px var(--accent-amber)'
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-amber)',
            letterSpacing: '0.06em'
          }}>
            JUDGE DEMO MODE
          </span>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            ({currentStepIndex + 1} / {DEMO_STEPS.length})
          </span>
        </div>

        <button
          onClick={onExitDemo}
          title="Exit Demo Mode"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px'
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Step Body */}
      <div style={{ padding: '14px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px'
        }}>
          {currentStep.title}
        </h4>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.45',
          marginBottom: '12px'
        }}>
          {currentStep.desc}
        </p>

        {/* Action badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-teal)',
          backgroundColor: 'var(--surface)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-soft)',
          marginBottom: '14px'
        }}>
          <CheckCircle size={11} color="var(--accent-teal)" />
          <span>{currentStep.actionText}</span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStepIndex + 1) / DEMO_STEPS.length) * 100}%`,
            backgroundColor: 'var(--accent-amber)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Controller buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-secondary"
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              <ChevronLeft size={13} />
              <span>Back</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {currentStepIndex < DEMO_STEPS.length - 1 ? (
              <button
                className="btn-primary"
                onClick={onNextStep}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={onExitDemo}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                <span>Finish</span>
                <CheckCircle size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
