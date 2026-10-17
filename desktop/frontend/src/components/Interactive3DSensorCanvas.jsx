import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCcw, Maximize2, Compass } from 'lucide-react';
import {
  buildGasSensorModule,
  buildLightSensorModule,
  buildSoilMoistureModule,
  buildUltrasonicModule,
  buildSoundSensorModule,
  buildDHT11Module,
  buildMPU6050Module,
  buildUVModule,
} from './sensor3DModels';

/**
 * Interactive3DSensorCanvas
 * 
 * Provides:
 * - Real physical 3D sensor module built with Three.js
 * - Full 360° cursor orbit (pitch, yaw, tilt in all directions)
 * - Mouse wheel zoom to inspect pins, silkscreen, and connections
 * - Damping inertia & subtle idle floating
 * - Grounded dark pedestal with soft contact shadow
 * - Real-time dynamic response to sensor value changes
 */
export default function Interactive3DSensorCanvas({
  sensorKey = 'gas',
  value = 0,
  min = 0,
  max = 100,
  color = '#38bdf8',
  unit = '',
}) {
  const mountRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Orbit & Camera state ref
  const orbitRef = useRef({
    yaw: -0.55,          // Azimuth (radians)
    pitch: 0.42,         // Elevation (radians)
    dist: 5.2,           // Distance from center
    targetYaw: -0.55,
    targetPitch: 0.42,
    targetDist: 5.2,
    vx: 0,
    vy: 0,
    isInteracting: false,
    lastMouseX: 0,
    lastMouseY: 0,
    idleTime: 0,
  });

  // Scene references
  const sceneElementsRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    sensorGroup: null,
    modelHandle: null,
  });

  // Reset camera view
  const handleResetView = useCallback(() => {
    orbitRef.current.targetYaw = -0.55;
    orbitRef.current.targetPitch = 0.42;
    orbitRef.current.targetDist = 5.2;
    orbitRef.current.vx = 0;
    orbitRef.current.vy = 0;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 260;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.08);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Grounded Dark Pedestal & Shadow Pad
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -1.2;

    // Dark circular pedestal slab
    const slabGeo = new THREE.CylinderGeometry(2.4, 2.55, 0.18, 48);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x0c1220,
      roughness: 0.7,
      metalness: 0.25,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.receiveShadow = true;
    pedestalGroup.add(slab);

    // Subtle neon rim bevel ring on pedestal
    const ringGeo = new THREE.TorusGeometry(2.41, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.45,
    });
    const rimRing = new THREE.Mesh(ringGeo, ringMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.09;
    pedestalGroup.add(rimRing);

    // Contact shadow plane
    const shadowGeo = new THREE.CircleGeometry(2.6, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020408,
      transparent: true,
      opacity: 0.8,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.1;
    pedestalGroup.add(contactShadow);

    scene.add(pedestalGroup);

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.6);
    fillLight.position.set(-5, 2, -4);
    scene.add(fillLight);

    const underLight = new THREE.PointLight(new THREE.Color(color), 1.2, 5.0);
    underLight.position.set(0, -0.9, 0);
    scene.add(underLight);

    // 6. Build Physical Sensor Model
    let modelHandle = null;
    let sensorGroup = null;

    switch (sensorKey) {
      case 'temperature':
        modelHandle = buildDHT11Module(true, value, min, max);
        break;
      case 'humidity':
        modelHandle = buildDHT11Module(false, value, min, max);
        break;
      case 'gas':
        modelHandle = buildGasSensorModule('mq2', value, min, max);
        break;
      case 'co2':
        modelHandle = buildGasSensorModule('co2', value, min, max);
        break;
      case 'light':
        modelHandle = buildLightSensorModule(value, min, max);
        break;
      case 'soil':
        modelHandle = buildSoilMoistureModule(value, min, max);
        break;
      case 'proximity':
        modelHandle = buildUltrasonicModule(value, min, max);
        break;
      case 'sound':
        modelHandle = buildSoundSensorModule(value, min, max);
        break;
      case 'uv':
        modelHandle = buildUVModule(value, min, max);
        break;
      case 'motionX':
        modelHandle = buildMPU6050Module('X', value, min, max);
        break;
      case 'motionY':
        modelHandle = buildMPU6050Module('Y', value, min, max);
        break;
      case 'motionZ':
        modelHandle = buildMPU6050Module('Z', value, min, max);
        break;
      default:
        modelHandle = buildGasSensorModule('mq2', value, min, max);
        break;
    }

    sensorGroup = modelHandle.group;
    sensorGroup.position.set(0, -0.15, 0);
    scene.add(sensorGroup);

    sceneElementsRef.current = {
      scene,
      camera,
      renderer,
      sensorGroup,
      modelHandle,
      underLight,
      rimRing,
    };

    // 7. Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const orbit = orbitRef.current;

      // Inertia & Damping
      if (!orbit.isInteracting) {
        orbit.targetYaw += orbit.vx;
        orbit.targetPitch += orbit.vy;
        orbit.vx *= 0.92;
        orbit.vy *= 0.92;

        // Subtle idle floating breath
        orbit.idleTime += delta;
        const breathY = Math.sin(orbit.idleTime * 1.5) * 0.05;
        if (sensorGroup) {
          sensorGroup.position.y = -0.15 + breathY;
        }
      } else {
        orbit.idleTime = 0;
      }

      // Smooth interpolation
      orbit.yaw += (orbit.targetYaw - orbit.yaw) * 0.12;
      orbit.pitch += (orbit.targetPitch - orbit.pitch) * 0.12;
      orbit.dist += (orbit.targetDist - orbit.dist) * 0.12;

      // Clamp pitch to avoid full inversion
      orbit.pitch = Math.max(-1.4, Math.min(1.4, orbit.pitch));
      orbit.dist = Math.max(2.6, Math.min(8.5, orbit.dist));

      // Calculate camera position on sphere
      const cp = Math.cos(orbit.pitch);
      const sp = Math.sin(orbit.pitch);
      const cy = Math.cos(orbit.yaw);
      const sy = Math.sin(orbit.yaw);

      camera.position.x = orbit.dist * cp * sy;
      camera.position.y = orbit.dist * sp;
      camera.position.z = orbit.dist * cp * cy;
      camera.lookAt(0, 0, 0);

      // Model-specific micro-animations
      if (sensorKey === 'proximity' && modelHandle.wavesGroup) {
        const waveScale = 1.0 + Math.sin(time * 4) * 0.08;
        modelHandle.wavesGroup.scale.set(waveScale, waveScale, waveScale);
      } else if (sensorKey === 'sound' && modelHandle.waveRing) {
        const soundScale = 1.0 + Math.abs(Math.sin(time * 6)) * 0.25;
        modelHandle.waveRing.scale.set(soundScale, soundScale, soundScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [sensorKey]);

  // Update dynamic values (lights, glows, effects)
  useEffect(() => {
    const { modelHandle, underLight, rimRing } = sceneElementsRef.current;
    if (!modelHandle) return;

    const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

    // Dynamic light intensifies with sensor readings
    if (modelHandle.heaterLight) {
      modelHandle.heaterLight.intensity = 0.5 + normVal * 2.8;
    }
    if (modelHandle.sunLight) {
      modelHandle.sunLight.intensity = 0.6 + normVal * 3.8;
    }
    if (modelHandle.bioLight) {
      modelHandle.bioLight.intensity = 0.4 + normVal * 3.0;
    }
    if (modelHandle.radarLight) {
      modelHandle.radarLight.intensity = 0.6 + normVal * 2.5;
    }
    if (modelHandle.soundLight) {
      modelHandle.soundLight.intensity = 0.5 + normVal * 3.5;
    }
    if (modelHandle.auraLight) {
      modelHandle.auraLight.intensity = 0.6 + normVal * 2.8;
    }
    if (modelHandle.uvLight) {
      modelHandle.uvLight.intensity = 0.6 + normVal * 3.8;
    }

    if (underLight) {
      underLight.intensity = 0.8 + normVal * 1.5;
    }
  }, [value, min, max]);

  // Pointer Drag Handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const orbit = orbitRef.current;
    orbit.isInteracting = true;
    orbit.lastMouseX = e.clientX;
    orbit.lastMouseY = e.clientY;
    orbit.vx = 0;
    orbit.vy = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const orbit = orbitRef.current;
    if (!orbit.isInteracting) return;

    const dx = e.clientX - orbit.lastMouseX;
    const dy = e.clientY - orbit.lastMouseY;
    orbit.lastMouseX = e.clientX;
    orbit.lastMouseY = e.clientY;

    const rotSpeed = 0.0075;
    orbit.targetYaw += dx * rotSpeed;
    orbit.targetPitch -= dy * rotSpeed;

    orbit.vx = dx * rotSpeed * 0.35;
    orbit.vy = -dy * rotSpeed * 0.35;
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    orbitRef.current.isInteracting = false;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.0035;
    orbitRef.current.targetDist = Math.max(
      2.6,
      Math.min(8.5, orbitRef.current.targetDist + zoomDelta)
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '270px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 60%, rgba(18, 28, 48, 0.8) 0%, rgba(8, 12, 22, 0.95) 75%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleResetView}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Floating 3D Interaction Badge (Appears on hover) */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(10, 15, 26, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
          pointerEvents: 'none',
          opacity: isHovered || isDragging ? 1 : 0.45,
          transition: 'opacity var(--motion-fast)',
        }}
      >
        <Compass size={11} color={color} />
        <span>Drag to orbit 3D • Scroll to zoom</span>
      </div>

      {/* Reset Camera Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleResetView();
        }}
        title="Reset 3D View angle"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(15, 22, 38, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          opacity: isHovered ? 1 : 0.6,
          transition: 'all var(--motion-fast)',
          zIndex: 5,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }}
      >
        <RotateCcw size={13} />
      </button>

      {/* Subtle Connection Pin Highlight Pill */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
          }}
        />
        <span>{sensorKey === 'temperature' ? 'GLB MESH (temperature.glb) • 360°' : 'PCB v2.4 • 360° INSPECT'}</span>
      </div>
    </div>
  );
}
