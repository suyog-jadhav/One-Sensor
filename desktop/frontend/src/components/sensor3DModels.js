import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

// ─── Procedural Texture Generators ──────────────────────────────────────────

/**
 * Creates high-res canvas texture for PCB silkscreens & traces
 */
export function createPcbCanvasTexture({
  width = 512,
  height = 512,
  bgColor = '#0c2240',
  silkscreenColor = '#ffffff',
  traceColor = '#c8963e',
  title = 'SENSOR',
  pins = ['VCC', 'GND', 'OUT'],
  pinSide = 'bottom',
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // PCB Base Solder Mask
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle PCB texture & grid traces
  ctx.strokeStyle = traceColor;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.55;

  // Circuit trace routes
  ctx.beginPath();
  ctx.moveTo(40, 60); ctx.lineTo(120, 60); ctx.lineTo(160, 100); ctx.lineTo(240, 100);
  ctx.moveTo(width - 40, 60); ctx.lineTo(width - 120, 60); ctx.lineTo(width - 160, 100);
  ctx.moveTo(60, 180); ctx.lineTo(100, 180); ctx.lineTo(140, 220); ctx.lineTo(140, 320);
  ctx.moveTo(width - 60, 180); ctx.lineTo(width - 100, 180); ctx.lineTo(width - 140, 220); ctx.lineTo(width - 140, 320);
  ctx.stroke();

  // Ground plane vias / dots
  ctx.fillStyle = traceColor;
  const viaPositions = [
    [50, 90], [80, 130], [width - 50, 90], [width - 80, 130],
    [70, 300], [width - 70, 300], [180, 70], [width - 180, 70]
  ];
  for (const [vx, vy] of viaPositions) {
    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner Mounting Holes with Solder Rings
  ctx.globalAlpha = 1.0;
  const cornerRings = [
    [32, 32], [width - 32, 32], [32, height - 32], [width - 32, height - 32]
  ];
  for (const [cx, cy] of cornerRings) {
    ctx.fillStyle = '#94a3b8'; // Silver solder
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#06090f'; // Hole center
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silkscreen Model Title
  ctx.fillStyle = silkscreenColor;
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, height * 0.42);

  // Silkscreen Decorative Border Box
  ctx.strokeStyle = silkscreenColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Silkscreen Pin Labels
  if (pins && pins.length > 0) {
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = silkscreenColor;
    const spacing = (width - 120) / (pins.length - 1 || 1);
    pins.forEach((pin, i) => {
      const px = pins.length === 1 ? width / 2 : 60 + i * spacing;
      const py = pinSide === 'bottom' ? height - 55 : 55;
      ctx.fillText(pin, px, py);

      // Solder pad for pin
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 8, pinSide === 'bottom' ? height - 32 : 18, 16, 14);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(px, pinSide === 'bottom' ? height - 25 : 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = silkscreenColor;
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates wire mesh texture for gas canisters & microphone faces
 */
export function createWireMeshTexture(density = 24) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1e24';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  const step = 128 / density;

  ctx.beginPath();
  for (let i = 0; i <= 128; i += step) {
    ctx.moveTo(i, 0); ctx.lineTo(i, 128);
    ctx.moveTo(0, i); ctx.lineTo(128, i);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates IC Chip Laser-etched surface texture
 */
export function createChipTexture(label1 = 'LM393', label2 = 'N844') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181a20'; // Matte black molded epoxy
  ctx.fillRect(0, 0, 256, 256);

  // Pin 1 orientation dimple
  ctx.fillStyle = '#0f1115';
  ctx.beginPath();
  ctx.arc(28, 28, 10, 0, Math.PI * 2);
  ctx.fill();

  // Laser etched text
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label1, 128, 115);
  ctx.font = '20px monospace';
  ctx.fillText(label2, 128, 155);

  return new THREE.CanvasTexture(canvas);
}

// ─── Reusable Hardware Sub-assemblies ──────────────────────────────────────────

/**
 * Creates a standard row of angled / straight header pins
 */
export function createHeaderPinStrip(pinCount = 4, spacing = 0.42, bent = true) {
  const group = new THREE.Group();

  // Black plastic spacer block
  const blockGeo = new THREE.BoxGeometry(pinCount * spacing + 0.1, 0.22, 0.22);
  const blockMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.6,
    metalness: 0.1,
  });
  const block = new THREE.Mesh(blockGeo, blockMat);
  block.position.set(0, 0, 0);
  group.add(block);

  // Metal pins
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.95,
    roughness: 0.2,
  });

  const startX = -((pinCount - 1) * spacing) / 2;

  for (let i = 0; i < pinCount; i++) {
    const x = startX + i * spacing;

    if (bent) {
      // Horizontal through-hole pin portion
      const pinHGeo = new THREE.BoxGeometry(0.06, 0.06, 0.45);
      const pinH = new THREE.Mesh(pinHGeo, pinMat);
      pinH.position.set(x, 0, -0.15);
      group.add(pinH);

      // Angled downward/outward pin portion
      const pinVGeo = new THREE.BoxGeometry(0.06, 0.55, 0.06);
      const pinV = new THREE.Mesh(pinVGeo, pinMat);
      pinV.position.set(x, -0.25, 0.08);
      group.add(pinV);
    } else {
      // Straight through-hole pin
      const pinGeo = new THREE.BoxGeometry(0.06, 0.75, 0.06);
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, 0, 0);
      group.add(pin);
    }
  }

  return group;
}

