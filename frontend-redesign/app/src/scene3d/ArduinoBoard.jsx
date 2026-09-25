import React from 'react';
import { Text } from '@react-three/drei';

export const ARDUINO_PIN_COORDS = {
  'A0':  [2.4, 0.25, 1.2],   // Temperature DAC
  'A1':  [2.4, 0.25, 0.9],   // Humidity DAC
  'D4':  [2.4, 0.25, -0.6],  // Gas PWM
  'D5':  [2.4, 0.25, -0.9],  // Light PWM
  'D6':  [2.4, 0.25, -1.2],  // Soil PWM
  'GND': [2.4, 0.25, 0.3]    // Ground (power header)
};

export default function ArduinoBoard({ position = [3.8, 0, 0] }) {
  return (
    <group position={position}>
      {/* Main PCB (Arduino Teal / Deep Cyan) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.4, 0.12, 5.6]} />
        <meshStandardMaterial color="#00878f" roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Silver USB Type-B Connector */}
      <mesh position={[-1.4, 0.45, -2.4]}>
        <boxGeometry args={[1.2, 0.8, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* DC Barrel Jack */}
      <mesh position={[1.2, 0.4, -2.4]}>
        <boxGeometry args={[1.0, 0.7, 1.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* ATmega328P DIP IC Package */}
      <mesh position={[0.4, 0.15, 0.5]}>
        <boxGeometry args={[1.0, 0.22, 2.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* 16MHz Crystal Oscillator */}
      <mesh position={[-0.8, 0.15, -0.8]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Reset Tactile Button */}
      <group position={[-1.7, 0.18, -1.3]}>
        <mesh>
          <boxGeometry args={[0.4, 0.16, 0.4]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Digital Pin Headers (Left Side from facing) */}
      <group position={[-1.4, 0.16, 0.8]}>
        <mesh>
          <boxGeometry args={[0.26, 0.24, 3.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
      </group>

      {/* Analog & Power Pin Headers (Right Side / Inwards) */}
      <group position={[-1.4, 0.16, -0.8]}>
        <mesh>
          <boxGeometry args={[0.26, 0.24, 2.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
      </group>

      {/* Front Pin Headers (facing ESP32) */}
      <group position={[-1.85, 0.16, 0.6]}>
        <mesh>
          <boxGeometry args={[0.26, 0.24, 3.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
      </group>

      {/* Arduino Silk Screen Branding */}
      <Text
        position={[0.2, 0.08, -1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ARDUINO UNO
      </Text>

      <Text
        position={[0.2, 0.08, -0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#e0f2fe"
        anchorX="center"
        anchorY="middle"
      >
        System Under Test (SUT)
      </Text>
    </group>
  );
}
