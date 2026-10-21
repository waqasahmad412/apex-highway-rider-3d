import { BikeSpec, InputState } from '../types/game';
import { ROAD_WIDTH } from './EnvironmentBuilder';

export interface BikePhysicsState {
  x: number; // Lateral position (-ROAD_WIDTH/2 to +ROAD_WIDTH/2)
  y: number; // Vertical height (0 = ground)
  z: number; // Longitudinal distance along highway
  speed: number; // m/s
  speedKmh: number; // km/h
  rpm: number; // 1500 (idle) to 14000 (redline)
  rpmRatio: number; // 0 to 1
  gear: number; // 1 to 6
  leanAngle: number; // radians (-roll for left, +roll for right)
  pitchAngle: number; // radians (dive or squat)
  steerAngle: number; // radians (handlebar yaw)
  wheelRotation: number; // radians
  isCrashed: boolean;
  isWheelie: boolean;
  wheelieAngle: number;
  crashTimer: number; // duration since crash
  crashVelocity: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
}

export class BikePhysics {
  public state: BikePhysicsState;
  private spec: BikeSpec;

  // Physical constants
  private readonly GEAR_RATIOS = [3.2, 2.3, 1.8, 1.45, 1.2, 1.0];
  private readonly FINAL_DRIVE = 2.8;
  private readonly IDLE_RPM = 1600;
  private readonly MAX_RPM = 14500;
  private readonly TIRE_RADIUS = 0.33; // meters

  constructor(spec: BikeSpec) {
    this.spec = spec;
    this.state = this.getInitialState();
  }

  public setSpec(spec: BikeSpec): void {
    this.spec = spec;
  }

  public getInitialState(): BikePhysicsState {
    return {
      x: 0,
      y: 0,
      z: 0,
      speed: 0,
      speedKmh: 0,
      rpm: this.IDLE_RPM,
      rpmRatio: 0,
      gear: 1,
      leanAngle: 0,
      pitchAngle: 0,
      steerAngle: 0,
      wheelRotation: 0,
      isCrashed: false,
      isWheelie: false,
      wheelieAngle: 0,
      crashTimer: 0,
      crashVelocity: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
    };
  }

  public reset(xPos: number = 0, zPos?: number): void {
    const keepZ = zPos !== undefined ? zPos : this.state.z;
    this.state = {
      ...this.getInitialState(),
      x: Math.max(-ROAD_WIDTH * 0.4, Math.min(ROAD_WIDTH * 0.4, xPos)),
      z: keepZ,
    };
  }

  public triggerCrash(impactForce: { x: number; y: number; z: number }): void {
    if (this.state.isCrashed) return;
    this.state.isCrashed = true;
    this.state.crashTimer = 0;

    // Tumble and slide physics
    this.state.crashVelocity = {
      x: impactForce.x * 0.6 + (Math.random() - 0.5) * 8,
      y: Math.max(3.5, Math.abs(impactForce.y) + 3.0),
      z: Math.max(8.0, this.state.speed * 0.6),
      rx: (Math.random() - 0.5) * 12,
      ry: (Math.random() - 0.5) * 14,
      rz: (Math.random() - 0.5) * 10,
    };
  }

