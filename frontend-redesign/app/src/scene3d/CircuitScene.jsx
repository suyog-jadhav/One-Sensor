import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import Esp32Board, { ESP32_PIN_COORDS } from './Esp32Board';
import ArduinoBoard, { ARDUINO_PIN_COORDS } from './ArduinoBoard';
import JumperWire from './JumperWire';
import { SENSORS, GROUND_WIRE } from '../utils/constants';
import { Camera, Compass, RefreshCw, Layers } from 'lucide-react';

export default function CircuitScene() {
  const controlsRef = useRef();

  const setCameraPreset = (position, target = [0, 0, 0]) => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(...position);
    controlsRef.current.target.set(...target);
    controlsRef.current.update();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px' }}>
      {/* 3D Scene Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          display: 'flex',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '6px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <button
          onClick={() => setCameraPreset([0, 10, 8])}
          title="Isometric Hero Angle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <Compass size={13} />
          Isometric
        </button>

        <button
          onClick={() => setCameraPreset([0, 14, 0.01])}
          title="Top-Down Wiring Diagram"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <Layers size={13} />
          Top-Down
        </button>

        <button
          onClick={() => setCameraPreset([0, 2.5, 11])}
          title="Front Profile View"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <Camera size={13} />
          Front
        </button>

        <button
          onClick={() => setCameraPreset([0, 9, 8])}
          title="Reset Camera Angle"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Wire Color Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        {SENSORS.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{s.name}</span>
            <span className="mono-tag" style={{ color: 'var(--text-muted)' }}>({s.signal})</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GROUND_WIRE.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>Common GND</span>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 9, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.6} color="#6366f1" />
        <pointLight position={[0, 4, 0]} intensity={0.8} color="#38bdf8" />

        {/* Workbench Grid plane */}
        <Grid
          position={[0, -0.06, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={2.0}
          sectionThickness={1.0}
          sectionColor="#475569"
          fadeDistance={18}
        />

        {/* 3D Hardware Boards */}
        <Esp32Board position={[-3.6, 0, 0]} />
        <ArduinoBoard position={[3.6, 0, 0]} />

        {/* 3D Signal Wires */}
        {SENSORS.map(s => (
          <JumperWire
            key={s.id}
            sensor={s}
            startPos={ESP32_PIN_COORDS[s.espPin] || [-2.8, 0.25, 0]}
            endPos={ARDUINO_PIN_COORDS[s.arduinoPin] || [2.4, 0.25, 0]}
            isGround={false}
          />
        ))}

        {/* Common Ground Wire */}
        <JumperWire
          sensor={null}
          startPos={ESP32_PIN_COORDS['GND']}
          endPos={ARDUINO_PIN_COORDS['GND']}
          isGround={true}
        />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={4}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going beneath workbench
        />
      </Canvas>
    </div>
  );
}