/**
 * Creates a blue SMD trimmer potentiometer with brass adjustment screw
 */
export function createPotentiometer() {
  const group = new THREE.Group();

  // Blue plastic body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.35,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // White top circular face
  const dialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24);
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.5,
  });
  const dial = new THREE.Mesh(dialGeo, dialMat);
  dial.position.y = 0.26;
  group.add(dial);

  // Brass / silver cross screw
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04,
    metalness: 0.9,
    roughness: 0.3,
  });
  const slot1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.04), screwMat);
  slot1.position.y = 0.27;
  const slot2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.22), screwMat);
  slot2.position.y = 0.27;
  group.add(slot1);
  group.add(slot2);

  return group;
}

/**
 * Creates an LM393 / SOIC-8 comparator IC with gull-wing silver leads
 */
export function createSOIC8Chip(label1 = 'LM393') {
  const group = new THREE.Group();

  const chipGeo = new THREE.BoxGeometry(0.5, 0.12, 0.38);
  const chipMat = new THREE.MeshStandardMaterial({
    map: createChipTexture(label1, 'N844'),
    roughness: 0.45,
    metalness: 0.1,
  });
  const chip = new THREE.Mesh(chipGeo, chipMat);
  group.add(chip);

  // Silver leads on both sides
  const leadMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.9,
    roughness: 0.25,
  });

  for (let i = 0; i < 4; i++) {
    const z = -0.12 + i * 0.08;
    // Left lead
    const leadL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.04), leadMat);
    leadL.position.set(-0.28, -0.04, z);
    group.add(leadL);
    // Right lead
    const leadR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.04), leadMat);
    leadR.position.set(0.28, -0.04, z);
    group.add(leadR);
  }

  return group;
}

// ─── 12 PHYSICAL 3D SENSOR BUILDERS ──────────────────────────────────────────

/**
 * 1. Gas Sensor (MQ-2) & CO2 Sensor (MQ-135)
 */