  public update(dt: number, input: InputState): void {
    // Clamp delta time to avoid large physics steps
    const safeDt = Math.min(dt, 0.05);

    if (this.state.isCrashed) {
      this.updateCrash(safeDt);
      return;
    }

    // Performance factors based on upgrades
    const engineBonus = 1 + this.spec.upgrades.engine * 0.08;
    const transBonus = 1 + this.spec.upgrades.transmission * 0.06;
    const brakeBonus = 1 + this.spec.upgrades.brakes * 0.1;
    const tireBonus = 1 + this.spec.upgrades.tires * 0.08;

    const maxSpeedKmh = this.spec.baseStats.topSpeed * engineBonus;
    const maxSpeedMs = maxSpeedKmh / 3.6;

    // 1. ACCELERATION & THROTTLE DYNAMICS
    const accelRating = this.spec.baseStats.acceleration * transBonus;
    // Base drive force in m/s^2 (snappy, immediate launch)
    const baseAccelForce = (accelRating / 100) * 16.5;

    // Torque curve: strong low-to-mid, tapering off at top speed
    const speedRatio = Math.min(this.state.speed / maxSpeedMs, 1.0);
    const torqueMult = Math.max(0.15, 1.0 - Math.pow(speedRatio, 1.6));

    let netAccel = 0;
    if (input.throttle > 0.01) {
      netAccel += input.throttle * baseAccelForce * torqueMult;
    }

    // 2. BRAKING & DECELERATION
    const brakingPower = (this.spec.baseStats.braking / 100) * 28.0 * brakeBonus;
    if (input.brake > 0.01) {
      netAccel -= input.brake * brakingPower;
    }
    if (input.handbrake) {
      netAccel -= brakingPower * 1.5;
    }

    // Aerodynamic drag + rolling resistance
    const dragCoeff = 0.0016;
    const dragForce = dragCoeff * this.state.speed * this.state.speed;
    const rollingResistance = 0.8;
    netAccel -= dragForce + rollingResistance;

    // Integrate forward speed
    this.state.speed += netAccel * safeDt;
    if (this.state.speed < 0) this.state.speed = 0;
    if (this.state.speed > maxSpeedMs) this.state.speed = maxSpeedMs;

    this.state.speedKmh = this.state.speed * 3.6;

    // Integrate forward distance
    this.state.z += this.state.speed * safeDt;

    // 3. GEAR RATIOS & RPM CALCULATION
    const currentSpeed = this.state.speedKmh;
    let gear = 1;
    if (currentSpeed > 240) gear = 6;
    else if (currentSpeed > 180) gear = 5;
    else if (currentSpeed > 130) gear = 4;
    else if (currentSpeed > 85) gear = 3;
    else if (currentSpeed > 45) gear = 2;
    this.state.gear = gear;

    // RPM based on speed within current gear
    const gearRatio = this.GEAR_RATIOS[gear - 1];
    const targetRpm = Math.min(
      this.MAX_RPM,
      Math.max(this.IDLE_RPM, (this.state.speed / (2 * Math.PI * this.TIRE_RADIUS)) * gearRatio * this.FINAL_DRIVE * 60)
    );
    // Smooth RPM response
    this.state.rpm += (targetRpm - this.state.rpm) * Math.min(1.0, safeDt * 14);
    this.state.rpmRatio = (this.state.rpm - this.IDLE_RPM) / (this.MAX_RPM - this.IDLE_RPM);

    // 4. STEERING & AUTHENTIC MOTORCYCLE LEAN
    const handlingScore = this.spec.baseStats.handling * tireBonus;
    const steerDir = input.steer; // -1 for Left, +1 for Right

    // Speed-dependent steer stability factor
    const speedFactor = 1.0 / (1.0 + Math.pow(this.state.speed / 35, 1.2));

    // Target lean angle: roll left on steer left, roll right on steer right
    const maxLeanAngle = (Math.PI / 180) * (42 + (handlingScore / 100) * 8); // ~46 to 50 degrees
    const targetLean = -steerDir * maxLeanAngle * Math.min(1.0, Math.max(0.2, this.state.speed / 8));

    // Lean roll interpolation (snappy, immediate response)
    const leanResponsiveness = 14.0 * (handlingScore / 100);
    this.state.leanAngle += (targetLean - this.state.leanAngle) * Math.min(1.0, safeDt * leanResponsiveness);

    // Handlebar steer angle
    const targetSteerAngle = -steerDir * 0.32 * Math.max(0.18, speedFactor);
    this.state.steerAngle += (targetSteerAngle - this.state.steerAngle) * Math.min(1.0, safeDt * 16);

    // Lateral velocity: direct responsive lane changing + lean angle carving
    if (this.state.speed > 0.2) {
      const lateralSpeed = steerDir * 7.5 * (handlingScore / 100) * Math.min(1.0, Math.max(0.35, this.state.speed / 10));
      this.state.x += lateralSpeed * safeDt;
    }

    // 5. ROAD BARRIER BOUNDARY COLLISION
    const halfRoad = ROAD_WIDTH * 0.5 - 0.45;
    if (this.state.x < -halfRoad) {
      this.state.x = -halfRoad;
      // High speed crash into guardrail
      if (this.state.speedKmh > 65) {
        this.triggerCrash({ x: 5, y: 3, z: -4 });
      } else {
        // Friction graze
        this.state.speed *= 0.7;
      }
    } else if (this.state.x > halfRoad) {
      this.state.x = halfRoad;
      if (this.state.speedKmh > 65) {
        this.triggerCrash({ x: -5, y: 3, z: -4 });
      } else {
        this.state.speed *= 0.7;
      }
    }

    // 6. SUSPENSION PITCH & WHEELIE (Lift front wheel into the air when Shift is pressed)
    let targetPitch = 0;
    let targetY = 0;

    const isDoingWheelie = input.wheelie && (this.state.speedKmh > 5 || input.throttle > 0.01);
    this.state.isWheelie = isDoingWheelie;

    if (isDoingWheelie) {
      // Rotate back ~38 degrees and elevate pivot so rear wheel stays on ground
      targetPitch = -0.65;
      targetY = 0.28;
      this.state.wheelieAngle = 0.65;
    } else {
      this.state.wheelieAngle = 0;
      if (input.brake > 0.1 && this.state.speed > 5) {
        targetPitch = 0.08 * input.brake; // dive forward
      } else if (input.throttle > 0.5 && this.state.speedKmh < 180) {
        targetPitch = -0.05 * input.throttle; // squat back
      }
    }

    const pitchLerpSpeed = isDoingWheelie ? 12.0 : 8.0;
    this.state.pitchAngle += (targetPitch - this.state.pitchAngle) * Math.min(1.0, safeDt * pitchLerpSpeed);
    this.state.y += (targetY - this.state.y) * Math.min(1.0, safeDt * pitchLerpSpeed);

    // 7. ROTATING WHEELS
    const angularVelocity = this.state.speed / this.TIRE_RADIUS;
    this.state.wheelRotation += angularVelocity * safeDt;
  }

