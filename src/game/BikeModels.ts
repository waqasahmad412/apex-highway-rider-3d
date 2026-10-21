import * as THREE from 'three';
import { BikeSpec } from '../types/game';

export interface BikeMeshHierarchy {
  root: THREE.Group;
  steerAssembly: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  bodyMesh: THREE.Mesh;
  riderGroup?: THREE.Group;
  headlight: THREE.PointLight;
  taillight: THREE.PointLight;
  tftDisplayMesh?: THREE.Mesh;
  exhaustParticles?: THREE.Points;
  isCar?: boolean;
  frontLeftWheel?: THREE.Group;
  frontRightWheel?: THREE.Group;
  rearLeftWheel?: THREE.Group;
  rearRightWheel?: THREE.Group;
}

/**
 * Generate procedural canvas texture for tire treads
 */
function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, 128, 512);

  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 6;
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(64, y + 16);
    ctx.lineTo(118, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, y + 16);
    ctx.lineTo(64, y + 32);
    ctx.lineTo(118, y + 16);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

/**
 * Generate procedural cockpit digital dash texture
 */
function createDashboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 116);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('APEX GT', 16, 45);

  ctx.fillStyle = '#39ff14';
  ctx.font = '24px monospace';
  ctx.fillText('READY // GEAR: N', 16, 85);

  ctx.fillStyle = '#ff0055';
  ctx.fillRect(16, 100, 224, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const tireTexture = createTireTreadTexture();
const dashTexture = createDashboardTexture();

/**
 * Procedural wheel builder: rubber tire, metallic rim, drilled brake rotor, brake caliper
 */
function createMotorcycleWheel(radius: number = 0.32, width: number = 0.14): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.TorusGeometry(radius, width * 0.5, 16, 32);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1f2022,
    roughness: 0.85,
    metalness: 0.1,
    bumpMap: tireTexture,
    bumpScale: 0.03,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.rotation.y = Math.PI / 2;
  tireMesh.castShadow = true;
  wheelGroup.add(tireMesh);

  // Rim hub & spokes
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    metalness: 0.85,
    roughness: 0.2,
  });
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, width * 0.8, 16);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, rimMat);
  wheelGroup.add(hubMesh);

  // 6 spokes
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const spokeGeo = new THREE.BoxGeometry(width * 0.4, radius * 1.6, 0.02);
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = angle;
    wheelGroup.add(spoke);
  }

  // Drilled brake rotor
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0d8,
    metalness: 0.95,
    roughness: 0.15,
  });
  const rotorGeo = new THREE.RingGeometry(0.12, radius * 0.75, 24);
  const rotor1 = new THREE.Mesh(rotorGeo, rotorMat);
  rotor1.rotation.y = Math.PI / 2;
  rotor1.position.x = width * 0.45;
  wheelGroup.add(rotor1);

  const rotor2 = rotor1.clone();
  rotor2.position.x = -width * 0.45;
  rotor2.rotation.y = -Math.PI / 2;
  wheelGroup.add(rotor2);

  return wheelGroup;
}

/**
 * Builds the composite Motorcycle model according to specification
 */