export function buildGasSensorModule(type = 'mq2', value = 250, min = 0, max = 1000) {
  const group = new THREE.Group();

  const isCO2 = type === 'co2' || type === 'mq135';
  const title = isCO2 ? 'MQ-135 CO₂' : 'MQ-2 GAS';
  const pins = isCO2 ? ['VCC', 'GND', 'AO', 'DO'] : ['VCC', 'GND', 'DO', 'AO'];

  // Main PCB
  const pcbGeo = new THREE.BoxGeometry(2.4, 0.1, 2.8);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#08233f',
      title: title,
      pins: pins,
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Front Header Pins
  const pinsStrip = createHeaderPinStrip(4, 0.38, true);
  pinsStrip.position.set(0, 0, 1.45);
  group.add(pinsStrip);

  // Blue Trimmer Potentiometer
  const pot = createPotentiometer();
  pot.position.set(0.55, 0.3, 0.35);
  group.add(pot);

  // LM393 Comparator Chip
  const chip = createSOIC8Chip('LM393');
  chip.position.set(-0.25, 0.11, 0.4);
  group.add(chip);

  // MQ Sensor Canister Assembly
  const canGroup = new THREE.Group();
  canGroup.position.set(-0.15, 0.1, -0.45);

  // Hex / Round Base Collar
  const baseGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.22, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.25,
  });
  const baseCollar = new THREE.Mesh(baseGeo, baseMat);
  baseCollar.position.y = 0.11;
  canGroup.add(baseCollar);

  // Metal Canister Cylinder with Wire Mesh
  const canGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.75, 32);
  const meshTex = createWireMeshTexture(32);
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0db,
    metalness: 0.85,
    roughness: 0.35,
    map: meshTex,
  });
  const canister = new THREE.Mesh(canGeo, canMat);
  canister.position.y = 0.55;
  canGroup.add(canister);

  // Top Domed Mesh Cap
  const domeGeo = new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.88,
    roughness: 0.3,
    map: meshTex,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.92;
  canGroup.add(dome);

  // Internal Glowing Heater Coil (dynamically changes with Gas / CO2 concentration)
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const heaterGlowColor = isCO2 ? 0xf59e0b : 0xef4444;

  const coilGeo = new THREE.TorusGeometry(0.28, 0.06, 12, 24);
  const coilMat = new THREE.MeshBasicMaterial({
    color: heaterGlowColor,
  });
  const coil = new THREE.Mesh(coilGeo, coilMat);
  coil.rotation.x = Math.PI / 2;
  coil.position.y = 0.6;
  canGroup.add(coil);

  // Inner Point Light for Heater Radiance
  const heaterLight = new THREE.PointLight(heaterGlowColor, 0.4 + normVal * 2.2, 3.5);
  heaterLight.position.y = 0.65;
  canGroup.add(heaterLight);

  group.add(canGroup);
  return { group, coilMat, heaterLight };
}

/**
 * 2. Light Sensor (LDR Photoresistor Module)
 */
export function buildLightSensorModule(value = 650, min = 0, max = 2000) {
  const group = new THREE.Group();

  // PCB
  const pcbGeo = new THREE.BoxGeometry(2.2, 0.1, 2.7);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#0d2b4f',
      title: 'LDR LIGHT',
      pins: ['VCC', 'GND', 'DO', 'AO'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Header Pins
  const pins = createHeaderPinStrip(4, 0.38, true);
  pins.position.set(0, 0, 1.4);
  group.add(pins);

  // Potentiometer & LM393
  const pot = createPotentiometer();
  pot.position.set(0.5, 0.3, 0.35);
  group.add(pot);

  const chip = createSOIC8Chip('LM393');
  chip.position.set(-0.25, 0.11, 0.4);
  group.add(chip);

  // LDR Photoresistor Assembly
  const ldrGroup = new THREE.Group();
  ldrGroup.position.set(-0.05, 0.1, -0.45);

  // Ceramic base disc
  const discGeo = new THREE.CylinderGeometry(0.6, 0.62, 0.22, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04,
    roughness: 0.4,
    metalness: 0.2,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.11;
  ldrGroup.add(disc);

  // Serpentine CdS Photoresistor Face
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 256;
  const fctx = faceCanvas.getContext('2d');
  fctx.fillStyle = '#b45309';
  fctx.fillRect(0, 0, 256, 256);
  // Serpentine copper trace
  fctx.strokeStyle = '#fef08a';
  fctx.lineWidth = 14;
  fctx.beginPath();
  fctx.moveTo(35, 50); fctx.lineTo(220, 50);
  fctx.arcTo(235, 50, 235, 75, 20); fctx.arcTo(235, 100, 220, 100, 20);
  fctx.lineTo(35, 100);
  fctx.arcTo(20, 100, 20, 125, 20); fctx.arcTo(20, 150, 35, 150, 20);
  fctx.lineTo(220, 150);
  fctx.arcTo(235, 150, 235, 175, 20); fctx.arcTo(235, 200, 220, 200, 20);
  fctx.lineTo(35, 200);
  fctx.stroke();

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.2,
  });
  const facePlane = new THREE.Mesh(new THREE.CircleGeometry(0.58, 32), faceMat);
  facePlane.rotation.x = -Math.PI / 2;
  facePlane.position.y = 0.23;
  ldrGroup.add(facePlane);

  // Clear epoxy lens cap
  const lensGeo = new THREE.SphereGeometry(0.59, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    transmission: 0.8,
  });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.y = 0.23;
  ldrGroup.add(lens);

  // Dynamic Ambient Sunbeam / Halo Light
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const sunLight = new THREE.PointLight(0xfbbf24, 0.5 + normVal * 3.5, 4.0);
  sunLight.position.set(0, 0.8, 0);
  ldrGroup.add(sunLight);

  group.add(ldrGroup);
  return { group, sunLight };
}

