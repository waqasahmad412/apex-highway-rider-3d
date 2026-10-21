import { BikeSpec, CareerMission, GameSettings, PlayerStats } from '../types/game';

export const DEFAULT_BIKES: BikeSpec[] = [
  // --- MOTORCYCLES ---
  {
    id: 'apex_rr1000',
    name: 'Apex RR 1000',
    category: 'Superbike',
    vehicleType: 'bike',
    style: 'superbike',
    price: 0,
    unlocked: true,
    color: '#e62424', // Crimson Racing Red
    secondaryColor: '#171717',
    baseStats: {
      topSpeed: 295,
      acceleration: 88,
      handling: 85,
      braking: 86,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'High-revving 998cc inline-four superbike engineered for razor-sharp apex handling and blistering straight-line speed.',
  },
  {
    id: 'streetfighter_v2',
    name: 'Streetfighter V2',
    category: 'Naked Beast',
    vehicleType: 'bike',
    style: 'naked',
    price: 0,
    unlocked: true,
    color: '#06b6d4', // Cyan Neon
    secondaryColor: '#262626',
    baseStats: {
      topSpeed: 265,
      acceleration: 94,
      handling: 92,
      braking: 88,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Raw, wide-handlebar streetfighter with brutal low-end torque for slicing between tightly packed traffic lanes.',
  },
  {
    id: 'thunder_chopper',
    name: 'Thunder Chopper 1800',
    category: 'Cruiser Custom',
    vehicleType: 'bike',
    style: 'chopper',
    price: 0,
    unlocked: true,
    color: '#10b981', // Emerald Green & Chrome
    secondaryColor: '#d4d4d8',
    baseStats: {
      topSpeed: 235,
      acceleration: 82,
      handling: 70,
      braking: 78,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Rumbling American V-twin with extended raked forks, tall ape-hanger bars, and straight chrome rumble pipes.',
  },
  {
    id: 'dirt_reaper',
    name: 'Dirt Reaper 450',
    category: 'Motocross Enduro',
    vehicleType: 'bike',
    style: 'motocross',
    price: 0,
    unlocked: true,
    color: '#f97316', // KTM Vivid Orange
    secondaryColor: '#18181b',
    baseStats: {
      topSpeed: 220,
      acceleration: 96,
      handling: 95,
      braking: 85,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Agile lightweight 450cc single with long travel suspension, high motocross beak, and lightning-fast corner transitions.',
  },
  {
    id: 'retro_bandit',
    name: 'Retro Bandit 750',
    category: 'Classic Cafe Racer',
    vehicleType: 'bike',
    style: 'classic',
    price: 0,
    unlocked: true,
    color: '#047857', // British Racing Green
    secondaryColor: '#d97706',
    baseStats: {
      topSpeed: 250,
      acceleration: 85,
      handling: 82,
      braking: 80,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Vintage cafe racer with circular chrome lamp, aerodynamic bullet seat cowl, and classic mechanical soundtrack.',
  },
  {
    id: 'hayabusa_gt',
    name: 'Phantom Falcon 1340',
    category: 'Hyper Tourer',
    vehicleType: 'bike',
    style: 'superbike',
    price: 0,
    unlocked: true,
    color: '#f59e0b', // Amber Gold
    secondaryColor: '#111827',
    baseStats: {
      topSpeed: 335,
      acceleration: 91,
      handling: 76,
      braking: 84,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Heavyweight aerodynamic speed demon designed to dominate high-speed highway straights with unmatched velocity stability.',
  },
  {
    id: 'cyber_blade',
    name: 'Cyber Blade ZX',
    category: 'Concept Prototype',
    vehicleType: 'bike',
    style: 'superbike',
    price: 0,
    unlocked: true,
    color: '#8b5cf6', // Neon Purple
    secondaryColor: '#0a0a0a',
    baseStats: {
      topSpeed: 360,
      acceleration: 99,
      handling: 96,
      braking: 95,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Next-gen experimental hyperbike equipped with active aero winglets and an ultra-light carbon chassis.',
  },

  // --- CARS ---
  {
    id: 'apex_gt_stradale',
    name: 'Apex GT Stradale',
    category: 'Supercar',
    vehicleType: 'car',
    style: 'supercar',
    price: 0,
    unlocked: true,
    color: '#dc2626', // Ferrari Rosso Corsa
    secondaryColor: '#0f172a',
    baseStats: {
      topSpeed: 315,
      acceleration: 90,
      handling: 86,
      braking: 90,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Mid-engine twin-turbo V8 Italian supercar with carbon splitter, active rear wing, and razor track balance.',
  },
  {
    id: 'hellhound_v8',
    name: 'Hellhound 69 Muscle',
    category: 'V8 Muscle Car',
    vehicleType: 'car',
    style: 'muscle',
    price: 0,
    unlocked: true,
    color: '#18181b', // Matte Stealth Black with Gold stripes
    secondaryColor: '#eab308',
    baseStats: {
      topSpeed: 285,
      acceleration: 95,
      handling: 72,
      braking: 78,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Brutal supercharged 7.0L V8 American muscle beast with a hood-mounted shaker scoop and ground-shaking exhaust roar.',
  },
  {
    id: 'ghost_venom',
    name: 'Ghost Venom XR',
    category: 'Stealth Hypercar',
    vehicleType: 'car',
    style: 'hypercar',
    price: 0,
    unlocked: true,
    color: '#3b82f6', // Electric Cerulean
    secondaryColor: '#050505',
    baseStats: {
      topSpeed: 375,
      acceleration: 99,
      handling: 94,
      braking: 96,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Ultra-rare carbon monocoque hypercar with four-digit horsepower, holographic active aero, and supersonic top-end rush.',
  },
  {
    id: 'skyline_drift',
    name: 'Akina Turbo R34',
    category: 'JDM Drift Coupe',
    vehicleType: 'car',
    style: 'drift',
    price: 0,
    unlocked: true,
    color: '#2563eb', // Bayside Blue
    secondaryColor: '#f8fafc',
    baseStats: {
      topSpeed: 295,
      acceleration: 92,
      handling: 90,
      braking: 86,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Iconic twin-turbo AWD Japanese highway weapon with flared widebody arches, large front intercooler, and GT drift wing.',
  },
  {
    id: 'police_interceptor',
    name: 'V8 Highway Interceptor',
    category: 'Police Pursuit Special',
    vehicleType: 'car',
    style: 'police',
    price: 0,
    unlocked: true,
    color: '#09090b', // Police Black & White
    secondaryColor: '#f4f4f5',
    baseStats: {
      topSpeed: 320,
      acceleration: 92,
      handling: 85,
      braking: 92,
    },
    upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
    description: 'Heavy-duty highway patrol cruiser fitted with reinforced front bullbars and high-intensity blue/red emergency strobe lightbar.',
  },
];

export const DEFAULT_MISSIONS: CareerMission[] = [
  {
    id: 'mission_1',
    title: 'Trial Run',
    subtitle: 'Warm up on the open highway',
    mode: 'free_ride',
    timeOfDay: 'noon',
    targetDistance: 1500,
    rewardCoins: 500,
    unlocked: true,
    completed: false,
  },
  {
    id: 'mission_2',
    title: 'Speed Demon',
    subtitle: 'Push the speedometer beyond 200 km/h',
    mode: 'free_ride',
    timeOfDay: 'sunset',
    targetSpeed: 200,
    rewardCoins: 1000,
    unlocked: false,
    completed: false,
  },
  {
    id: 'mission_3',
    title: 'Adrenaline Rush',
    subtitle: 'Score 5 Near-Miss passes in dense traffic',
    mode: 'traffic_challenge',
    timeOfDay: 'sunset',
    targetNearMisses: 5,
    rewardCoins: 1500,
    unlocked: false,
    completed: false,
  },
  {
    id: 'mission_4',
    title: 'Midnight Blitz',
    subtitle: 'Beat the clock: 3,000m within 75 seconds',
    mode: 'time_trial',
    timeOfDay: 'night',
    targetDistance: 3000,
    timeLimit: 75,
    rewardCoins: 2500,
    unlocked: false,
    completed: false,
  },
  {
    id: 'mission_5',
    title: 'Storm Chaser',
    subtitle: 'Survive 5,000m on slick wet asphalt in torrential rain',
    mode: 'traffic_challenge',
    timeOfDay: 'rain',
    targetDistance: 5000,
    rewardCoins: 3500,
    unlocked: false,
    completed: false,
  },
  {
    id: 'mission_6',
    title: 'Apex Legend',
    subtitle: 'Score 15 Near-Miss passes and hit 260 km/h',
    mode: 'traffic_challenge',
    timeOfDay: 'night',
    targetNearMisses: 15,
    targetSpeed: 260,
    rewardCoins: 6000,
    unlocked: false,
    completed: false,
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  controlType: 'keyboard',
  tiltSensitivity: 1.0,
  cameraFov: 72,
  engineVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.45,
  speedUnit: 'kmh',
  trafficDensity: 'normal',
  autoReverseOnBrake: false,
};

const STORAGE_KEYS = {
  STATS: 'apex_highway_stats_v1',
  BIKES: 'apex_highway_bikes_v1',
  MISSIONS: 'apex_highway_missions_v1',
  SETTINGS: 'apex_highway_settings_v1',
};

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return {
    coins: 1000, // Starter bonus!
    bestDistance: 0,
    highSpeed: 0,
    totalNearMisses: 0,
    completedMissions: [],
    selectedBikeId: 'apex_rr1000',
  };
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function loadBikes(): BikeSpec[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIKES);
    if (raw) {
      const saved: BikeSpec[] = JSON.parse(raw);
      // Merge any new default vehicles that aren't yet in saved storage
      const savedIds = new Set(saved.map((b) => b.id));
      const missingDefaults = DEFAULT_BIKES.filter((d) => !savedIds.has(d.id));

      // Ensure every vehicle (existing and new) is completely unlocked as requested by user
      const merged = [...saved, ...missingDefaults].map((b) => {
        const def = DEFAULT_BIKES.find((d) => d.id === b.id);
        return {
          ...(def || {}),
          ...b,
          vehicleType: b.vehicleType || def?.vehicleType || 'bike',
          style: b.style || def?.style,
          unlocked: true,
          price: 0,
        };
      });

      saveBikes(merged);
      return merged;
    }
  } catch (e) {
    console.error('Failed to load bikes', e);
  }
  return DEFAULT_BIKES;
}

export function unlockAllVehicles(): BikeSpec[] {
  const current = loadBikes();
  const fullyUnlocked = current.map((b) => ({ ...b, unlocked: true, price: 0 }));
  saveBikes(fullyUnlocked);
  return fullyUnlocked;
}

export function saveBikes(bikes: BikeSpec[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BIKES, JSON.stringify(bikes));
  } catch (e) {
    console.error('Failed to save bikes', e);
  }
}

export function loadMissions(): CareerMission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load missions', e);
  }
  return DEFAULT_MISSIONS;
}

export function saveMissions(missions: CareerMission[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  } catch (e) {
    console.error('Failed to save missions', e);
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