  private updateCrash(dt: number): void {
    this.state.crashTimer += dt;

    // Apply gravity to crash velocity
    this.state.crashVelocity.y -= 9.81 * dt;
    // Friction on ground
    this.state.crashVelocity.x *= Math.pow(0.85, dt * 60);
    this.state.crashVelocity.z *= Math.pow(0.92, dt * 60);

    this.state.x += this.state.crashVelocity.x * dt;
    this.state.y += this.state.crashVelocity.y * dt;
    this.state.z += this.state.crashVelocity.z * dt;

    // Ground bounce / tumble
    if (this.state.y < 0) {
      this.state.y = 0;
      this.state.crashVelocity.y = -this.state.crashVelocity.y * 0.35; // bounce decay
      this.state.crashVelocity.rx *= 0.6;
      this.state.crashVelocity.ry *= 0.6;
      this.state.crashVelocity.rz *= 0.6;
    }

    // Tumble rotations
    this.state.pitchAngle += this.state.crashVelocity.rx * dt;
    this.state.steerAngle += this.state.crashVelocity.ry * dt;
    this.state.leanAngle += this.state.crashVelocity.rz * dt;

    this.state.speed = Math.max(0, this.state.crashVelocity.z);
    this.state.speedKmh = this.state.speed * 3.6;
    this.state.rpm = Math.max(0, this.state.rpm - dt * 5000);
    this.state.rpmRatio = 0;
  }
}
