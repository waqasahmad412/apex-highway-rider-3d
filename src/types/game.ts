export type GameModeType = 'free_ride' | 'traffic_challenge' | 'time_trial' | 'career' | 'practice';

export type TimeOfDay = 'noon' | 'sunset' | 'night' | 'rain';

export type CameraViewMode = 'chase' | 'helmet' | 'handlebar' | 'cinematic';

export interface BikeSpec {
  id: string;
  name: string;
  category: string;
  vehicleType: 'bike' | 'car';
  style?: 'superbike' | 'naked' | 'chopper' | 'motocross' | 'classic' | 'supercar' | 'muscle' | 'hypercar' | 'drift' | 'police' | string;
  price: number;
  unlocked: boolean;
  color: string;
  secondaryColor: string;
  isCustom?: boolean;
  baseStats: {
    topSpeed: number; // km/h
    acceleration: number; // 0-100 rating
    handling: number; // agility & lean speed
    braking: number; // stopping power
  };
  upgrades: {
    engine: number; // 0 to 4
    transmission: number;
    brakes: number;
    tires: number;
  };
  description: string;
}

export interface PlayerStats {
  coins: number;
  bestDistance: number;
  highSpeed: number;
  totalNearMisses: number;
  completedMissions: string[];
  selectedBikeId: string;
}

export interface CareerMission {
  id: string;
  title: string;
  subtitle: string;
  mode: GameModeType;
  timeOfDay: TimeOfDay;
  targetDistance?: number;
  targetSpeed?: number;
  targetNearMisses?: number;
  timeLimit?: number; // seconds
  rewardCoins: number;
  unlocked: boolean;
  completed: boolean;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
  controlType: 'keyboard' | 'touch' | 'tilt';
  tiltSensitivity: number;
  cameraFov: number;
  engineVolume: number;
  sfxVolume: number;
  musicVolume: number;
  speedUnit: 'kmh' | 'mph';
  trafficDensity: 'light' | 'normal' | 'dense';
  autoReverseOnBrake: boolean;
}

export interface InputState {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to 1 (right)
  handbrake: boolean;
  wheelie: boolean; // Shift key front wheel raise stunt
  horn: boolean;
  resetBike: boolean;
  changeCamera: boolean;
}

export interface NearMissEvent {
  id: number;
  points: number;
  speedKmh: number;
  combo: number;
  timestamp: number;
}
