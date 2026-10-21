import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BikeSpec, CameraViewMode, GameModeType, GameSettings, InputState, NearMissEvent, TimeOfDay } from '../types/game';
import { BikeMeshHierarchy, buildMotorcycle, buildVehicle } from './BikeModels';
import { BikePhysics } from './BikePhysics';
import { EnvironmentBuilder } from './EnvironmentBuilder';
import { TrafficSystem } from './TrafficSystem';
import { soundManager } from '../audio/SoundManager';

export interface TelemetryData {
  speedKmh: number;
  rpm: number;
  rpmRatio: number;
  gear: number;
  distanceMeters: number;
  timeRemaining?: number;
  nearMissCount: number;
  nearMissPoints: number;
  isCrashed: boolean;
  isWheelie: boolean;
  activeCamera: CameraViewMode;
  objectiveProgress?: {
    current: number;
    target: number;
    label: string;
    completed: boolean;
  };
}

export class GameEngine {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private environmentBuilder: EnvironmentBuilder;
  private trafficSystem: TrafficSystem;
  private bikePhysics: BikePhysics;
  private bikeHierarchy: BikeMeshHierarchy | null = null;

  // Active configurations
  private currentBikeSpec: BikeSpec;
  private currentSettings: GameSettings;
  private currentMode: GameModeType = 'free_ride';
  private currentTimeOfDay: TimeOfDay = 'noon';
  private cameraMode: CameraViewMode = 'chase';

  // Animation & loop
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game Mode State
  private rideStartTime: number = 0;
  private timeRemaining: number = 60;
  private nearMissPoints: number = 0;
  private nearMissCount: number = 0;
  private missionTargetValue: number = 0;
  private missionCompleted: boolean = false;

