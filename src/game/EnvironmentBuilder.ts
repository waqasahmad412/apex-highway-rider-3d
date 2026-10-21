import * as THREE from 'three';
import { TimeOfDay } from '../types/game';

export const HIGHWAY_LANE_WIDTH = 3.8;
export const HIGHWAY_LANES_COUNT = 4;
export const ROAD_WIDTH = HIGHWAY_LANE_WIDTH * HIGHWAY_LANES_COUNT; // ~15.2m
export const CHUNK_LENGTH = 120; // 120 meters per procedural segment
export const CHUNKS_COUNT = 7; // Total active segments ahead and behind

export interface HighwayChunk {
  group: THREE.Group;
  chunkIndex: number;
  zCenter: number;
}

export interface EnvironmentSettings {
  timeOfDay: TimeOfDay;
  fogColor: number;
  skyColor: number;
  sunColor: number;
  sunIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
  wetRoad: boolean;
}

/**
 * Procedural asphalt texture with road noise
 */
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  // Noise grains
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 25;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 16);
  return texture;
}

const asphaltTexture = createAsphaltTexture();

export class EnvironmentBuilder {
  private scene: THREE.Scene;
  private chunks: HighwayChunk[] = [];
  private rainParticles: THREE.Points | null = null;
  private currentEnv: EnvironmentSettings;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private roadMaterial: THREE.MeshStandardMaterial;
  private barrierMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Default daylight environment
    this.currentEnv = this.getEnvPreset('noon');

    // Directional Sun Light
    this.dirLight = new THREE.DirectionalLight(this.currentEnv.sunColor, this.currentEnv.sunIntensity);
    this.dirLight.position.set(25, 45, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 180;
    this.dirLight.shadow.camera.left = -25;
    this.dirLight.shadow.camera.right = 25;
    this.dirLight.shadow.camera.top = 25;
    this.dirLight.shadow.camera.bottom = -25;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Cool fill hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x223344, 0.6);
    this.scene.add(this.hemiLight);

