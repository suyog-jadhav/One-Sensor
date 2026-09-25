import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSensors } from '../context/SensorContext';

export default function JumperWire({
  sensor,
  startPos,
  endPos,
  isGround = false
}) {
  const {
    sensorValues,
    hoveredSensor,
    setHoveredSensor,
    selectedSensor,
    setSelectedSensor
  } = useSensors();

  const meshRef = useRef();
  const materialRef = useRef();

  const isTargetHovered = !isGround && hoveredSensor === sensor?.id;
  const isTargetSelected = !isGround && selectedSensor === sensor?.id;
  const isActive = isTargetHovered || isTargetSelected;

  // Calculate arched 3D curve between ESP32 and Arduino pins
  const curve = useMemo(() => {
    const p1 = new THREE.Vector3(...startPos);
    const p2 = new THREE.Vector3(...endPos);
    
    // Calculate arched midpoint elevated in Y
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    const dist = p1.distanceTo(p2);
    const archHeight = Math.max(1.2, dist * 0.35);
    const mid = new THREE.Vector3(midX, p1.y + archHeight, midZ);

    return new THREE.QuadraticBezierCurve3(p1, mid, p2);
  }, [startPos, endPos]);

  // Generate tube geometry along curve
  const tubeGeometry = useMemo(() => {
    const radius = isActive ? 0.065 : (isGround ? 0.045 : 0.05);
    return new THREE.TubeGeometry(curve, 48, radius, 12, false);
  }, [curve, isActive, isGround]);

  // Read current value and calculate duty cycle or voltage
  const currentVal = !isGround && sensor ? (sensorValues[sensor.key] || sensor.defaultVal) : 0;
  const pct = !isGround && sensor
    ? Math.max(0, Math.min(100, ((currentVal - sensor.min) / (sensor.max - sensor.min || 1)) * 100))
    : 0;

  // Live signal animation along the wire
  useFrame((state, delta) => {
    if (!materialRef.current) return;

    if (isGround) {
      materialRef.current.emissiveIntensity = 0.1;
      return;
    }

    if (sensor.signal === 'DAC') {
      // Steady analog glow proportional to voltage
      const voltageRatio = pct / 100;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        0.35 + voltageRatio * 0.9 + (isActive ? 0.6 : 0),
        0.1
      );
    } else {
      // PWM pulsing glow matching duty cycle and simulation clock
      const pulseSpeed = 12.0; // high-speed visual pulsation
      const wave = Math.sin(state.clock.elapsedTime * pulseSpeed);
      const dutyThreshold = (pct / 100) * 2 - 1; // Map 0..100% to -1..1
      const isHigh = wave < dutyThreshold;

      const targetIntensity = isHigh ? (0.8 + (isActive ? 0.7 : 0)) : 0.15;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetIntensity,
        0.2
      );
    }
  });

  const wireColor = isGround ? '#4b5563' : sensor.color;
  const emissiveColor = isGround ? '#111827' : sensor.color;

  return (
    <group>
      {/* 3D Wire Tube */}
      <mesh
        ref={meshRef}
        geometry={tubeGeometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isGround && sensor) setHoveredSensor(sensor.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (!isGround) setHoveredSensor(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isGround && sensor) {
            setSelectedSensor(selectedSensor === sensor.id ? null : sensor.id);
          }
        }}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={wireColor}
          emissive={emissiveColor}
          emissiveIntensity={isActive ? 1.0 : 0.4}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Floating Interactive Label at curve peak */}
      {isActive && (
        <Html position={[curve.getPoint(0.5).x, curve.getPoint(0.5).y + 0.35, curve.getPoint(0.5).z]} center>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${wireColor}`,
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
              boxShadow: `0 0 12px ${sensor.glowColor}`,
              pointerEvents: 'none'
            }}
          >
            <strong>{sensor.name}</strong>: {currentVal.toFixed(1)} {sensor.unit} ({sensor.signal})
          </div>
        </Html>
      )}
    </group>
  );
}