export function buildMotorcycle(spec: BikeSpec): BikeMeshHierarchy {
  const root = new THREE.Group();
  root.name = `Bike_${spec.id}`;

  const bodyColor = new THREE.Color(spec.color);
  const secondaryColor = new THREE.Color(spec.secondaryColor);

  // Materials
  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.2,
    metalness: 0.75,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.45,
    metalness: 0.8,
  });

  const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2f36,
    roughness: 0.35,
    metalness: 0.85,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xededed,
    roughness: 0.1,
    metalness: 0.95,
  });

  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x111113,
    roughness: 0.9,
    metalness: 0.05,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x112233,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.85,
    thickness: 0.4,
    transparent: true,
    opacity: 0.7,
  });

  // 1. CHASSIS / FRAME
  const frameGroup = new THREE.Group();
  const mainSpineGeo = new THREE.BoxGeometry(0.24, 0.2, 1.1);
  const mainSpine = new THREE.Mesh(mainSpineGeo, frameMaterial);
  mainSpine.position.set(0, 0.65, 0.05);
  mainSpine.rotation.x = -0.12;
  mainSpine.castShadow = true;
  frameGroup.add(mainSpine);

  // Swingarm connecting to rear wheel
  const swingarmGeo = new THREE.BoxGeometry(0.28, 0.08, 0.75);
  const swingarm = new THREE.Mesh(swingarmGeo, frameMaterial);
  swingarm.position.set(0, 0.42, -0.42);
  swingarm.rotation.x = 0.18;
  swingarm.castShadow = true;
  frameGroup.add(swingarm);

  // Rear mono-shock absorber
  const shockGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
  const shockMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.8, roughness: 0.2 });
  const shock = new THREE.Mesh(shockGeo, shockMat);
  shock.position.set(0, 0.52, -0.2);
  shock.rotation.x = 0.5;
  frameGroup.add(shock);

  root.add(frameGroup);

  // 2. ENGINE BLOCK & EXHAUST
  const engineBlockGeo = new THREE.BoxGeometry(0.32, 0.35, 0.5);
  const engineBlock = new THREE.Mesh(engineBlockGeo, engineMaterial);
  engineBlock.position.set(0, 0.45, 0.1);
  engineBlock.castShadow = true;
  root.add(engineBlock);

  // Cylinder cooling fins
  for (let f = 0; f < 4; f++) {
    const finGeo = new THREE.BoxGeometry(0.34, 0.02, 0.46);
    const fin = new THREE.Mesh(finGeo, engineMaterial);
    fin.position.set(0, 0.38 + f * 0.06, 0.1);
    root.add(fin);
  }

  // Exhaust headers curving to rear
  const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.9, 12);
  const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustMesh.rotation.x = Math.PI / 2 + 0.25;
  exhaustMesh.position.set(0.18, 0.42, -0.45);
  exhaustMesh.castShadow = true;
  root.add(exhaustMesh);

  // Carbon exhaust tip
  const tipGeo = new THREE.CylinderGeometry(0.056, 0.05, 0.12, 12);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.6 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.set(0.18, 0.53, -0.9);
  tip.rotation.x = Math.PI / 2 + 0.25;
  root.add(tip);

  // 3. FUEL TANK & MAIN BODYWORK
  const tankGeo = new THREE.BoxGeometry(0.38, 0.32, 0.65);
  const bodyMesh = new THREE.Mesh(tankGeo, paintMaterial);
  bodyMesh.position.set(0, 0.82, 0.18);
  bodyMesh.rotation.x = -0.15;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Aerodynamic side fairings
  const fairingShape = new THREE.Shape();
  fairingShape.moveTo(0, 0);
  fairingShape.lineTo(0.65, 0.1);
  fairingShape.lineTo(0.5, -0.45);
  fairingShape.lineTo(-0.1, -0.3);
  fairingShape.closePath();

  const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const fairingGeo = new THREE.ExtrudeGeometry(fairingShape, extrudeSettings);

  const leftFairing = new THREE.Mesh(fairingGeo, paintMaterial);
  leftFairing.position.set(-0.24, 0.75, 0.45);
  leftFairing.rotation.y = -Math.PI / 2 + 0.08;
  leftFairing.castShadow = true;
  root.add(leftFairing);

  const rightFairing = new THREE.Mesh(fairingGeo, paintMaterial);
  rightFairing.position.set(0.24, 0.75, 0.45);
  rightFairing.rotation.y = -Math.PI / 2 - 0.08;
  rightFairing.scale.x = -1; // mirror
  rightFairing.castShadow = true;
  root.add(rightFairing);

  // 4. SEAT & TAIL SECTION
  const riderSeatGeo = new THREE.BoxGeometry(0.28, 0.12, 0.45);
  const riderSeat = new THREE.Mesh(riderSeatGeo, seatMaterial);
  riderSeat.position.set(0, 0.78, -0.22);
  riderSeat.rotation.x = 0.08;
  root.add(riderSeat);

  const tailGeo = new THREE.BoxGeometry(0.24, 0.14, 0.55);
  const tailMesh = new THREE.Mesh(tailGeo, paintMaterial);
  tailMesh.position.set(0, 0.84, -0.6);
  tailMesh.rotation.x = 0.18;
  tailMesh.castShadow = true;
  root.add(tailMesh);

  // 5. TAILLIGHT (Red glowing LED)
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
  const taillightGeo = new THREE.BoxGeometry(0.18, 0.05, 0.03);
  const taillightMesh = new THREE.Mesh(taillightGeo, taillightMat);
  taillightMesh.position.set(0, 0.9, -0.88);
  root.add(taillightMesh);

  const taillight = new THREE.PointLight(0xff0022, 1.2, 5);
  taillight.position.set(0, 0.9, -0.92);
  root.add(taillight);

  // 6. STEER ASSEMBLY (Forks, Handlebars, Front Wheel, Visor, Mirrors)
  const steerAssembly = new THREE.Group();
  steerAssembly.position.set(0, 0.75, 0.65); // Pivot at steering head angle
  root.add(steerAssembly);

  const isChopper = spec.style === 'chopper';
  const isMotocross = spec.style === 'motocross';
  const isClassic = spec.style === 'classic';
  const isNaked = spec.style === 'naked';

  // Triple clamps
  const tripleClampGeo = new THREE.BoxGeometry(0.36, 0.04, 0.1);
  const tripleClamp = new THREE.Mesh(tripleClampGeo, chromeMaterial);
  steerAssembly.add(tripleClamp);

  // Inverted front suspension forks (gold anodized or chrome)
  const forkMat = new THREE.MeshStandardMaterial({
    color: isChopper ? 0xeeeeee : 0xcca01a,
    metalness: 0.9,
    roughness: 0.15,
  });
  const forkLength = isChopper ? 0.95 : isMotocross ? 0.85 : 0.72;
  const forkGeo = new THREE.CylinderGeometry(0.028, 0.028, forkLength, 12);

  const leftFork = new THREE.Mesh(forkGeo, forkMat);
  leftFork.position.set(-0.14, isChopper ? -0.4 : -0.3, isChopper ? 0.12 : 0.06);
  leftFork.rotation.x = isChopper ? -0.52 : -0.32;
  steerAssembly.add(leftFork);

  const rightFork = new THREE.Mesh(forkGeo, forkMat);
  rightFork.position.set(0.14, isChopper ? -0.4 : -0.3, isChopper ? 0.12 : 0.06);
  rightFork.rotation.x = isChopper ? -0.52 : -0.32;
  steerAssembly.add(rightFork);

  // Handlebars: Ape-hangers for chopper, crossbar for motocross, clip-ons for superbike
  if (isChopper) {
    // Tall ape-hanger bars
    const riserGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 12);
    const leftRiser = new THREE.Mesh(riserGeo, chromeMaterial);
    leftRiser.position.set(-0.16, 0.18, 0.02);
    const rightRiser = leftRiser.clone();
    rightRiser.position.x = 0.16;
    steerAssembly.add(leftRiser, rightRiser);

    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.68, 12);
    barGeo.rotateZ(Math.PI / 2);
    const chopperBar = new THREE.Mesh(barGeo, chromeMaterial);
    chopperBar.position.set(0, 0.34, 0.02);
    steerAssembly.add(chopperBar);
  } else if (isMotocross) {
    // Wide motocross bar with foam center pad
    const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.76, 12);
    barGeo.rotateZ(Math.PI / 2);
    const mxBar = new THREE.Mesh(barGeo, frameMaterial);
    mxBar.position.set(0, 0.14, 0.01);
    steerAssembly.add(mxBar);

    const padGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12);
    padGeo.rotateZ(Math.PI / 2);
    const barPad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
    barPad.position.set(0, 0.15, 0.01);
    steerAssembly.add(barPad);

    // High front fender beak
    const beakGeo = new THREE.BoxGeometry(0.18, 0.04, 0.45);
    const beak = new THREE.Mesh(beakGeo, paintMaterial);
    beak.position.set(0, -0.08, 0.32);
    beak.rotation.x = -0.15;
    steerAssembly.add(beak);
  } else {
    // Handlebars / Clip-on bars
    const handleBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.62, 12);
    handleBarGeo.rotateZ(Math.PI / 2);
    const handleBar = new THREE.Mesh(handleBarGeo, frameMaterial);
    handleBar.position.set(0, 0.06, -0.02);
    steerAssembly.add(handleBar);
  }

  // Grips & bar-end weights
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const gripY = isChopper ? 0.34 : isMotocross ? 0.14 : 0.06;
  const leftGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12), gripMat);
  leftGrip.rotation.z = Math.PI / 2;
  leftGrip.position.set(-0.28, gripY, -0.02);
  steerAssembly.add(leftGrip);

  const rightGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12), gripMat);
  rightGrip.rotation.z = Math.PI / 2;
  rightGrip.position.set(0.28, gripY, -0.02);
  steerAssembly.add(rightGrip);

  // Aerodynamic rear-view mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
  const leftMirror = new THREE.Mesh(mirrorGeo, frameMaterial);
  leftMirror.position.set(-0.32, gripY + 0.1, 0.08);
  leftMirror.rotation.y = 0.3;
  steerAssembly.add(leftMirror);

  const rightMirror = new THREE.Mesh(mirrorGeo, frameMaterial);
  rightMirror.position.set(0.32, gripY + 0.1, 0.08);
  rightMirror.rotation.y = -0.3;
  steerAssembly.add(rightMirror);

  // Digital Cockpit Instrument Cluster (TFT Dash)
  const dashMat = new THREE.MeshBasicMaterial({ map: dashTexture });
  const tftGeo = new THREE.PlaneGeometry(0.16, 0.08);
  const tftDisplayMesh = new THREE.Mesh(tftGeo, dashMat);
  tftDisplayMesh.position.set(0, isChopper ? 0.22 : 0.14, 0.04);
  tftDisplayMesh.rotation.x = -Math.PI / 4;
  steerAssembly.add(tftDisplayMesh);

  // Windscreen / Visor (for superbikes and hyperbikes)
  if (!isChopper && !isMotocross) {
    const cowlGeo = new THREE.ConeGeometry(0.22, 0.35, 4);
    cowlGeo.rotateX(Math.PI / 2);
    const cowlMesh = new THREE.Mesh(cowlGeo, paintMaterial);
    cowlMesh.position.set(0, 0.12, 0.22);
    steerAssembly.add(cowlMesh);

    const visorGeo = new THREE.BoxGeometry(0.26, 0.28, 0.02);
    const visor = new THREE.Mesh(visorGeo, glassMaterial);
    visor.position.set(0, 0.28, 0.18);
    visor.rotation.x = -0.65;
    steerAssembly.add(visor);
  }

  // Headlight (Dual projector LED for superbike, big round for classic/chopper)
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff });
  if (isClassic || isChopper) {
    const roundLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), chromeMaterial);
    roundLamp.rotation.x = Math.PI / 2;
    roundLamp.position.set(0, 0.08, 0.32);
    steerAssembly.add(roundLamp);

    const glassFace = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), headlightMat);
    glassFace.position.set(0, 0.08, 0.355);
    steerAssembly.add(glassFace);
  } else {
    const leftEye = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), headlightMat);
    leftEye.position.set(-0.07, 0.08, 0.34);
    steerAssembly.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), headlightMat);
    rightEye.position.set(0.07, 0.08, 0.34);
    steerAssembly.add(rightEye);
  }

  const headlight = new THREE.PointLight(0xe0f7ff, 2.5, 30);
  headlight.position.set(0, 0.1, 0.5);
  steerAssembly.add(headlight);

  // Front wheel attached to fork ends
  const wheelOffsetZ = isChopper ? 0.32 : 0.18;
  const wheelOffsetY = isChopper ? -0.52 : -0.42;
  const frontWheel = createMotorcycleWheel(0.32, 0.13);
  frontWheel.position.set(0, wheelOffsetY, wheelOffsetZ);
  steerAssembly.add(frontWheel);

  // 7. REAR WHEEL
  const rearWheel = createMotorcycleWheel(0.34, 0.18); // wider rear tire for superbike traction
  rearWheel.position.set(0, 0.34, -0.76);
  root.add(rearWheel);

  // 8. RIDER MODEL (Immersive realistic silhouette with helmet, jacket, gloves, legs)
  const riderGroup = new THREE.Group();
  riderGroup.position.set(0, 0.8, -0.12);

  const riderLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    roughness: 0.6,
    metalness: 0.2,
  });

  const riderAccentMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.4,
    metalness: 0.5,
  });

  // Torso leaning forward in racing tuck
  const torsoGeo = new THREE.BoxGeometry(0.34, 0.42, 0.26);
  const torso = new THREE.Mesh(torsoGeo, riderLeatherMat);
  torso.position.set(0, 0.28, 0.04);
  torso.rotation.x = 0.55; // aggressive tuck
  torso.castShadow = true;
  riderGroup.add(torso);

  // Back protector hump
  const humpGeo = new THREE.BoxGeometry(0.18, 0.24, 0.1);
  const hump = new THREE.Mesh(humpGeo, riderAccentMat);
  hump.position.set(0, 0.35, -0.06);
  hump.rotation.x = 0.55;
  riderGroup.add(hump);

  // Helmet with dark mirrored iridium visor
  const helmetGeo = new THREE.SphereGeometry(0.16, 16, 16);
  helmetGeo.scale(1, 1.15, 1.1);
  const helmet = new THREE.Mesh(helmetGeo, riderAccentMat);
  helmet.position.set(0, 0.56, 0.25);
  helmet.castShadow = true;
  riderGroup.add(helmet);

  const visorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.1, 0.08),
    new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.1, clearcoat: 1.0 })
  );
  visorMesh.position.set(0, 0.56, 0.37);
  riderGroup.add(visorMesh);

  // Left & Right Arms gripping the bars
  const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.44, 8);

  const leftArm = new THREE.Mesh(armGeo, riderLeatherMat);
  leftArm.position.set(-0.22, 0.28, 0.32);
  leftArm.rotation.set(0.65, 0, -0.35);
  riderGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, riderLeatherMat);
  rightArm.position.set(0.22, 0.28, 0.32);
  rightArm.rotation.set(0.65, 0, 0.35);
  riderGroup.add(rightArm);

  // Left & Right Legs on footpegs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8);

  const leftLeg = new THREE.Mesh(legGeo, riderLeatherMat);
  leftLeg.position.set(-0.18, 0.02, -0.05);
  leftLeg.rotation.set(0.85, 0, -0.15);
  riderGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, riderLeatherMat);
  rightLeg.position.set(0.18, 0.02, -0.05);
  rightLeg.rotation.set(0.85, 0, 0.15);
  riderGroup.add(rightLeg);

  root.add(riderGroup);

  // Ensure overall bike is grounded properly at Y=0
  root.position.y = 0;

    return {
    root,
    steerAssembly,
    frontWheel,
    rearWheel,
    bodyMesh,
    riderGroup,
    headlight,
    taillight,
    tftDisplayMesh,
    isCar: false,
  };
}