    // Common road materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x282c34,
      roughness: 0.7,
      metalness: 0.15,
      map: asphaltTexture,
    });

    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.35,
      metalness: 0.8,
    });

    this.setupRain();
  }

  public getEnvPreset(tod: TimeOfDay): EnvironmentSettings {
    switch (tod) {
      case 'sunset':
        return {
          timeOfDay: 'sunset',
          fogColor: 0xcc6633,
          skyColor: 0xaa4422,
          sunColor: 0xff8833,
          sunIntensity: 2.2,
          ambientColor: 0x442222,
          ambientIntensity: 0.5,
          wetRoad: false,
        };
      case 'night':
        return {
          timeOfDay: 'night',
          fogColor: 0x05070f,
          skyColor: 0x020308,
          sunColor: 0x445588, // Moon light
          sunIntensity: 0.4,
          ambientColor: 0x0a1020,
          ambientIntensity: 0.25,
          wetRoad: true, // reflective night streets
        };
      case 'rain':
        return {
          timeOfDay: 'rain',
          fogColor: 0x334455,
          skyColor: 0x223344,
          sunColor: 0x667788,
          sunIntensity: 0.7,
          ambientColor: 0x222a33,
          ambientIntensity: 0.45,
          wetRoad: true,
        };
      case 'noon':
      default:
        return {
          timeOfDay: 'noon',
          fogColor: 0xb5d8f7,
          skyColor: 0x87ceeb,
          sunColor: 0xfffaed,
          sunIntensity: 2.5,
          ambientColor: 0x556677,
          ambientIntensity: 0.65,
          wetRoad: false,
        };
    }
  }

  public setTimeOfDay(tod: TimeOfDay): void {
    this.currentEnv = this.getEnvPreset(tod);

    // Apply colors to scene fog and lights
    this.scene.background = new THREE.Color(this.currentEnv.skyColor);
    this.scene.fog = new THREE.FogExp2(this.currentEnv.fogColor, tod === 'rain' ? 0.015 : 0.0065);

    this.dirLight.color.setHex(this.currentEnv.sunColor);
    this.dirLight.intensity = this.currentEnv.sunIntensity;

    this.hemiLight.color.setHex(tod === 'night' ? 0x112244 : 0xddeeff);
    this.hemiLight.groundColor.setHex(this.currentEnv.ambientColor);
    this.hemiLight.intensity = this.currentEnv.ambientIntensity;

    // Road wetness roughness adjustment
    if (this.currentEnv.wetRoad) {
      this.roadMaterial.roughness = 0.2;
      this.roadMaterial.metalness = 0.5;
    } else {
      this.roadMaterial.roughness = 0.75;
      this.roadMaterial.metalness = 0.15;
    }

    if (this.rainParticles) {
      this.rainParticles.visible = tod === 'rain';
    }
  }

  private setupRain(): void {
    const rainCount = 4500;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public buildInitialHighway(): void {
    // Clear any previous chunks
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
    }
    this.chunks = [];

    // Spawn initial chunks centered around Z=0
    for (let i = -1; i < CHUNKS_COUNT - 1; i++) {
      const zCenter = i * CHUNK_LENGTH;
      const chunkGroup = this.createChunkMesh(i, zCenter);
      this.scene.add(chunkGroup);
      this.chunks.push({
        group: chunkGroup,
        chunkIndex: i,
        zCenter,
      });
    }
  }

  /**
   * Procedural chunk creation: road, stripes, barriers, scenery, overpasses, streetlights
   */
  private createChunkMesh(chunkIndex: number, zCenter: number): THREE.Group {
    const group = new THREE.Group();
    group.position.z = zCenter;

    // 1. ASPHALT ROAD SURFACE
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.position.y = 0;
    road.receiveShadow = true;
    group.add(road);

    // 2. CONCRETE SHOULDERS & CURBS
    const shoulderWidth = 2.5;
    const curbGeo = new THREE.BoxGeometry(shoulderWidth, 0.18, CHUNK_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-ROAD_WIDTH * 0.5 - shoulderWidth * 0.5, 0.08, 0);
    leftCurb.receiveShadow = true;
    group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(ROAD_WIDTH * 0.5 + shoulderWidth * 0.5, 0.08, 0);
    rightCurb.receiveShadow = true;
    group.add(rightCurb);

    // 3. ROAD STRIPES & MARKINGS
    // White/Yellow side solid lines
    const sideStripeGeo = new THREE.PlaneGeometry(0.2, CHUNK_LENGTH);
    sideStripeGeo.rotateX(-Math.PI / 2);
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const leftStripe = new THREE.Mesh(sideStripeGeo, yellowStripeMat);
    leftStripe.position.set(-ROAD_WIDTH * 0.5 + 0.2, 0.015, 0);
    group.add(leftStripe);

    const rightStripe = new THREE.Mesh(sideStripeGeo, whiteStripeMat);
    rightStripe.position.set(ROAD_WIDTH * 0.5 - 0.2, 0.015, 0);
    group.add(rightStripe);

    // Dashed lane dividers for internal lanes (3 divider lines for 4 lanes)
    const dashLength = 4.0;
    const dashGap = 6.0;
    const numDashes = Math.floor(CHUNK_LENGTH / (dashLength + dashGap));

    for (let l = 1; l < HIGHWAY_LANES_COUNT; l++) {
      const laneX = -ROAD_WIDTH * 0.5 + l * HIGHWAY_LANE_WIDTH;
      for (let d = 0; d < numDashes; d++) {
        const dashGeo = new THREE.PlaneGeometry(0.18, dashLength);
        dashGeo.rotateX(-Math.PI / 2);
        const dash = new THREE.Mesh(dashGeo, whiteStripeMat);
        const dashZ = -CHUNK_LENGTH * 0.5 + d * (dashLength + dashGap) + dashLength * 0.5;
        dash.position.set(laneX, 0.015, dashZ);
        group.add(dash);
      }
    }

    // 4. GUARDRAILS / CRASH BARRIERS
    const barrierHeight = 0.9;
    const barrierRailGeo = new THREE.BoxGeometry(0.15, 0.25, CHUNK_LENGTH);

    const leftRail = new THREE.Mesh(barrierRailGeo, this.barrierMaterial);
    leftRail.position.set(-ROAD_WIDTH * 0.5 - shoulderWidth + 0.1, barrierHeight * 0.7, 0);
    leftRail.castShadow = true;
    group.add(leftRail);

    const rightRail = new THREE.Mesh(barrierRailGeo, this.barrierMaterial);
    rightRail.position.set(ROAD_WIDTH * 0.5 + shoulderWidth - 0.1, barrierHeight * 0.7, 0);
    rightRail.castShadow = true;
    group.add(rightRail);

    // Guardrail support posts every 8 meters
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, barrierHeight, 8);
    for (let p = -CHUNK_LENGTH * 0.5; p <= CHUNK_LENGTH * 0.5; p += 8) {
      const postL = new THREE.Mesh(postGeo, this.barrierMaterial);
      postL.position.set(-ROAD_WIDTH * 0.5 - shoulderWidth + 0.1, barrierHeight * 0.5, p);
      group.add(postL);

      const postR = new THREE.Mesh(postGeo, this.barrierMaterial);
      postR.position.set(ROAD_WIDTH * 0.5 + shoulderWidth - 0.1, barrierHeight * 0.5, p);
      group.add(postR);
    }

    // 5. HIGHWAY STREETLIGHTS (every 40 meters)
    for (let s = -CHUNK_LENGTH * 0.5 + 20; s < CHUNK_LENGTH * 0.5; s += 40) {
      const pole = this.createStreetlight();
      pole.position.set(ROAD_WIDTH * 0.5 + shoulderWidth + 0.8, 0, s);
      group.add(pole);

      const poleOpposite = this.createStreetlight();
      poleOpposite.scale.x = -1;
      poleOpposite.position.set(-ROAD_WIDTH * 0.5 - shoulderWidth - 0.8, 0, s + 20);
      group.add(poleOpposite);
    }

    // 6. OVERHEAD HIGHWAY SIGN GANTRY OR BRIDGE (on certain chunks)
    if (Math.abs(chunkIndex) % 3 === 1) {
      const gantry = this.createHighwayGantry();
      gantry.position.set(0, 0, 0);
      group.add(gantry);
    } else if (Math.abs(chunkIndex) % 4 === 2) {
      const bridge = this.createOverpassBridge();
      bridge.position.set(0, 0, 15);
      group.add(bridge);
    }

    // 7. ROADSIDE TERRAIN & TREES / BUILDINGS
    this.populateRoadsideProps(group, chunkIndex);

    return group;
  }

  private createStreetlight(): THREE.Group {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    // Vertical pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 9.5, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 4.75;
    group.add(pole);

    // Arch arm over road
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8);
    armGeo.rotateZ(Math.PI / 3);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(-1.6, 9.2, 0);
    group.add(arm);

    // Luminaire lamp head
    const lampGeo = new THREE.BoxGeometry(0.8, 0.15, 0.35);
    const lamp = new THREE.Mesh(lampGeo, poleMat);
    lamp.position.set(-3.2, 9.9, 0);
    group.add(lamp);

    // Glowing LED lens
    const lensGeo = new THREE.PlaneGeometry(0.7, 0.28);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(-3.2, 9.82, 0);
    group.add(lens);

    return group;
  }

  private createHighwayGantry(): THREE.Group {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.9, roughness: 0.2 });

    const span = ROAD_WIDTH + 8;
    const height = 7.5;

    // Left and right pillars
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, height, 12);
    const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
    leftPillar.position.set(-span * 0.5, height * 0.5, 0);
    group.add(leftPillar);

    const rightPillar = leftPillar.clone();
    rightPillar.position.x = span * 0.5;
    group.add(rightPillar);

    // Overhead truss beam
    const beamGeo = new THREE.BoxGeometry(span, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, frameMat);
    beam.position.set(0, height, 0);
    group.add(beam);

    // Green highway signboard canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#065f46'; // Interstate green
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('SPEEDWAY 101 NORTH', 30, 55);

    ctx.font = '24px sans-serif';
    ctx.fillText('EXIT 14A · AIRPORT / CITY CTR  2 KM', 30, 95);

    const signTex = new THREE.CanvasTexture(canvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });

    const signGeo = new THREE.PlaneGeometry(8, 2);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, height + 0.2, 0.45);
    group.add(sign);

    return group;
  }

  private createOverpassBridge(): THREE.Group {
    const group = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.1 });

    const span = ROAD_WIDTH + 14;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 2.2, 9), concreteMat);
    deck.position.set(0, 7.5, 0);
    deck.castShadow = true;
    group.add(deck);

    // Pillars
    const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 7.0, 16);
    const colL = new THREE.Mesh(colGeo, concreteMat);
    colL.position.set(-span * 0.45, 3.5, 0);
    group.add(colL);

    const colR = colL.clone();
    colR.position.x = span * 0.45;
    group.add(colR);

    return group;
  }

  private populateRoadsideProps(group: THREE.Group, chunkIndex: number): void {
    // Pine/Palm trees along the embankment
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    for (let side of [-1, 1]) {
      for (let z = -CHUNK_LENGTH * 0.5 + 5; z < CHUNK_LENGTH * 0.5; z += 18) {
        const xOffset = side * (ROAD_WIDTH * 0.5 + 8 + Math.random() * 14);
        const treeGroup = new THREE.Group();

        // Trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.5, 8), trunkMat);
        trunk.position.y = 1.75;
        treeGroup.add(trunk);

        // Foliage cones
        const cone1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.8, 8), foliageMat);
        cone1.position.y = 4.2;
        treeGroup.add(cone1);

        const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 8), foliageMat);
        cone2.position.y = 6.0;
        treeGroup.add(cone2);

        treeGroup.position.set(xOffset, 0, z + (Math.random() - 0.5) * 6);
        const scale = 0.8 + Math.random() * 0.5;
        treeGroup.scale.set(scale, scale, scale);
        group.add(treeGroup);
      }
    }

    // Distant background skyscrapers / mountain silhouettes on left and right
    if (Math.abs(chunkIndex) % 2 === 0) {
      const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
      for (let side of [-1, 1]) {
        const bHeight = 30 + Math.random() * 50;
        const bWidth = 15 + Math.random() * 15;
        const bDepth = 15 + Math.random() * 15;
        const building = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), buildingMat);
        building.position.set(side * (ROAD_WIDTH + 60 + Math.random() * 40), bHeight * 0.5, (Math.random() - 0.5) * 60);
        group.add(building);
      }
    }
  }

  /**
   * Endless road chunk update: recycle chunks that fall behind player bike
   */
  public updateHighway(bikeZ: number, dt: number): void {
    // Update directional light to follow bike smoothly
    this.dirLight.position.z = bikeZ + 30;
    this.dirLight.target.position.z = bikeZ;
    this.dirLight.target.updateMatrixWorld();

    // Check if chunks need recycling
    // Find min and max chunk
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const chunk of this.chunks) {
      if (chunk.zCenter < minZ) minZ = chunk.zCenter;
      if (chunk.zCenter > maxZ) maxZ = chunk.zCenter;
    }

    // Player travels in positive Z direction
    // If a chunk is further behind player than CHUNK_LENGTH * 1.5, move it ahead
    for (const chunk of this.chunks) {
      if (chunk.zCenter < bikeZ - CHUNK_LENGTH * 1.5) {
        const nextZ = maxZ + CHUNK_LENGTH;
        chunk.group.position.z = nextZ;
        chunk.zCenter = nextZ;
        maxZ = nextZ;
      }
    }

    // Update rain particle positions if rain is active
    if (this.rainParticles && this.rainParticles.visible) {
      const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= dt * 65; // fall speed
        positions[i + 2] -= dt * 30; // wind streak relative to bike
        if (positions[i + 1] < 0) {
          positions[i + 1] = 40;
          positions[i] = (Math.random() - 0.5) * 80;
          positions[i + 2] = bikeZ + (Math.random() - 0.3) * 120;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
