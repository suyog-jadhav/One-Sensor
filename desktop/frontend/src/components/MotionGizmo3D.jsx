import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RotateCw, Compass, Play, Pause } from 'lucide-react';

// ─── 3D Vector & Matrix Math Utilities ─────────────────────────────────────────
const V3 = {
  create: (x = 0, y = 0, z = 0) => [x, y, z],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (v, s) => [v[0] * s, v[1] * s, v[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]),
  rotX: (v, rad) => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  },
  rotY: (v, rad) => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  },
  rotZ: (v, rad) => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  },
};

// ─── Preset Orientations ───────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Level Flat', icon: '📐', x: 0, y: 0, z: 1.0, desc: 'Resting flat on workbench' },
  { label: 'Inverted', icon: '🔄', x: 0, y: 0, z: -1.0, desc: 'Upside down (180°)' },
  { label: 'Pitch +45°', icon: '↗️', x: 0, y: 0.707, z: 0.707, desc: 'Nose pitched upwards' },
  { label: 'Roll +45°', icon: '↘️', x: 0.707, y: 0, z: 0.707, desc: 'Tilted rightwards' },
  { label: 'Portrait', icon: '📱', x: 0, y: 1.0, z: 0, desc: 'Standing vertical' },
  { label: 'Zero-G (0g)', icon: '🪂', x: 0, y: 0, z: 0, desc: 'Freefall simulation' },
  { label: 'High-G Shock', icon: '🚀', x: 1.4, y: 1.4, z: 1.4, desc: 'Extreme acceleration' },
];