/**
 * 3. Soil Moisture Sensor (YL-69 Fork Probe)
 */
export function buildSoilMoistureModule(value = 35, min = 0, max = 100) {
  const group = new THREE.Group();

  // Upper Circuit Block PCB
  const headGeo = new THREE.BoxGeometry(2.1, 0.1, 1.5);
  const headMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#0f172a',
      title: 'YL-69',
      pins: ['VCC', 'GND', 'AO'],
      pinSide: 'bottom',
    }),
    roughness: 0.4,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0, -0.6);
  group.add(head);

  // Top header pins
  const pins = createHeaderPinStrip(3, 0.4, false);
  pins.position.set(0, 0.15, -1.35);
  pins.rotation.x = Math.PI / 2;
  group.add(pins);

  // Potentiometer & Chip on head
  const pot = createPotentiometer();
  pot.position.set(0.4, 0.3, -0.6);
  group.add(pot);

  const chip = createSOIC8Chip('LM393');
  chip.position.set(-0.35, 0.11, -0.6);
  group.add(chip);

  // Dual Immersion Prongs (Tines)
  const prongMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold plated
    metalness: 0.9,
    roughness: 0.25,
  });

  [-0.55, 0.55].forEach(x => {
    // Rectangular prong
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 2.2), prongMat);
    tine.position.set(x, 0, 1.1);
    group.add(tine);

    // Pointed triangular tip
    const tipGeo = new THREE.ConeGeometry(0.3, 0.45, 4);
    const tip = new THREE.Mesh(tipGeo, prongMat);
    tip.rotation.y = Math.PI / 4;
    tip.rotation.x = Math.PI / 2;
    tip.position.set(x, 0, 2.38);
    group.add(tip);
  });

  // Glistening Water Droplets
  const dropletMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.05,
    transmission: 0.9,
  });

  const dropletCoords = [
    [-0.55, 0.06, 0.5, 0.08],
    [-0.55, 0.06, 1.2, 0.11],
    [-0.55, 0.06, 1.8, 0.07],
    [0.55, 0.06, 0.7, 0.09],
    [0.55, 0.06, 1.4, 0.12],
    [0.55, 0.06, 1.9, 0.08],
  ];

  dropletCoords.forEach(([dx, dy, dz, r]) => {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), dropletMat);
    drop.position.set(dx, dy, dz);
    drop.scale.set(1, 0.6, 1.2);
    group.add(drop);
  });

  // Moisture Bio-luminescent Glow
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const bioLight = new THREE.PointLight(0x10b981, 0.4 + normVal * 2.5, 3.8);
  bioLight.position.set(0, 0.3, 1.2);
  group.add(bioLight);

  return { group, bioLight };
}

/**
 * 4. Proximity Sensor (HC-SR04 Ultrasonic)
 */