/**
 * Builds a player-drivable high-performance sports car with 4 wheels, illuminated cockpit and headlights
 */
export function buildPlayerCar(spec: BikeSpec): BikeMeshHierarchy {
  const root = new THREE.Group();
  root.name = `Car_${spec.id}`;

  const bodyColor = new THREE.Color(spec.color);
  const secondaryColor = new THREE.Color(spec.secondaryColor);

  // Materials
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.18,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.5,
    metalness: 0.5,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.95,
    roughness: 0.1,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x07111c,
    roughness: 0.1,
    metalness: 0.3,
    transmission: 0.85,
    thickness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff1020 });

  const carWidth = 2.05;
  const carLength = 4.7;

  // 1. MAIN BODY CHASSIS
  const lowerBodyGeo = new THREE.BoxGeometry(carWidth, 0.48, carLength);
  const bodyMesh = new THREE.Mesh(lowerBodyGeo, paintMat);
  bodyMesh.position.y = 0.45;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Carbon Front Splitter
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(carWidth + 0.08, 0.05, 0.5), carbonMat);
  splitter.position.set(0, 0.22, carLength * 0.5 + 0.15);
  splitter.castShadow = true;
  root.add(splitter);

  // Carbon Side Skirts
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, carLength * 0.7), carbonMat);
  skirtL.position.set(-carWidth * 0.5 - 0.03, 0.22, 0);
  const skirtR = skirtL.clone();
  skirtR.position.x = carWidth * 0.5 + 0.03;
  root.add(skirtL, skirtR);

  // Aerodynamic Cabin / Greenhouse Glass
  const cabinGeo = new THREE.BoxGeometry(carWidth * 0.82, 0.48, carLength * 0.48);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.88, -0.2);
  cabin.castShadow = true;
  root.add(cabin);

  const isMuscle = spec.style === 'muscle';
  const isPolice = spec.style === 'police';
  const isDrift = spec.style === 'drift';
  const isHyper = spec.style === 'hypercar';

  // Painted Roof Panel
  const roofGeo = new THREE.BoxGeometry(carWidth * 0.78, 0.04, carLength * 0.42);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.13, -0.2);
  root.add(roof);

  // Police Emergency Strobe Lightbar on Roof
  if (isPolice) {
    const lightBarBase = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.55, 0.08, 0.16), carbonMat);
    lightBarBase.position.set(0, 1.19, -0.2);
    root.add(lightBarBase);

    const blueStrobeMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
    const blueStrobe = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.24, 0.07, 0.14), blueStrobeMat);
    blueStrobe.position.set(-carWidth * 0.13, 1.24, -0.2);
    root.add(blueStrobe);

    const redStrobeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const redStrobe = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.24, 0.07, 0.14), redStrobeMat);
    redStrobe.position.set(carWidth * 0.13, 1.24, -0.2);
    root.add(redStrobe);

    const blueLight = new THREE.PointLight(0x0088ff, 3.0, 20);
    blueLight.position.set(-0.35, 1.28, -0.2);
    root.add(blueLight);

    const redLight = new THREE.PointLight(0xff0044, 3.0, 20);
    redLight.position.set(0.35, 1.28, -0.2);
    root.add(redLight);

    // Front Heavy-Duty Police Bullbar
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.75, 0.38, 0.12), carbonMat);
    bullBar.position.set(0, 0.42, carLength * 0.5 + 0.18);
    root.add(bullBar);
  }

  // Muscle Car Hood Blower / Shaker Scoop & Racing Stripes
  if (isMuscle) {
    const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.65), chromeMat);
    blowerBase.position.set(0, 0.76, 1.1);
    root.add(blowerBase);

    // Triple Red Butterfly Flaps
    const flapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
    for (let f = 0; f < 3; f++) {
      const flap = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), flapMat);
      flap.position.set((f - 1) * 0.14, 0.78, 1.43);
      root.add(flap);
    }

    // Dual Racing Stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, carLength * 0.75), stripeMat);
    stripeL.position.set(-0.16, 0.7, 0.3);
    const stripeR = stripeL.clone();
    stripeR.position.x = 0.16;
    root.add(stripeL, stripeR);
  }

  // Rear Carbon Wing
  const wingHeight = isDrift ? 0.65 : 0.35;
  const wingPostL = new THREE.Mesh(new THREE.BoxGeometry(0.04, wingHeight, 0.15), carbonMat);
  wingPostL.position.set(-0.6, 0.8 + wingHeight * 0.5, -carLength * 0.5 + 0.3);
  const wingPostR = wingPostL.clone();
  wingPostR.position.x = 0.6;
  root.add(wingPostL, wingPostR);

  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(carWidth * (isDrift ? 1.05 : 0.92), 0.04, 0.32), carbonMat);
  wingBlade.position.set(0, 0.8 + wingHeight, -carLength * 0.5 + 0.3);
  wingBlade.castShadow = true;
  root.add(wingBlade);

  // Quad Exhaust Tips
  for (let side of [-1, 1]) {
    for (let offset of [-0.08, 0.08]) {
      const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12), chromeMat);
      exhaustTip.rotation.x = Math.PI / 2;
      exhaustTip.position.set(side * 0.45 + offset, 0.3, -carLength * 0.5 - 0.08);
      root.add(exhaustTip);
    }
  }

  // Headlights
  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), headlightMat);
  headL.position.set(-0.7, 0.52, carLength * 0.5 + 0.01);
  const headR = headL.clone();
  headR.position.x = 0.7;
  root.add(headL, headR);

  const headlight = new THREE.PointLight(0xe0f7ff, 3.0, 45);
  headlight.position.set(0, 0.55, carLength * 0.5 + 0.6);
  root.add(headlight);

  // Taillight Lightbar
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.88, 0.08, 0.05), taillightMat);
  tailBar.position.set(0, 0.62, -carLength * 0.5 - 0.01);
  root.add(tailBar);

  const taillight = new THREE.PointLight(0xff0022, 2.0, 10);
  taillight.position.set(0, 0.65, -carLength * 0.5 - 0.4);
  root.add(taillight);

  // Digital Cockpit Instrument Screen (Visible through windshield)
  const dashMat = new THREE.MeshBasicMaterial({ map: dashTexture });
  const tftDisplayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.15), dashMat);
  tftDisplayMesh.position.set(-0.35, 0.75, 0.35);
  tftDisplayMesh.rotation.x = -Math.PI / 5;
  root.add(tftDisplayMesh);

  // Sport Steering Wheel
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16), carbonMat);
  wheelRim.position.set(-0.35, 0.76, 0.18);
  wheelRim.rotation.x = -Math.PI / 4;
  root.add(wheelRim);

  // 2. 4 WHEELS (Steerable front wheels, driven rear wheels)
  const steerAssembly = new THREE.Group();
  steerAssembly.position.set(0, 0, 1.45);
  root.add(steerAssembly);

  // Front Wheels attached to SteerAssembly
  const frontLeftWheel = createMotorcycleWheel(0.35, 0.22);
  frontLeftWheel.position.set(-carWidth * 0.5, 0.35, 0);
  steerAssembly.add(frontLeftWheel);

  const frontRightWheel = createMotorcycleWheel(0.35, 0.22);
  frontRightWheel.position.set(carWidth * 0.5, 0.35, 0);
  frontRightWheel.scale.x = -1;
  steerAssembly.add(frontRightWheel);

  // Rear Wheels attached directly to car body
  const rearLeftWheel = createMotorcycleWheel(0.36, 0.26);
  rearLeftWheel.position.set(-carWidth * 0.5, 0.35, -1.45);
  root.add(rearLeftWheel);

  const rearRightWheel = createMotorcycleWheel(0.36, 0.26);
  rearRightWheel.position.set(carWidth * 0.5, 0.35, -1.45);
  rearRightWheel.scale.x = -1;
  root.add(rearRightWheel);

  root.position.y = 0;

  return {
    root,
    steerAssembly,
    frontWheel: frontLeftWheel,
    rearWheel: rearLeftWheel,
    bodyMesh,
    headlight,
    taillight,
    tftDisplayMesh,
    isCar: true,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
  };
}

/**
 * Universal Vehicle Builder: builds either a high-performance motorcycle or sports car
 */
export function buildVehicle(spec: BikeSpec): BikeMeshHierarchy {
  if (spec.vehicleType === 'car') {
    return buildPlayerCar(spec);
  }
  return buildMotorcycle(spec);
}
