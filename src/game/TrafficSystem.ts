import * as THREE from 'three';
import { TrafficType, TrafficVehicleMesh, buildTrafficVehicle } from './TrafficModels';
import { HIGHWAY_LANES_COUNT, HIGHWAY_LANE_WIDTH, ROAD_WIDTH } from './EnvironmentBuilder';
import { NearMissEvent } from '../types/game';

export interface TrafficEntity {
  id: number;
  mesh: TrafficVehicleMesh;
  type: TrafficType;
  lane: number; // 0 to 3
  x: number;
  y: number;
  z: number;
  speed: number; // m/s
  targetSpeed: number;
  targetLane: number;
  isChangingLane: boolean;
  laneChangeProgress: number; // 0 to 1
  laneChangeStartX: number;
  hasNearMissed: boolean;
}

export class TrafficSystem {
  private scene: THREE.Scene;
  private vehicles: TrafficEntity[] = [];
  private nextId: number = 1;
  private density: 'light' | 'normal' | 'dense' = 'normal';
  private spawnTimer: number = 0;
  private nearMissCombo: number = 0;
  private lastNearMissTime: number = 0;

  // Reusable math / vectors
  private _boxBike = new THREE.Box3();
  private _boxVehicle = new THREE.Box3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setDensity(density: 'light' | 'normal' | 'dense'): void {
    this.density = density;
  }

  public getLaneX(laneIndex: number): number {
    return -ROAD_WIDTH * 0.5 + HIGHWAY_LANE_WIDTH * (laneIndex + 0.5);
  }

  public clear(): void {
    for (const v of this.vehicles) {
      this.scene.remove(v.mesh.root);
    }
    this.vehicles = [];
    this.nearMissCombo = 0;
  }

  public initTraffic(playerZ: number): void {
    this.clear();
    const count = this.density === 'light' ? 8 : this.density === 'normal' ? 14 : 22;

    for (let i = 0; i < count; i++) {
      const spawnZ = playerZ + 40 + i * 22 + Math.random() * 15;
      const lane = Math.floor(Math.random() * HIGHWAY_LANES_COUNT);
      this.spawnVehicle(lane, spawnZ);
    }
  }

  private getRandomVehicleType(lane: number): TrafficType {
    // Trucks and buses mostly in right lanes (lanes 2, 3)
    if (lane >= 2 && Math.random() < 0.45) {
      return Math.random() < 0.6 ? 'truck' : 'bus';
    }
    const rand = Math.random();
    if (rand < 0.4) return 'sedan';
    if (rand < 0.7) return 'suv';
    if (rand < 0.85) return 'sport';
    return lane >= 2 ? 'truck' : 'sedan';
  }

  private getSpeedForType(type: TrafficType, lane: number): number {
    let speedKmh = 100;
    if (type === 'truck') speedKmh = 75 + Math.random() * 15;
    else if (type === 'bus') speedKmh = 85 + Math.random() * 12;
    else if (type === 'suv') speedKmh = 100 + Math.random() * 20;
    else if (type === 'sedan') speedKmh = 105 + Math.random() * 25;
    else if (type === 'sport') speedKmh = 125 + Math.random() * 30;

    // Fast lane (leftmost lane 0) traffic goes faster
    if (lane === 0) speedKmh += 20;
    else if (lane === 1) speedKmh += 10;

    return speedKmh / 3.6; // convert to m/s
  }

  private spawnVehicle(lane: number, zPos: number): TrafficEntity | null {
    // Check if spawn location is occupied
    const laneX = this.getLaneX(lane);
    for (const v of this.vehicles) {
      if (Math.abs(v.z - zPos) < 20 && Math.abs(v.x - laneX) < 2.0) {
        return null;
      }
    }

    const type = this.getRandomVehicleType(lane);
    const mesh = buildTrafficVehicle(type);
    const speed = this.getSpeedForType(type, lane);

    const entity: TrafficEntity = {
      id: this.nextId++,
      mesh,
      type,
      lane,
      x: laneX,
      y: 0,
      z: zPos,
      speed,
      targetSpeed: speed,
      targetLane: lane,
      isChangingLane: false,
      laneChangeProgress: 0,
      laneChangeStartX: laneX,
      hasNearMissed: false,
    };

    mesh.root.position.set(entity.x, entity.y, entity.z);
    this.scene.add(mesh.root);
    this.vehicles.push(entity);
    return entity;
  }