export function buildUltrasonicModule(value = 25, min = 2, max = 400) {
  const group = new THREE.Group();

  // Blue PCB
  const pcbGeo = new THREE.BoxGeometry(3.6, 0.1, 1.9);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 256,
      bgColor: '#09294e',
      title: 'HC-SR04',
      pins: ['VCC', 'TRIG', 'ECHO', 'GND'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Front Header Pins
  const pins = createHeaderPinStrip(4, 0.4, true);
  pins.position.set(0, 0, 0.95);
  group.add(pins);

  // Silver Quartz Crystal Oscillator
  const crystalGeo = new THREE.CapsuleGeometry(0.12, 0.45, 8, 16);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.95,
    roughness: 0.2,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.rotation.z = Math.PI / 2;
  crystal.position.set(0, 0.15, 0.2);
  group.add(crystal);

  // Dual Aluminum Transducer Cans (Transmitter 'T' & Receiver 'R')
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.2,
  });

  const meshTex = createWireMeshTexture(36);
  const meshFaceMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.4,
    map: meshTex,
  });

  [-1.0, 1.0].forEach(x => {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.9, 32), canMat);
    can.position.set(x, 0.5, -0.15);
    group.add(can);

    // Beveled rim collar
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.05, 12, 32), canMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.95, -0.15);
    group.add(rim);

    // Recessed mesh face
    const meshFace = new THREE.Mesh(new THREE.CircleGeometry(0.63, 32), meshFaceMat);
    meshFace.rotation.x = -Math.PI / 2;
    meshFace.position.set(x, 0.88, -0.15);
    group.add(meshFace);
  });

  // Ultrasonic Radar Distance Arc Waves
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const wavesGroup = new THREE.Group();
  wavesGroup.position.set(0, 0.5, -0.8);

  const waveMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.7,
    wireframe: true,
  });

  for (let i = 0; i < 3; i++) {
    const arcGeo = new THREE.RingGeometry(0.5 + i * 0.4, 0.55 + i * 0.4, 32, 1, Math.PI * 0.2, Math.PI * 0.6);
    const arc = new THREE.Mesh(arcGeo, waveMat);
    arc.rotation.x = -Math.PI / 2;
    arc.position.z = -i * 0.4;
    wavesGroup.add(arc);
  }
  group.add(wavesGroup);

  const radarLight = new THREE.PointLight(0x38bdf8, 0.8 + normVal * 2.0, 4.0);
  radarLight.position.set(0, 0.6, -0.5);
  group.add(radarLight);

  return { group, wavesGroup, radarLight };
}

/**
 * 5. Sound Level Sensor (Electret Microphone Capsule Module)
 */
export function buildSoundSensorModule(value = 62, min = 30, max = 120) {
  const group = new THREE.Group();

  // PCB
  const pcbGeo = new THREE.BoxGeometry(2.0, 0.1, 2.7);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#09213d',
      title: 'MIC SOUND',
      pins: ['OUT', 'VCC', 'GND'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Header Pins
  const pins = createHeaderPinStrip(3, 0.42, true);
  pins.position.set(0, 0, 1.4);
  group.add(pins);

  // Potentiometer & LM393
  const pot = createPotentiometer();
  pot.position.set(-0.45, 0.3, 0.35);
  group.add(pot);

  const chip = createSOIC8Chip('LM393');
  chip.position.set(0.3, 0.11, 0.35);
  group.add(chip);

  // Cylindrical Electret Microphone Capsule
  const micGroup = new THREE.Group();
  micGroup.position.set(0, 0.1, -0.45);

  const micCanMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.92,
    roughness: 0.18,
  });
  const micCan = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.75, 32), micCanMat);
  micCan.position.y = 0.38;
  micGroup.add(micCan);

  // Black felt acoustic top face
  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.9,
    map: createWireMeshTexture(48),
  });
  const felt = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = 0.76;
  micGroup.add(felt);

  // Pulsing Sound Wave Concentric Rings
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const soundWaveMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.65,
    wireframe: true,
  });
  const waveRing = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.8, 32), soundWaveMat);
  waveRing.rotation.x = -Math.PI / 2;
  waveRing.position.y = 0.85;
  micGroup.add(waveRing);

  const soundLight = new THREE.PointLight(0xa855f7, 0.5 + normVal * 3.0, 3.5);
  soundLight.position.y = 0.8;
  micGroup.add(soundLight);

  group.add(micGroup);
  return { group, waveRing, soundLight };
}

/**
 * 6. Temperature & Humidity Sensors (Loads Real Physical .GLB Model: models/temperature.glb)
 */