export default function MotionGizmo3D({ accelX = 0, accelY = 0, accelZ = 1, onSetMotion }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Display options
  const [modelMode, setModelMode] = useState('gimbal'); // 'gimbal' | 'pcb'
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotorRpm] = useState(3600);

  // Camera Orbit angles (Spherical coordinates)
  const cameraRef = useRef({
    yaw: -0.65,      // azimuth around Y
    pitch: 0.42,     // elevation from X-Z plane
    dist: 340,       // camera distance
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  // Inertial sensor angles smoothing
  const sensorAnglesRef = useRef({ pitch: 0, roll: 0, yaw: 0 });
  const spinAngleRef = useRef(0);
  const animFrameRef = useRef(null);

  // Calculate telemetry angles from g values
  const telemetry = useMemo(() => {
    const ax = Number(accelX) || 0;
    const ay = Number(accelY) || 0;
    const az = Number(accelZ) || 0;
    const gMag = Math.sqrt(ax * ax + ay * ay + az * az);

    // Roll (rotation around X) and Pitch (rotation around Y)
    const pitchRad = Math.atan2(ay, Math.sqrt(ax * ax + az * az));
    const rollRad = Math.atan2(-ax, az === 0 ? 0.0001 : az);
    const pitchDeg = (pitchRad * (180 / Math.PI)).toFixed(1);
    const rollDeg = (rollRad * (180 / Math.PI)).toFixed(1);

    let stateTag = 'STABLE LEVEL';
    let tagColor = '#10b981';
    if (gMag < 0.25) {
      stateTag = 'FREE FALL (0G)';
      tagColor = '#38bdf8';
    } else if (gMag > 1.6) {
      stateTag = 'HIGH-G ACCEL';
      tagColor = '#ef4444';
    } else if (az < -0.6) {
      stateTag = 'INVERTED (180°)';
      tagColor = '#f59e0b';
    } else if (Math.abs(pitchRad) > 0.45 || Math.abs(rollRad) > 0.45) {
      stateTag = 'TILTED ORIENTATION';
      tagColor = '#8b5cf6';
    }

    return {
      pitchDeg: Number(pitchDeg),
      rollDeg: Number(rollDeg),
      pitchRad,
      rollRad,
      gMag: gMag.toFixed(2),
      stateTag,
      tagColor,
    };
  }, [accelX, accelY, accelZ]);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let lastTime = performance.now();

    const render = (time) => {
      if (!running) return;
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle auto precession or wobble
      if (autoRotate && onSetMotion) {
        const t = time * 0.0012;
        const autoX = Number((Math.sin(t) * 0.85).toFixed(2));
        const autoY = Number((Math.cos(t * 0.8) * 0.75).toFixed(2));
        const autoZ = Number((Math.sqrt(Math.max(0, 1.2 - autoX * autoX * 0.5 - autoY * autoY * 0.5))).toFixed(2));
        onSetMotion(autoX, autoY, autoZ);
      }

      spinAngleRef.current += (rotorRpm / 60) * Math.PI * 2 * dt;

      // Smooth interpolation of sensor pitch & roll
      const targetPitch = telemetry.pitchRad;
      const targetRoll = telemetry.rollRad;
      sensorAnglesRef.current.pitch += (targetPitch - sensorAnglesRef.current.pitch) * 0.14;
      sensorAnglesRef.current.roll += (targetRoll - sensorAnglesRef.current.roll) * 0.14;

      const pPitch = sensorAnglesRef.current.pitch;
      const pRoll = sensorAnglesRef.current.roll;

      // Resize canvas to match display size
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Camera parameters
      const cam = cameraRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const fov = 420;

      const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw);
      const cosP = Math.cos(cam.pitch), sinP = Math.sin(cam.pitch);

      // 3D Point to Screen projection
      const project = (p3) => {
        let x1 = p3[0] * cosY - p3[2] * sinY;
        let y1 = p3[1];
        let z1 = p3[0] * sinY + p3[2] * cosY;

        let x2 = x1;
        let y2 = y1 * cosP - z1 * sinP;
        let z2 = y1 * sinP + z1 * cosP + cam.dist;

        if (z2 < 10) z2 = 10;
        const scale = fov / z2;
        return {
          x: cx + x2 * scale,
          y: cy - y2 * scale,
          z: z2,
          scale,
        };
      };

      // ─── 1. Background Ambience ───────────────────────────────────────────
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.65);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#05070d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Perspective 3D Floor Grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        const gridSize = 180;
        const gridStep = 30;
        const floorY = -90;

        for (let i = -gridSize; i <= gridSize; i += gridStep) {
          const pA = project([i, floorY, -gridSize]);
          const pB = project([i, floorY, gridSize]);
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.stroke();

          const pC = project([-gridSize, floorY, i]);
          const pD = project([gridSize, floorY, i]);
          ctx.beginPath();
          ctx.moveTo(pC.x, pC.y);
          ctx.lineTo(pD.x, pD.y);
          ctx.stroke();
        }
      }

      // Artificial Horizon & Pitch Ladder Line
      if (showHorizon) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-pRoll);
        const pitchOffset = -pPitch * 80;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(-110, pitchOffset);
        ctx.lineTo(110, pitchOffset);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center crosshair reticle
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, 0); ctx.lineTo(-8, 0);
        ctx.moveTo(8, 0); ctx.lineTo(24, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ─── 2. Local Sensor Frame Transform ──────────────────────────────────
      const toWorld = (localPt) => {
        let p = V3.rotX(localPt, pPitch);
        p = V3.rotZ(p, pRoll);
        return p;
      };

      // ─── 3. Render 3D Model: Gimbal Gyroscope OR PCB Sensor Board ─────────
      if (modelMode === 'gimbal') {
        // ── Outer Gimbal Ring (Yaw Frame - fixed base) ──
        const outerR = 90;
        const ringSegments = 48;

        // Outer Ring (Cyan neon)
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.75)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i <= ringSegments; i++) {
          const th = (i / ringSegments) * Math.PI * 2;
          const pt = [outerR * Math.cos(th), outerR * Math.sin(th), 0];
          const sp = project(pt);
          if (i === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Outer Ring Bearing Pivots
        const bTop = project([0, outerR, 0]);
        const bBot = project([0, -outerR, 0]);
        [bTop, bBot].forEach(b => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // ── Middle Gimbal Ring (Pitch Axis - rotates in Pitch) ──
        const midR = 74;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
        ctx.lineWidth = 2.8;
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        for (let i = 0; i <= ringSegments; i++) {
          const th = (i / ringSegments) * Math.PI * 2;
          const localPt = [0, midR * Math.sin(th), midR * Math.cos(th)];
          const worldPt = V3.rotX(localPt, pPitch);
          const sp = project(worldPt);
          if (i === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Middle Ring Bearings
        const mLeft = project(V3.rotX([-midR, 0, 0], pPitch));
        const mRight = project(V3.rotX([midR, 0, 0], pPitch));
        [mLeft, mRight].forEach(b => {
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // ── Inner Gimbal Ring (Roll Axis - rotates with both Pitch & Roll) ──
        const inR = 58;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i <= ringSegments; i++) {
          const th = (i / ringSegments) * Math.PI * 2;
          const localPt = [inR * Math.cos(th), 0, inR * Math.sin(th)];
          const worldPt = toWorld(localPt);
          const sp = project(worldPt);
          if (i === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ── Spinning Gyro Flywheel / Rotor Disc ──
        const rotorR = 44;
        const spin = spinAngleRef.current;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 5;

        // Disc polygon
        const discPts = [];
        for (let i = 0; i <= ringSegments; i++) {
          const th = (i / ringSegments) * Math.PI * 2;
          const localPt = [rotorR * Math.cos(th), 0, rotorR * Math.sin(th)];
          const sp = project(toWorld(localPt));
          discPts.push(sp);
        }
        ctx.beginPath();
        discPts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4 Rotor Spokes
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        for (let s = 0; s < 4; s++) {
          const a = spin + (s * Math.PI) / 2;
          const p1 = project(toWorld([0, 0, 0]));
          const p2 = project(toWorld([rotorR * Math.cos(a), 0, rotorR * Math.sin(a)]));
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Center Gyro Rotor Hub & Core
        const hubPt = project(toWorld([0, 0, 0]));
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(hubPt.x, hubPt.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(hubPt.x, hubPt.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Central MEMS Sensor Package mounted on top of hub
        const chipTop = project(toWorld([0, 7, 0]));
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(chipTop.x - 9, chipTop.y - 6, 18, 12);
        ctx.strokeRect(chipTop.x - 9, chipTop.y - 6, 18, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '8px monospace';
        ctx.fillText('MPU', chipTop.x - 7, chipTop.y + 3);

      } else {
        // ── MEMS Sensor Board (Realistic 3D PCB Breakdown) ──
        const pcbW = 68;
        const pcbH = 48;
        const pcbThick = 4;

        // 8 Corners of the PCB Box
        const corners = [
          [-pcbW,  pcbThick, -pcbH],
          [ pcbW,  pcbThick, -pcbH],
          [ pcbW,  pcbThick,  pcbH],
          [-pcbW,  pcbThick,  pcbH],
          [-pcbW, -pcbThick, -pcbH],
          [ pcbW, -pcbThick, -pcbH],
          [ pcbW, -pcbThick,  pcbH],
          [-pcbW, -pcbThick,  pcbH],
        ].map(pt => project(toWorld(pt)));

        // Faces of the PCB (top, bottom, sides)
        const faces = [
          { pts: [0, 1, 2, 3], col: '#064e3b', stroke: '#10b981', label: 'PCB' },
          { pts: [4, 5, 6, 7], col: '#022c22', stroke: '#047857' },
          { pts: [0, 1, 5, 4], col: '#047857', stroke: '#065f46' },
          { pts: [2, 3, 7, 6], col: '#047857', stroke: '#065f46' },
          { pts: [0, 3, 7, 4], col: '#065f46', stroke: '#047857' },
          { pts: [1, 2, 6, 5], col: '#065f46', stroke: '#047857' },
        ];

        // Sort faces by depth
        faces.forEach(f => {
          f.depth = f.pts.reduce((sum, idx) => sum + corners[idx].z, 0) / f.pts.length;
        });
        faces.sort((a, b) => b.depth - a.depth);

        // Draw PCB Faces
        faces.forEach(f => {
          ctx.beginPath();
          f.pts.forEach((idx, i) => {
            const p = corners[idx];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.fillStyle = f.col;
          ctx.fill();
          ctx.strokeStyle = f.stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // ── On-Board Components (Surface Mount IMU Chip) ──
        const chipW = 20;
        const chipH = 20;
        const chipCorners = [
          [-chipW, pcbThick + 3, -chipH],
          [ chipW, pcbThick + 3, -chipH],
          [ chipW, pcbThick + 3,  chipH],
          [-chipW, pcbThick + 3,  chipH],
        ].map(pt => project(toWorld(pt)));

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        chipCorners.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Silk screen on chip
        const chipCenter = project(toWorld([0, pcbThick + 4, 0]));
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MPU-6050', chipCenter.x, chipCenter.y - 1);
        ctx.font = '7px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('6-AXIS IMU', chipCenter.x, chipCenter.y + 8);

        // Gold Pin Headers along bottom edge
        const pinLabels = ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'];
        const pinStep = (pcbW * 1.7) / (pinLabels.length - 1);
        const pinStart = -pcbW * 0.85;

        pinLabels.forEach((lbl, idx) => {
          const px = pinStart + idx * pinStep;
          const pinPos = project(toWorld([px, pcbThick + 1, pcbH - 6]));
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(pinPos.x, pinPos.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Power Indicator LED
        const ledPos = project(toWorld([-pcbW + 12, pcbThick + 2, -pcbH + 12]));
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ledPos.x, ledPos.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ─── 4. Coordinate Axes Arrows (+X, +Y, +Z) ───────────────────────────
      if (showAxes) {
        const origin = project(toWorld([0, 0, 0]));
        const axisLen = 65;

        const axes = [
          { dir: [axisLen, 0, 0], col: '#ef4444', label: '+X Roll' },
          { dir: [0, axisLen, 0], col: '#10b981', label: '+Y Pitch' },
          { dir: [0, 0, axisLen], col: '#38bdf8', label: '+Z Yaw' },
        ];

        axes.forEach(({ dir, col, label }) => {
          const tip = project(toWorld(dir));
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();

          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = col;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(label, tip.x + 6, tip.y + 3);
        });
      }

      // ─── 5. Gravity Vector Arrow ──────────────────────────────────────────
      {
        const origin = project([0, 0, 0]);
        const gLen = 60 * Math.min(1.5, Math.max(0.2, Number(telemetry.gMag)));
        const gTip = project([0, -gLen, 0]);

        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(gTip.x, gTip.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(gTip.x, gTip.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`1G GRAVITY (${telemetry.gMag}g)`, gTip.x + 8, gTip.y + 4);
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [modelMode, showAxes, showGrid, showHorizon, autoRotate, rotorRpm, telemetry, onSetMotion]);

  // ─── Interactive Mouse Orbit & Dragging Handlers ───────────────────────────
  const handleMouseDown = (e) => {
    e.preventDefault();
    cameraRef.current.isDragging = true;
    cameraRef.current.lastX = e.clientX;
    cameraRef.current.lastY = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!cameraRef.current.isDragging) return;
    const dx = e.clientX - cameraRef.current.lastX;
    const dy = e.clientY - cameraRef.current.lastY;
    cameraRef.current.lastX = e.clientX;
    cameraRef.current.lastY = e.clientY;

    cameraRef.current.yaw += dx * 0.008;
    cameraRef.current.pitch = Math.max(-1.4, Math.min(1.4, cameraRef.current.pitch + dy * 0.008));
  };

  const handleMouseUp = () => {
    cameraRef.current.isDragging = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.2;
    cameraRef.current.dist = Math.max(160, Math.min(600, cameraRef.current.dist + zoomFactor));
  };

  const resetCamera = () => {
    cameraRef.current.yaw = -0.65;
    cameraRef.current.pitch = 0.42;
    cameraRef.current.dist = 340;
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(10,15,30,0.95) 100%)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        marginBottom: '24px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Header Toolbar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(37,99,235,0.1) 100%)',
              border: '1px solid rgba(56,189,248,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px', color: '#fff' }}>
                3D MOTION & GYROSCOPE SIMULATOR
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  background: 'rgba(56,189,248,0.15)',
                  color: telemetry.tagColor,
                  border: `1px solid ${telemetry.tagColor}55`,
                }}
              >
                {telemetry.stateTag}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
              MPU-6050 6-DOF IMU • 3-AXIS GIMBAL VISUALIZER • DRAG TO ORBIT VIEW
            </div>
          </div>
        </div>

        {/* View Mode & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setModelMode('gimbal')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                background: modelMode === 'gimbal' ? 'rgba(56,189,248,0.25)' : 'transparent',
                color: modelMode === 'gimbal' ? '#38bdf8' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Gimbal Gyro
            </button>
            <button
              type="button"
              onClick={() => setModelMode('pcb')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                background: modelMode === 'pcb' ? 'rgba(16,185,129,0.25)' : 'transparent',
                color: modelMode === 'pcb' ? '#34d399' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              MEMS Board
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto Precession Animation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              background: autoRotate ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
              color: autoRotate ? '#fbbf24' : 'rgba(255,255,255,0.6)',
              border: autoRotate ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            {autoRotate ? <Pause size={12} /> : <Play size={12} />}
            <span>{autoRotate ? 'Stop Wobble' : 'Precession'}</span>
          </button>

          {/* Reset Camera Button */}
          <button
            type="button"
            onClick={resetCamera}
            title="Reset 3D Camera Angle"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RotateCw size={12} />
          </button>
        </div>
      </div>

      {/* ── Main 3D Canvas Area + Telemetry HUD ── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '380px',
          width: '100%',
          cursor: cameraRef.current.isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* HUD Top-Left Overlay: Attitude Angles & G-Force */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '14px',
            pointerEvents: 'none',
            background: 'rgba(5, 7, 13, 0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
            GYRO ATTITUDE TELEMETRY
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#f472b6', display: 'block' }}>ROLL (X)</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{telemetry.rollDeg}°</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#a78bfa', display: 'block' }}>PITCH (Y)</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{telemetry.pitchDeg}°</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#fbbf24', display: 'block' }}>G-FORCE</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fbbf24' }}>{telemetry.gMag}g</span>
            </div>
          </div>
        </div>

        {/* HUD Top-Right Overlay: Layer Toggles */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            background: 'rgba(5, 7, 13, 0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '6px 8px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => setShowAxes(!showAxes)}
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: showAxes ? 'rgba(56,189,248,0.2)' : 'transparent',
              color: showAxes ? '#38bdf8' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Axes {showAxes ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: showGrid ? 'rgba(56,189,248,0.2)' : 'transparent',
              color: showGrid ? '#38bdf8' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Grid {showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setShowHorizon(!showHorizon)}
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: showHorizon ? 'rgba(56,189,248,0.2)' : 'transparent',
              color: showHorizon ? '#38bdf8' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Horizon {showHorizon ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Drag Interaction Hint Bottom-Center */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.5)',
            padding: '3px 10px',
            borderRadius: '12px',
          }}
        >
          🖱️ Click + Drag to Orbit • Scroll to Zoom
        </div>
      </div>

      {/* ── Interactive 3-Axis Sliders + Quick Presets Footer ── */}
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* 3-Axis Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Axis X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '80px', fontSize: '11px', color: '#f472b6', fontFamily: 'monospace', fontWeight: 'bold' }}>
              X (Roll):
            </span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.02"
              value={accelX}
              onChange={(e) => onSetMotion && onSetMotion(Number(e.target.value), accelY, accelZ)}
              style={{ flex: 1, accentColor: '#f472b6' }}
            />
            <span style={{ width: '45px', textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: '#fff' }}>
              {Number(accelX).toFixed(2)}g
            </span>
          </div>

          {/* Axis Y */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '80px', fontSize: '11px', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 'bold' }}>
              Y (Pitch):
            </span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.02"
              value={accelY}
              onChange={(e) => onSetMotion && onSetMotion(accelX, Number(e.target.value), accelZ)}
              style={{ flex: 1, accentColor: '#a78bfa' }}
            />
            <span style={{ width: '45px', textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: '#fff' }}>
              {Number(accelY).toFixed(2)}g
            </span>
          </div>

          {/* Axis Z */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '80px', fontSize: '11px', color: '#818cf8', fontFamily: 'monospace', fontWeight: 'bold' }}>
              Z (Yaw):
            </span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.02"
              value={accelZ}
              onChange={(e) => onSetMotion && onSetMotion(accelX, accelY, Number(e.target.value))}
              style={{ flex: 1, accentColor: '#818cf8' }}
            />
            <span style={{ width: '45px', textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: '#fff' }}>
              {Number(accelZ).toFixed(2)}g
            </span>
          </div>
        </div>

        {/* Quick Orientation Presets Buttons */}
        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginBottom: '8px', letterSpacing: '0.5px' }}>
            ORIENTATION PRESETS:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESETS.map((p) => {
              const isMatch =
                Math.abs(accelX - p.x) < 0.08 &&
                Math.abs(accelY - p.y) < 0.08 &&
                Math.abs(accelZ - p.z) < 0.08;
              return (
                <button
                  key={p.label}
                  type="button"
                  title={p.desc}
                  onClick={() => onSetMotion && onSetMotion(p.x, p.y, p.z)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: isMatch ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)',
                    border: isMatch ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    color: isMatch ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