  // Input
  private inputState: InputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    wheelie: false,
    horn: false,
    resetBike: false,
    changeCamera: false,
  };
  private touchInputState: InputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    wheelie: false,
    horn: false,
    resetBike: false,
    changeCamera: false,
  };
  private tiltSteer: number = 0;
  private keyboardKeys: Record<string, boolean> = {};

  // Camera Shake & Smoothing
  private cameraShakeIntensity: number = 0;
  private cameraTargetPos = new THREE.Vector3();
  private cameraLookAtTarget = new THREE.Vector3();

  // Callbacks to React
  private onTelemetryUpdate?: (data: TelemetryData) => void;
  private onNearMissEvent?: (event: NearMissEvent) => void;
  private onCrashEvent?: () => void;
  private onMissionVictory?: (rewardCoins: number) => void;

  constructor(
    container: HTMLDivElement,
    initialBike: BikeSpec,
    initialSettings: GameSettings,
    mode: GameModeType = 'free_ride',
    timeOfDay: TimeOfDay = 'noon',
    callbacks?: {
      onTelemetry?: (data: TelemetryData) => void;
      onNearMiss?: (event: NearMissEvent) => void;
      onCrash?: () => void;
      onVictory?: (rewardCoins: number) => void;
    }
  ) {
    this.container = container;
    this.currentBikeSpec = initialBike;
    this.currentSettings = initialSettings;
    this.currentMode = mode;
    this.currentTimeOfDay = timeOfDay;

    if (callbacks) {
      this.onTelemetryUpdate = callbacks.onTelemetry;
      this.onNearMissEvent = callbacks.onNearMiss;
      this.onCrashEvent = callbacks.onCrash;
      this.onMissionVictory = callbacks.onVictory;
    }

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: initialSettings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialSettings.graphicsQuality === 'high' ? 2 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = initialSettings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      initialSettings.cameraFov,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 2.0, -4.5);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 1.2, 12);

    // 3. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Subsystems
    this.environmentBuilder = new EnvironmentBuilder(this.scene);
    this.environmentBuilder.setTimeOfDay(timeOfDay);
    this.environmentBuilder.buildInitialHighway();

    this.trafficSystem = new TrafficSystem(this.scene);
    this.trafficSystem.setDensity(initialSettings.trafficDensity);

    this.bikePhysics = new BikePhysics(this.currentBikeSpec);

    // 5. Build Player Bike
    this.loadBike(this.currentBikeSpec);

    // 6. Setup Inputs & Resize
    this.setupEventListeners();

    // Compile renderer shaders
    this.renderer.compile(this.scene, this.camera);
  }

  public setMode(mode: GameModeType, timeOfDay: TimeOfDay = 'noon', targetVal: number = 0, timeLimit?: number): void {
    this.currentMode = mode;
    this.currentTimeOfDay = timeOfDay;
    this.missionTargetValue = targetVal;
    this.timeRemaining = timeLimit || 60;
    this.missionCompleted = false;
    this.nearMissPoints = 0;
    this.nearMissCount = 0;

    this.environmentBuilder.setTimeOfDay(timeOfDay);
    this.trafficSystem.setDensity(
      mode === 'traffic_challenge' ? 'dense' : mode === 'practice' ? 'light' : this.currentSettings.trafficDensity
    );
    this.resetRide();
  }

  public loadBike(spec: BikeSpec): void {
    if (this.bikeHierarchy) {
      this.scene.remove(this.bikeHierarchy.root);
    }
    this.currentBikeSpec = spec;
    this.bikePhysics.setSpec(spec);
    this.bikeHierarchy = buildVehicle(spec);
    this.scene.add(this.bikeHierarchy.root);
  }

  public setSettings(settings: GameSettings): void {
    this.currentSettings = settings;
    this.camera.fov = settings.cameraFov;
    this.camera.updateProjectionMatrix();
    this.trafficSystem.setDensity(settings.trafficDensity);
    soundManager.setVolumes(settings.engineVolume, settings.sfxVolume, settings.musicVolume);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1.5));
    this.renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
  }

  public setCameraMode(mode: CameraViewMode): void {
    this.cameraMode = mode;
  }

  public cycleCamera(): CameraViewMode {
    const modes: CameraViewMode[] = ['chase', 'helmet', 'handlebar', 'cinematic'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[nextIdx];
    soundManager.playUiClick();
    return this.cameraMode;
  }

  public resetRide(): void {
    this.bikePhysics.reset(0, 0);
    this.trafficSystem.initTraffic(0);
    this.environmentBuilder.buildInitialHighway();
    this.rideStartTime = performance.now();
    this.missionCompleted = false;
    this.camera.position.set(0, 2.0, -4.5);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 1.2, 12);
  }

  public recoverFromCrash(): void {
    // Keep distance, reset to center of lane upright
    const currentZ = this.bikePhysics.state.z;
    this.bikePhysics.reset(0, currentZ);
    this.camera.position.set(0, 2.0, currentZ - 4.5);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 1.2, currentZ + 12);
    soundManager.playUiClick();
  }

  public setExternalInput(partial: Partial<InputState>): void {
    this.touchInputState = { ...this.touchInputState, ...partial };
  }

  private handleWindowBlur = (): void => {
    this.keyboardKeys = {};
    this.touchInputState = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      wheelie: false,
      horn: false,
      resetBike: false,
      changeCamera: false,
    };
  };

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('resize', this.handleResize);

    // Device Tilt Steering (Android gyroscope)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleDeviceOrientation);
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Prevent default browser scrolling when using game keys
    if (['Space', 'Enter', 'NumpadEnter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    this.keyboardKeys[e.code] = true;

    // Audio unlock on user key press
    soundManager.init();
    soundManager.resume();

    if (e.code === 'KeyC') {
      this.cycleCamera();
    }
    if (e.code === 'KeyR') {
      if (this.bikePhysics.state.isCrashed) {
        this.recoverFromCrash();
      }
    }
    if (e.code === 'KeyH') {
      soundManager.playHorn();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (['Space', 'Enter', 'NumpadEnter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    this.keyboardKeys[e.code] = false;
  };

  private handleDeviceOrientation = (e: DeviceOrientationEvent): void => {
    if (this.currentSettings.controlType !== 'tilt') return;
    if (e.gamma !== null) {
      // Gamma is left-to-right tilt in degrees (-90 to +90)
      const tilt = Math.max(-1, Math.min(1, (e.gamma / 25) * this.currentSettings.tiltSensitivity));
      this.tiltSteer = tilt;
    }
  };

  private handleResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private pollInput(): void {
    // 1. Keyboard mappings (Fresh per-frame evaluation)
    let kThrottle = 0;
    let kBrake = 0;
    let kSteer = 0;
    let kHandbrake = false;

    // Space / W / Up Arrow: Throttle & Acceleration
    if (this.keyboardKeys['Space'] || this.keyboardKeys['KeyW'] || this.keyboardKeys['ArrowUp']) {
      kThrottle = 1.0;
    }

    // Enter / S / Down Arrow: Brake & Stop
    if (this.keyboardKeys['Enter'] || this.keyboardKeys['NumpadEnter'] || this.keyboardKeys['KeyS'] || this.keyboardKeys['ArrowDown']) {
      kBrake = 1.0;
    }

    // A / Left Arrow: Steer Left
    if (this.keyboardKeys['KeyA'] || this.keyboardKeys['ArrowLeft']) {
      kSteer -= 1.0;
    }

    // D / Right Arrow: Steer Right
    if (this.keyboardKeys['KeyD'] || this.keyboardKeys['ArrowRight']) {
      kSteer += 1.0;
    }

    // Shift (ShiftLeft / ShiftRight): Wheelie (Lift front wheel up on rear wheel)
    const kWheelie = !!(this.keyboardKeys['ShiftLeft'] || this.keyboardKeys['ShiftRight']);

    // 2. Gamepad API
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp) {
      if (gp.buttons[7] && gp.buttons[7].value > 0.05) {
        kThrottle = Math.max(kThrottle, gp.buttons[7].value);
      }
      if (gp.buttons[6] && gp.buttons[6].value > 0.05) {
        kBrake = Math.max(kBrake, gp.buttons[6].value);
      }
      if (Math.abs(gp.axes[0]) > 0.1) {
        kSteer = gp.axes[0];
      }
      // B button wheelie on gamepad
      if (gp.buttons[1] && gp.buttons[1].pressed) {
        this.inputState.wheelie = true;
      }
      if (gp.buttons[0] && gp.buttons[0].pressed && this.bikePhysics.state.isCrashed) {
        this.recoverFromCrash();
      }
      if (gp.buttons[3] && gp.buttons[3].pressed) {
        this.cycleCamera();
      }
    }

    // 3. Cleanly resolve combined inputs each frame
    this.inputState.throttle = Math.max(kThrottle, this.touchInputState.throttle);
    this.inputState.brake = Math.max(kBrake, this.touchInputState.brake);
    this.inputState.wheelie = kWheelie || this.touchInputState.wheelie;

    if (this.currentSettings.controlType === 'tilt') {
      this.inputState.steer = this.tiltSteer;
    } else {
      // Prioritize active keyboard input, otherwise touch button
      if (Math.abs(kSteer) > 0.05) {
        this.inputState.steer = kSteer;
      } else {
        this.inputState.steer = this.touchInputState.steer;
      }
    }

    this.inputState.handbrake = kHandbrake || this.touchInputState.handbrake;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.resetRide();
    this.loop();
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.clock.start();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // 1. Input update
    this.pollInput();

    // 2. Physics update
    this.bikePhysics.update(dt, this.inputState);
    const bikeState = this.bikePhysics.state;

    // 3. Traffic update & Near-miss detection
    this.trafficSystem.update(
      dt,
      bikeState.x,
      bikeState.z,
      bikeState.speedKmh,
      bikeState.isCrashed,
      (nearMiss) => {
        this.nearMissPoints += nearMiss.points;
        this.nearMissCount++;
        soundManager.playNearMiss();
        if (this.onNearMissEvent) {
          this.onNearMissEvent(nearMiss);
        }
      },
      (impact) => {
        if (!bikeState.isCrashed) {
          this.bikePhysics.triggerCrash(impact);
          this.cameraShakeIntensity = 1.5;
          soundManager.playCrash();
          if (this.onCrashEvent) {
            this.onCrashEvent();
          }
        }
      }
    );

    // 4. Highway Chunks Update
    this.environmentBuilder.updateHighway(bikeState.z, dt);

    // 5. Sync 3D Motorcycle Mesh with Physics State
    if (this.bikeHierarchy) {
      const { root, steerAssembly, frontWheel, rearWheel, riderGroup, taillight } = this.bikeHierarchy;

      // Position
      root.position.set(bikeState.x, bikeState.y, bikeState.z);

      if (this.bikeHierarchy.isCar) {
        // Cars roll slightly into turns (body roll) and pitch gently (dive/squat)
        root.rotation.set(bikeState.pitchAngle * 0.45, 0, bikeState.leanAngle * 0.15);
      } else {
        // Motorcycle full lean & pitch
        root.rotation.set(bikeState.pitchAngle, 0, bikeState.leanAngle);
      }

      // Steering fork / front wheels rotation
      steerAssembly.rotation.y = bikeState.steerAngle;

      // Wheel rotation
      frontWheel.rotation.x = bikeState.wheelRotation;
      rearWheel.rotation.x = bikeState.wheelRotation;

      if (this.bikeHierarchy.frontRightWheel) {
        this.bikeHierarchy.frontRightWheel.rotation.x = bikeState.wheelRotation;
      }
      if (this.bikeHierarchy.rearRightWheel) {
        this.bikeHierarchy.rearRightWheel.rotation.x = bikeState.wheelRotation;
      }

      // Rider body (if motorcycle rider exists)
      if (riderGroup) {
        riderGroup.rotation.z = bikeState.leanAngle * 0.35;
      }

      // Taillight glow intensifies under braking
      if (this.inputState.brake > 0.1) {
        taillight.intensity = 3.5;
      } else {
        taillight.intensity = 1.2;
      }
    }

    // 6. Camera Update
    this.updateCamera(dt, bikeState);

    // 7. Audio Update
    soundManager.updateBikeSound(
      bikeState.rpmRatio,
      bikeState.speedKmh,
      this.inputState.throttle,
      this.inputState.brake > 0.1,
      bikeState.isCrashed
    );

    // 8. Game Mode Objectives & Time limits
    if (this.currentMode === 'time_trial' && !bikeState.isCrashed) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.bikePhysics.triggerCrash({ x: 0, y: 1, z: 0 });
      }
    }

    // Check career mission victory conditions
    let objectiveProgress: TelemetryData['objectiveProgress'];
    if (this.currentMode === 'career' && !this.missionCompleted) {
      if (this.missionTargetValue > 0) {
        const currentDist = Math.floor(bikeState.z);
        const isDone = currentDist >= this.missionTargetValue;
        objectiveProgress = {
          current: currentDist,
          target: this.missionTargetValue,
          label: 'DISTANCE (M)',
          completed: isDone,
        };
        if (isDone) {
          this.missionCompleted = true;
          if (this.onMissionVictory) this.onMissionVictory(1000);
        }
      }
    }

    // 9. Notify UI Telemetry
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        speedKmh: Math.round(bikeState.speedKmh),
        rpm: Math.round(bikeState.rpm),
        rpmRatio: bikeState.rpmRatio,
        gear: bikeState.gear,
        distanceMeters: Math.floor(bikeState.z),
        timeRemaining: this.currentMode === 'time_trial' ? Math.ceil(this.timeRemaining) : undefined,
        nearMissCount: this.nearMissCount,
        nearMissPoints: this.nearMissPoints,
        isCrashed: bikeState.isCrashed,
        isWheelie: bikeState.isWheelie,
        activeCamera: this.cameraMode,
        objectiveProgress,
      });
    }

    // 10. Render Frame
    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(dt: number, bikeState: ReturnType<typeof this.bikePhysics.getInitialState>): void {
    const bikeX = bikeState.x;
    const bikeY = bikeState.y;
    const bikeZ = bikeState.z;
    const speedRatio = Math.min(bikeState.speedKmh / 300, 1.0);

    // Camera shake decay
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.5);
    }
    const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.25;
    const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.25;

    // Dynamic FOV: adrenaline tunnel vision at high speeds!
    const targetFov = this.currentSettings.cameraFov + speedRatio * 18;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 5);
    this.camera.updateProjectionMatrix();

    const isCar = !!this.bikeHierarchy?.isCar;

    switch (this.cameraMode) {
      case 'chase': {
        // Dynamic chase cam: pulls back slightly at high speed, smooth damp follow
        const chaseDistance = (isCar ? 5.8 : 4.2) + speedRatio * 1.5;
        const chaseHeight = (isCar ? 2.4 : 1.9) + speedRatio * 0.4;

        this.cameraTargetPos.set(
          bikeX * 0.85 + shakeX,
          bikeY + chaseHeight + shakeY,
          bikeZ - chaseDistance
        );

        this.cameraLookAtTarget.set(
          bikeX * 0.5,
          bikeY + (isCar ? 1.0 : 1.2),
          bikeZ + 12
        );

        // Smooth exponential damping
        this.camera.position.lerp(this.cameraTargetPos, Math.min(1.0, dt * 10));
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.cameraLookAtTarget);
        if (Math.abs(bikeState.leanAngle) > 0.001) {
          this.camera.rotateZ(bikeState.leanAngle * (isCar ? 0.04 : 0.12));
        }
        break;
      }
      case 'helmet': {
        // 1st person inside rider helmet OR car driver seat
        this.camera.position.set(
          isCar ? bikeX - 0.35 + shakeX * 0.3 : bikeX + shakeX * 0.4,
          isCar ? bikeY + 0.98 + shakeY * 0.3 : bikeY + 1.35 + shakeY * 0.4,
          isCar ? bikeZ + 0.1 : bikeZ + 0.15
        );
        this.cameraLookAtTarget.set(
          bikeX + Math.sin(bikeState.steerAngle) * 2,
          bikeY + (isCar ? 0.9 : 1.25),
          bikeZ + 25
        );
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.cameraLookAtTarget);
        if (Math.abs(bikeState.leanAngle) > 0.001) {
          this.camera.rotateZ(bikeState.leanAngle * (isCar ? 0.05 : 0.25));
        }
        break;
      }
      case 'handlebar': {
        // Directly on top of digital dash looking over front wheel OR hood for cars
        this.camera.position.set(
          bikeX + shakeX * 0.3,
          isCar ? bikeY + 0.88 + shakeY * 0.3 : bikeY + 0.95 + shakeY * 0.3,
          isCar ? bikeZ + 1.1 : bikeZ + 0.55
        );
        this.cameraLookAtTarget.set(
          bikeX,
          bikeY + (isCar ? 0.75 : 0.85),
          bikeZ + 20
        );
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.cameraLookAtTarget);
        if (Math.abs(bikeState.leanAngle) > 0.001) {
          this.camera.rotateZ(bikeState.leanAngle * (isCar ? 0.05 : 0.2));
        }
        break;
      }
      case 'cinematic': {
        // Dramatic side-low highway tracking camera
        this.camera.position.set(
          bikeX - 2.8 + shakeX,
          bikeY + 0.65 + shakeY,
          bikeZ - 1.5
        );
        this.cameraLookAtTarget.set(
          bikeX,
          bikeY + 0.9,
          bikeZ + 6
        );
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.cameraLookAtTarget);
        break;
      }
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('resize', this.handleResize);
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
    }

    this.trafficSystem.clear();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