export function buildDHT11Module(isTemp = true, value = 25, min = 0, max = 50, glbUrl = '/models/temperature.glb') {
  const group = new THREE.Group();

  // PCB Backing
  const pcbGeo = new THREE.BoxGeometry(2.2, 0.1, 2.8);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#0c2747',
      title: isTemp ? 'DHT11 TEMP' : 'DHT11 HUM',
      pins: ['VCC', 'DATA', 'GND'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Header Pins (VCC, DATA, GND)
  const pins = createHeaderPinStrip(3, 0.42, true);
  pins.position.set(0, 0, 1.45);
  group.add(pins);

  // SMD Passives & Status LED
  const smdMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });
  const smdResistor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.3), smdMat);
  smdResistor.position.set(-0.65, 0.08, 0.45);
  group.add(smdResistor);

  const ledMat = new THREE.MeshStandardMaterial({
    color: isTemp ? 0xef4444 : 0x06b6d4,
    emissive: isTemp ? 0xef4444 : 0x06b6d4,
    emissiveIntensity: 0.8,
  });
  const powerLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.14), ledMat);
  powerLed.position.set(0.65, 0.08, 0.45);
  group.add(powerLed);

  // Thermal / Moisture Dynamic Aura Light
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const auraColor = isTemp
    ? normVal > 0.6 ? 0xef4444 : normVal > 0.3 ? 0xf59e0b : 0x38bdf8
    : 0x06b6d4;

  const auraLight = new THREE.PointLight(auraColor, 0.6 + normVal * 2.6, 3.8);
  auraLight.position.set(0, 0.6, -0.3);
  group.add(auraLight);

  // Model Holder Group
  const modelHolder = new THREE.Group();
  group.add(modelHolder);

  // Fallback / Immediate preview housing
  const fallbackHousingMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Iconic DHT11 Sky Blue
    roughness: 0.35,
    metalness: 0.05,
  });
  const fallbackHousing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 1.8), fallbackHousingMat);
  fallbackHousing.position.set(0, 0.48, -0.3);
  modelHolder.add(fallbackHousing);

  const slatMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.6,
  });
  for (let s = -0.6; s <= 0.6; s += 0.25) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.05), slatMat);
    slat.position.set(0, 0.48 + s * 0.4, 0.61);
    modelHolder.add(slat);
  }

  // Asynchronously load real physical GLB sensor model
  if (glbUrl) {
    gltfLoader.load(
      glbUrl,
      (gltf) => {
        // Clear initial fallback meshes once GLB is loaded
        while (modelHolder.children.length > 0) {
          modelHolder.remove(modelHolder.children[0]);
        }

        const gltfScene = gltf.scene;

        // Traverse mesh and compute normals for proper specular & PBR reflections
        gltfScene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.computeVertexNormals();
            }

            // Authentic DHT11 Cyan-Blue high-detail finish
            child.material = new THREE.MeshStandardMaterial({
              color: 0x0284c7,
              roughness: 0.32,
              metalness: 0.12,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Compute Bounding Box for precise auto-centering & scaling
        const box = new THREE.Box3().setFromObject(gltfScene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Scale to fit on PCB pad (approx 1.8 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 1.75;
        const scaleFactor = targetSize / (maxDim || 1);

        gltfScene.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center directly on top of PCB
        gltfScene.position.x = -center.x * scaleFactor;
        gltfScene.position.y = -center.y * scaleFactor + 0.62;
        gltfScene.position.z = -center.z * scaleFactor - 0.25;

        modelHolder.add(gltfScene);
      },
      undefined,
      (err) => {
        console.warn('Could not load GLB model from ' + glbUrl + ', keeping procedural fallback:', err);
      }
    );
  }

  return { group, auraLight };
}

/**
 * 7. Motion Sensors (MPU-6050 6-DOF IMU with 3D Coordinate Arrows)
 */
export function buildMPU6050Module(activeAxis = 'X', value = 0, min = -2, max = 2) {
  const group = new THREE.Group();

  // GY-521 Blue Breakout Board PCB
  const pcbGeo = new THREE.BoxGeometry(2.3, 0.09, 2.5);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#0c305c',
      title: 'GY-521',
      pins: ['VCC', 'GND', 'SCL', 'SDA'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // 4-Pin Header Strip
  const pins = createHeaderPinStrip(4, 0.38, true);
  pins.position.set(0, 0, 1.3);
  group.add(pins);

  // MPU-6050 QFN-24 Chip
  const chipMat = new THREE.MeshStandardMaterial({
    map: createChipTexture('MPU-6050', 'GY-521 DMP'),
    roughness: 0.4,
    metalness: 0.1,
  });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), chipMat);
  chip.position.set(0, 0.11, -0.2);
  group.add(chip);

  // SMD Passives surrounding chip
  const smdMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.8, roughness: 0.25 });
  [-0.6, 0.6].forEach(sx => {
    const smd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), smdMat);
    smd.position.set(sx, 0.09, -0.2);
    group.add(smd);
  });

  // 3D Coordinate Frame System (X = Red, Y = Purple/Cyan, Z = Green/Amber)
  const coordsGroup = new THREE.Group();
  coordsGroup.position.set(0, 0.2, -0.2);

  // Helper to build 3D arrow
  const buildArrow = (dir, color, length, isCurrent) => {
    const arrowGroup = new THREE.Group();
    const shaftRadius = isCurrent ? 0.045 : 0.025;
    const headRadius = isCurrent ? 0.12 : 0.07;
    const headLength = isCurrent ? 0.3 : 0.2;

    const shaftMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: isCurrent ? color : 0x000000,
      emissiveIntensity: isCurrent ? 0.8 : 0,
      roughness: 0.3,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius, shaftRadius, length - headLength, 16), shaftMat);
    shaft.position.y = (length - headLength) / 2;
    arrowGroup.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(headRadius, headLength, 16), shaftMat);
    head.position.y = length - headLength / 2;
    arrowGroup.add(head);

    if (dir === 'X') {
      arrowGroup.rotation.z = -Math.PI / 2;
    } else if (dir === 'Z') {
      arrowGroup.rotation.x = Math.PI / 2;
    }

    return arrowGroup;
  };

  const isX = activeAxis === 'X';
  const isY = activeAxis === 'Y';
  const isZ = activeAxis === 'Z';

  const xArrow = buildArrow('X', 0xef4444, isX ? 1.4 : 0.9, isX);
  const yArrow = buildArrow('Y', isY ? 0xa855f7 : 0x38bdf8, isY ? 1.4 : 0.9, isY);
  const zArrow = buildArrow('Z', isZ ? 0xf59e0b : 0x10b981, isZ ? 1.4 : 0.9, isZ);

  coordsGroup.add(xArrow);
  coordsGroup.add(yArrow);
  coordsGroup.add(zArrow);
  group.add(coordsGroup);

  // Dynamic light colored by active axis
  const activeColor = isX ? 0xef4444 : isY ? 0xa855f7 : 0xf59e0b;
  const axisLight = new THREE.PointLight(activeColor, 1.2, 3.5);
  axisLight.position.set(0, 0.8, -0.2);
  group.add(axisLight);

  return { group, coordsGroup, axisLight };
}