  public update(
    dt: number,
    playerX: number,
    playerZ: number,
    playerSpeedKmh: number,
    isPlayerCrashed: boolean,
    onNearMiss: (event: NearMissEvent) => void,
    onCollision: (impact: { x: number; y: number; z: number }) => void
  ): void {
    const safeDt = Math.min(dt, 0.05);

    // Spawning target count
    const targetCount = this.density === 'light' ? 9 : this.density === 'normal' ? 16 : 24;
    this.spawnTimer += safeDt;

    if (this.vehicles.length < targetCount && this.spawnTimer > 0.4) {
      this.spawnTimer = 0;
      const spawnLane = Math.floor(Math.random() * HIGHWAY_LANES_COUNT);
      // Spawn ahead between +140 and +240m
      const spawnZ = playerZ + 140 + Math.random() * 90;
      this.spawnVehicle(spawnLane, spawnZ);
    }

    // Player bounding box for collisions
    const playerHalfWidth = 0.42;
    const playerHalfLength = 1.05;
    const bikeMinX = playerX - playerHalfWidth;
    const bikeMaxX = playerX + playerHalfWidth;
    const bikeMinZ = playerZ - playerHalfLength;
    const bikeMaxZ = playerZ + playerHalfLength;

    const vehiclesToKeep: TrafficEntity[] = [];

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      // 1. DISTANCE KEEPING & LANE CHANGING AI
      // Look for any car ahead in the same lane
      let carAhead: TrafficEntity | null = null;
      let minAheadDist = Infinity;

      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.lane === v.lane && other.z > v.z) {
          const dist = other.z - v.z;
          if (dist < minAheadDist) {
            minAheadDist = dist;
            carAhead = other;
          }
        }
      }

      // If car ahead is close, slow down or initiate lane change
      if (carAhead && minAheadDist < 25) {
        v.speed = Math.max(v.speed * 0.95, carAhead.speed * 0.95);
        // Brake light activation
        for (const bl of v.mesh.brakeLights) {
          bl.scale.set(1.2, 1.2, 1.2);
        }

        // Attempt lane change if not already doing so
        if (!v.isChangingLane && Math.random() < 0.02) {
          // Prefer changing left if not in leftmost lane, otherwise right
          const targetLane = v.lane > 0 ? v.lane - 1 : v.lane + 1;
          // Check if target lane is clear
          let isClear = true;
          for (const other of this.vehicles) {
            if (other.lane === targetLane && Math.abs(other.z - v.z) < 22) {
              isClear = false;
              break;
            }
          }
          if (isClear) {
            v.isChangingLane = true;
            v.targetLane = targetLane;
            v.laneChangeStartX = v.x;
            v.laneChangeProgress = 0;
          }
        }
      } else {
        // Accelerate back to target speed
        v.speed += (v.targetSpeed - v.speed) * Math.min(1.0, safeDt * 1.5);
        for (const bl of v.mesh.brakeLights) {
          bl.scale.set(1.0, 1.0, 1.0);
        }
      }

      // Smooth lane changing interpolation
      if (v.isChangingLane) {
        v.laneChangeProgress += safeDt * 0.8;
        const targetX = this.getLaneX(v.targetLane);
        const t = Math.min(1.0, v.laneChangeProgress);
        // Smooth step
        const smoothT = t * t * (3 - 2 * t);
        v.x = v.laneChangeStartX + (targetX - v.laneChangeStartX) * smoothT;

        if (v.laneChangeProgress >= 1.0) {
          v.lane = v.targetLane;
          v.isChangingLane = false;
        }
      }

      // Move vehicle forward
      v.z += v.speed * safeDt;
      v.mesh.root.position.set(v.x, v.y, v.z);

      // Rotate wheels with speed
      const wheelOmega = v.speed / 0.35;
      for (const w of v.mesh.wheels) {
        w.rotation.x += wheelOmega * safeDt;
      }

      // 2. COLLISION DETECTION WITH PLAYER BIKE
      if (!isPlayerCrashed) {
        const vHalfW = v.mesh.width * 0.48;
        const vHalfL = v.mesh.length * 0.48;

        const vMinX = v.x - vHalfW;
        const vMaxX = v.x + vHalfW;
        const vMinZ = v.z - vHalfL;
        const vMaxZ = v.z + vHalfL;

        const isColliding = !(
          bikeMaxX < vMinX ||
          bikeMinX > vMaxX ||
          bikeMaxZ < vMinZ ||
          bikeMinZ > vMaxZ
        );

        if (isColliding) {
          const impact = {
            x: (playerX - v.x) * 6,
            y: 4.0,
            z: -(playerSpeedKmh / 3.6 - v.speed) * 0.8,
          };
          onCollision(impact);
        }

        // 3. NEAR-MISS DETECTION
        // Player passing closely at high speed without crashing
        if (!v.hasNearMissed && playerSpeedKmh > 75) {
          const latDist = Math.abs(playerX - v.x);
          const longDist = Math.abs(playerZ - v.z);
          // If laterally close (gap < 0.9m) and alongside vehicle
          if (latDist < vHalfW + playerHalfWidth + 0.9 && longDist < vHalfL + playerHalfLength + 0.5) {
            v.hasNearMissed = true;

            const now = performance.now();
            if (now - this.lastNearMissTime < 3500) {
              this.nearMissCombo++;
            } else {
              this.nearMissCombo = 1;
            }
            this.lastNearMissTime = now;

            const points = Math.round(100 * (playerSpeedKmh / 100) * this.nearMissCombo);
            onNearMiss({
              id: Date.now(),
              points,
              speedKmh: Math.round(playerSpeedKmh),
              combo: this.nearMissCombo,
              timestamp: now,
            });
          }
        }
      }

      // Despawn if fallen too far behind player or too far ahead
      if (v.z < playerZ - 50) {
        this.scene.remove(v.mesh.root);
      } else if (v.z > playerZ + 320) {
        this.scene.remove(v.mesh.root);
      } else {
        vehiclesToKeep.push(v);
      }
    }

    this.vehicles = vehiclesToKeep;
  }
}
