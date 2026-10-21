import * as THREE from 'three';

export type TrafficType = 'sedan' | 'suv' | 'truck' | 'bus' | 'sport';

export interface TrafficVehicleMesh {
  root: THREE.Group;
  type: TrafficType;
  wheels: THREE.Group[];
  brakeLights: THREE.Mesh[];
  width: number;
  length: number;
  height: number;
}

const VEHICLE_COLORS = [
  0xd0d5dd, // Silver
  0x1e293b, // Midnight Slate
  0xffffff, // Alpine White
  0x1e3a8a, // Deep Royal Blue
  0xb91c1c, // Crimson
  0x047857, // Emerald Green
  0x475569, // Charcoal
  0xd97706, // Amber Gold
];

function createCarWheel(radius: number, width: number): THREE.Group {
  const group = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 12);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  group.add(tire);

  const hubGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width * 1.05, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  group.add(hub);

  return group;
}

export function buildTrafficVehicle(type: TrafficType): TrafficVehicleMesh {
  const root = new THREE.Group();
  const color = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];

  const paintMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.25,
    metalness: 0.6,
    clearcoat: 0.9,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111c24,
    roughness: 0.1,
    metalness: 0.2,
    transmission: 0.85,
    transparent: true,
    opacity: 0.8,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.9,
    roughness: 0.2,
  });

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

  const wheels: THREE.Group[] = [];
  const brakeLights: THREE.Mesh[] = [];

  let width = 1.9;
  let length = 4.4;
  let height = 1.45;

  if (type === 'sedan') {
    width = 1.9;
    length = 4.4;
    height = 1.4;

    // Main lower body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.65, length), paintMat);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    root.add(lowerBody);

    // Cabin / Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.55, length * 0.52), glassMat);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.05, length * 0.48), paintMat);
    roof.position.set(0, 1.34, -0.2);
    root.add(roof);

    // Wheels (4)
    const wheelPositions = [
      { x: -width * 0.5, y: 0.32, z: 1.3 },
      { x: width * 0.5, y: 0.32, z: 1.3 },
      { x: -width * 0.5, y: 0.32, z: -1.3 },
      { x: width * 0.5, y: 0.32, z: -1.3 },
    ];
    wheelPositions.forEach((pos) => {
      const w = createCarWheel(0.32, 0.22);
      w.position.set(pos.x, pos.y, pos.z);
      wheels.push(w);
      root.add(w);
    });

    // Lights
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), headlightMat);
    headL.position.set(-0.65, 0.55, length * 0.5);
    const headR = headL.clone();
    headR.position.x = 0.65;
    root.add(headL, headR);

    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), brakeLightMat);
    brakeL.position.set(-0.65, 0.65, -length * 0.5);
    const brakeR = brakeL.clone();
    brakeR.position.x = 0.65;
    brakeLights.push(brakeL, brakeR);
    root.add(brakeL, brakeR);
  } else if (type === 'suv') {
    width = 2.1;
    length = 4.8;
    height = 1.75;

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.85, length), paintMat);
    lowerBody.position.y = 0.72;
    lowerBody.castShadow = true;
    root.add(lowerBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.7, length * 0.62), glassMat);
    cabin.position.set(0, 1.35, -0.25);
    cabin.castShadow = true;
    root.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.06, length * 0.6), paintMat);
    roof.position.set(0, 1.72, -0.25);
    root.add(roof);

    // Roof rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, length * 0.5), trimMat);
    railL.position.set(-width * 0.4, 1.76, -0.25);
    const railR = railL.clone();
    railR.position.x = width * 0.4;
    root.add(railL, railR);

    // Wheels
    const wheelPositions = [
      { x: -width * 0.5, y: 0.4, z: 1.4 },
      { x: width * 0.5, y: 0.4, z: 1.4 },
      { x: -width * 0.5, y: 0.4, z: -1.4 },
      { x: width * 0.5, y: 0.4, z: -1.4 },
    ];
    wheelPositions.forEach((pos) => {
      const w = createCarWheel(0.4, 0.26);
      w.position.set(pos.x, pos.y, pos.z);
      wheels.push(w);
      root.add(w);
    });

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.05), headlightMat);
    headL.position.set(-0.7, 0.75, length * 0.5);
    const headR = headL.clone();
    headR.position.x = 0.7;
    root.add(headL, headR);

    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.05), brakeLightMat);
    brakeL.position.set(-0.75, 0.95, -length * 0.5);
    const brakeR = brakeL.clone();
    brakeR.position.x = 0.75;
    brakeLights.push(brakeL, brakeR);
    root.add(brakeL, brakeR);
  } else if (type === 'truck') {
    // Semi-truck tractor + long cargo container trailer
    width = 2.6;
    length = 13.5;
    height = 3.6;

    // Tractor Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(width, 2.4, 3.2), paintMat);
    cab.position.set(0, 1.8, length * 0.5 - 1.6);
    cab.castShadow = true;
    root.add(cab);

    // Windshield
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.9, 0.2), glassMat);
    cabGlass.position.set(0, 2.2, length * 0.5 - 0.05);
    root.add(cabGlass);

    // Chrome stacks
    const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), chromeMat);
    stackL.position.set(-width * 0.48, 2.6, length * 0.5 - 3.1);
    const stackR = stackL.clone();
    stackR.position.x = width * 0.48;
    root.add(stackL, stackR);

    // Giant Cargo Trailer Box
    const trailerMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.5,
      metalness: 0.4,
    });
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 2.8, 9.5), trailerMat);
    trailer.position.set(0, 2.2, -1.8);
    trailer.castShadow = true;
    root.add(trailer);

    // Trailer chassis
    const trailerFrame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.4, 10.0), trimMat);
    trailerFrame.position.set(0, 0.7, -1.8);
    root.add(trailerFrame);

    // Tandem Wheels: 2 front cab, 4 rear cab, 4 rear trailer = 10 wheel units
    const truckWheelPos = [
      { x: -width * 0.5, y: 0.52, z: length * 0.5 - 0.8 },
      { x: width * 0.5, y: 0.52, z: length * 0.5 - 0.8 },
      { x: -width * 0.5, y: 0.52, z: length * 0.5 - 2.8 },
      { x: width * 0.5, y: 0.52, z: length * 0.5 - 2.8 },
      { x: -width * 0.5, y: 0.52, z: -5.0 },
      { x: width * 0.5, y: 0.52, z: -5.0 },
      { x: -width * 0.5, y: 0.52, z: -6.2 },
      { x: width * 0.5, y: 0.52, z: -6.2 },
    ];
    truckWheelPos.forEach((pos) => {
      const w = createCarWheel(0.52, 0.32);
      w.position.set(pos.x, pos.y, pos.z);
      wheels.push(w);
      root.add(w);
    });

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), headlightMat);
    headL.position.set(-0.85, 0.8, length * 0.5);
    const headR = headL.clone();
    headR.position.x = 0.85;
    root.add(headL, headR);

    // Rear trailer brake lights
    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), brakeLightMat);
    brakeL.position.set(-0.9, 0.9, -6.6);
    const brakeR = brakeL.clone();
    brakeR.position.x = 0.9;
    brakeLights.push(brakeL, brakeR);
    root.add(brakeL, brakeR);
  } else if (type === 'bus') {
    width = 2.5;
    length = 10.5;
    height = 3.1;

    const busBody = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, length), paintMat);
    busBody.position.y = 1.6;
    busBody.castShadow = true;
    root.add(busBody);

    // Continuous glass window strip
    const windowStripL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, length * 0.9), glassMat);
    windowStripL.position.set(-width * 0.5 - 0.01, 2.0, 0);
    const windowStripR = windowStripL.clone();
    windowStripR.position.x = width * 0.5 + 0.01;
    root.add(windowStripL, windowStripR);

    // Front large windscreen
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 1.2, 0.05), glassMat);
    windshield.position.set(0, 1.8, length * 0.5 + 0.02);
    root.add(windshield);

    const busWheels = [
      { x: -width * 0.5, y: 0.48, z: 3.5 },
      { x: width * 0.5, y: 0.48, z: 3.5 },
      { x: -width * 0.5, y: 0.48, z: -3.5 },
      { x: width * 0.5, y: 0.48, z: -3.5 },
    ];
    busWheels.forEach((pos) => {
      const w = createCarWheel(0.48, 0.28);
      w.position.set(pos.x, pos.y, pos.z);
      wheels.push(w);
      root.add(w);
    });

    const headL = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), headlightMat);
    headL.position.set(-0.8, 0.8, length * 0.5 + 0.02);
    const headR = headL.clone();
    headR.position.x = 0.8;
    root.add(headL, headR);

    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.05), brakeLightMat);
    brakeL.position.set(-0.9, 1.2, -length * 0.5 - 0.02);
    const brakeR = brakeL.clone();
    brakeR.position.x = 0.9;
    brakeLights.push(brakeL, brakeR);
    root.add(brakeL, brakeR);
  } else {
    // Sport coupe
    width = 1.95;
    length = 4.3;
    height = 1.25;

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, length), paintMat);
    lowerBody.position.y = 0.45;
    lowerBody.castShadow = true;
    root.add(lowerBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.45, length * 0.48), glassMat);
    cabin.position.set(0, 0.85, -0.3);
    cabin.castShadow = true;
    root.add(cabin);

    // Rear spoiler wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.04, 0.25), trimMat);
    wing.position.set(0, 0.9, -length * 0.46);
    root.add(wing);

    const wheelPositions = [
      { x: -width * 0.5, y: 0.3, z: 1.25 },
      { x: width * 0.5, y: 0.3, z: 1.25 },
      { x: -width * 0.5, y: 0.3, z: -1.25 },
      { x: width * 0.5, y: 0.3, z: -1.25 },
    ];
    wheelPositions.forEach((pos) => {
      const w = createCarWheel(0.3, 0.24);
      w.position.set(pos.x, pos.y, pos.z);
      wheels.push(w);
      root.add(w);
    });

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.05), headlightMat);
    headL.position.set(-0.65, 0.5, length * 0.5);
    const headR = headL.clone();
    headR.position.x = 0.65;
    root.add(headL, headR);

    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.05), brakeLightMat);
    brakeL.position.set(-0.65, 0.55, -length * 0.5);
    const brakeR = brakeL.clone();
    brakeR.position.x = 0.65;
    brakeLights.push(brakeL, brakeR);
    root.add(brakeL, brakeR);
  }

  return {
    root,
    type,
    wheels,
    brakeLights,
    width,
    length,
    height,
  };
}