/**
 * 8. UV Index Sensor (GY-ML8511 Hermetic TO-Can Photodiode)
 */
export function buildUVModule(value = 4.5, min = 0, max = 11) {
  const group = new THREE.Group();

  // Purple / Dark Blue PCB
  const pcbGeo = new THREE.BoxGeometry(2.1, 0.1, 2.5);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: createPcbCanvasTexture({
      width: 512,
      height: 512,
      bgColor: '#2a1147',
      title: 'ML8511 UV',
      pins: ['VCC', 'OUT', 'GND', 'EN'],
      pinSide: 'bottom',
    }),
    roughness: 0.35,
    metalness: 0.15,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Header Pins
  const pins = createHeaderPinStrip(4, 0.38, true);
  pins.position.set(0, 0, 1.3);
  group.add(pins);

  // Hermetic Metal TO-46 Can Photodiode
  const canGroup = new THREE.Group();
  canGroup.position.set(0, 0.1, -0.35);

  const canMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15,
  });
  const canBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.4, 32), canMat);
  canBase.position.y = 0.2;
  canGroup.add(canBase);

  // Quartz Glass Optical Window
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    transmission: 0.9,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 32), glassMat);
  glass.position.y = 0.41;
  canGroup.add(glass);

  // Ultraviolet Corona Light
  const normVal = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const uvLight = new THREE.PointLight(0xa855f7, 0.6 + normVal * 3.5, 3.8);
  uvLight.position.set(0, 0.6, 0);
  canGroup.add(uvLight);

  group.add(canGroup);
  return { group, uvLight };
}
