import React from 'react';
import { Text } from '@react-three/drei';

export const ESP32_PIN_COORDS = {
  'GPIO 25': [-2.8, 0.25, 0.45],  // DAC1
  'GPIO 26': [-2.8, 0.25, 0.15],  // DAC2
  'GPIO 18': [-2.8, 0.25, -0.45], // Gas PWM
  'GPIO 19': [-2.8, 0.25, -0.75], // Light PWM
  'GPIO 21': [-2.8, 0.25, -1.05], // Soil PWM
  'GND':     [-2.8, 0.25, 1.05]   // Ground
};

export default function Esp32Board({ position = [-3.8, 0, 0] }) {
  return (
    <group position={position}>
      {/* Main PCB (Matte Black/Dark Slate) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 0.12, 5.2]} />
        <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Gold Edge contacts / mount holes */}
      {[-1.2, 1.2].map((x, i) => (
        <React.Fragment key={i}>
          <mesh position={[x, 0.07, -2.4]}>
            <cylinderGeometry args={[0.08, 0.08, 0.14, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[x, 0.07, 2.4]}>
            <cylinderGeometry args={[0.08, 0.08, 0.14, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Metal RF Shield Can (ESP-WROOM-32) */}
      <mesh position={[0, 0.18, -0.8]}>
        <boxGeometry args={[1.9, 0.22, 2.2]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Antenna pattern on top of RF shield */}
      <mesh position={[0, 0.12, -2.1]}>
        <boxGeometry args={[1.8, 0.08, 0.6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Micro USB Port */}
      <mesh position={[0, 0.15, 2.5]}>
        <boxGeometry args={[0.8, 0.22, 0.5]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Push Buttons (EN / BOOT) */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 0.12, 2.1]}>
          <mesh>
            <boxGeometry args={[0.3, 0.12, 0.3]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Dual Header pin strips (Left & Right) */}
      {[-1.15, 1.15].map((x, sideIdx) => (
        <group key={sideIdx} position={[x, 0.14, 0]}>
          {/* Black plastic socket */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.26, 0.24, 4.6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Pin holes */}
          {Array.from({ length: 15 }).map((_, pIdx) => (
            <mesh key={pIdx} position={[0, 0.13, -2.1 + pIdx * 0.3]}>
              <boxGeometry args={[0.1, 0.02, 0.1]} />
              <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Board Silk-screen Labels */}
      <Text
        position={[0, 0.3, -0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
      >
        ESP32-WROOM
      </Text>

      <Text
        position={[0, 0.1, 1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        OneSensor Signal Gen
      </Text>
    </group>
  );
}
