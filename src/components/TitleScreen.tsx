import React from 'react';
import { Play, Wrench, Settings, Trophy, Shield, Sun, Sunset, Moon, CloudRain, Flame, ChevronRight } from 'lucide-react';
import { BikeSpec, GameModeType, PlayerStats, TimeOfDay } from '../types/game';

interface TitleScreenProps {
  onStartRide: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenCareer: () => void;
  selectedMode: GameModeType;
  onSelectMode: (mode: GameModeType) => void;
  timeOfDay: TimeOfDay;
  onSelectTimeOfDay: (tod: TimeOfDay) => void;
  currentBike: BikeSpec;
  stats: PlayerStats;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartRide,
  onOpenGarage,
  onOpenSettings,
  onOpenCareer,
  selectedMode,
  onSelectMode,
  timeOfDay,
  onSelectTimeOfDay,
  currentBike,
  stats,
}) => {
  const modes: { type: GameModeType; title: string; desc: string; icon: string; badge?: string }[] = [
    {
      type: 'free_ride',
      title: 'Free Ride',
      desc: 'Endless highway cruise. Test top speed and record maximum distance.',
      icon: '🛣️',
      badge: 'Popular',
    },
    {
      type: 'traffic_challenge',
      title: 'Traffic Challenge',
      desc: 'Heavy rush hour traffic. High-speed near-miss passes for massive combo multipliers.',
      icon: '⚡',
      badge: 'High Action',
    },
    {
      type: 'time_trial',
      title: 'Time Trial',
      desc: 'Race against the ticking clock. Maintain maximum velocity before time runs out.',
      icon: '⏱️',
    },
    {
      type: 'practice',
      title: 'Practice Track',
      desc: 'Wide open highway to calibrate steering sensitivity, lean angles, and braking.',
      icon: '🎯',
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pointer-events-auto select-none overflow-y-auto">
      {/* Top Bar: Coin Balance & Garage/Settings Quick Links */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        {/* Brand / Logo lockup with bespoke inline SVG */}
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="15,85 50,15 85,85 65,85 50,45 35,85" fill="currentColor" opacity="0.9" />
            <line x1="10" y1="92" x2="90" y2="92" stroke="#00f0ff" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="55" r="8" fill="#ff0055" />
          </svg>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-black tracking-widest text-cyan-400 uppercase">
              HIGHWAY MOTORCYCLE SIMULATOR
            </span>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white drop-shadow-lg uppercase">
              APEX RIDER <span className="text-cyan-400">3D</span>
            </h1>
          </div>
        </div>

        {/* Top-Right Player Stats & Navigation */}
        <div className="flex items-center gap-3">
          {/* Coins */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-lg">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
              {stats.coins.toLocaleString()}
            </span>
          </div>

          {/* Career Modal Button */}
          <button
            onClick={onOpenCareer}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
          >
            <Trophy className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Missions</span>
          </button>

          {/* Garage Button */}
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Garage</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-lg transition-all active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Hero Space: Bike Profile & Mode Cards */}
      <div className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Current Motorcycle Card & Atmosphere Selector */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Motorcycle Spec Card */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {currentBike.category}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 border border-emerald-800">
                  {currentBike.vehicleType === 'car' ? '🏎️ Sports Car' : '🏍️ Motorcycle'}
                </span>
              </div>
              <button
                onClick={onOpenGarage}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
              >
                <span>Garage (100% Unlocked)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-wide">
                {currentBike.name}
              </h2>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {currentBike.description}
              </p>
            </div>

            {/* Performance Bars */}
            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <div className="flex justify-between text-slate-400 font-bold mb-1">
                  <span>TOP SPEED</span>
                  <span className="text-white font-mono">{currentBike.baseStats.topSpeed} km/h</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${(currentBike.baseStats.topSpeed / 360) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-bold mb-1">
                  <span>ACCELERATION</span>
                  <span className="text-white font-mono">{currentBike.baseStats.acceleration}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${currentBike.baseStats.acceleration}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-bold mb-1">
                  <span>HANDLING</span>
                  <span className="text-white font-mono">{currentBike.baseStats.handling}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400"
                    style={{ width: `${currentBike.baseStats.handling}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-bold mb-1">
                  <span>BRAKING</span>
                  <span className="text-white font-mono">{currentBike.baseStats.braking}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400"
                    style={{ width: `${currentBike.baseStats.braking}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time of Day Weather Preset Selector */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              HIGHWAY ATMOSPHERE & WEATHER
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'noon', label: 'Noon', icon: Sun },
                  { id: 'sunset', label: 'Sunset', icon: Sunset },
                  { id: 'night', label: 'Midnight', icon: Moon },
                  { id: 'rain', label: 'Rain Storm', icon: CloudRain },
                ] as const
              ).map((tod) => {
                const Icon = tod.icon;
                const isSelected = timeOfDay === tod.id;
                return (
                  <button
                    key={tod.id}
                    onClick={() => onSelectTimeOfDay(tod.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Mode Selection Grid & Big START CTA */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            SELECT GAME MODE
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map((m) => {
              const isSelected = selectedMode === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => onSelectMode(m.type)}
                  className={`flex flex-col gap-2 p-4 rounded-2xl text-left transition-all active:scale-98 relative overflow-hidden backdrop-blur-md ${
                    isSelected
                      ? 'bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/75 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{m.icon}</span>
                    {m.badge && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wide">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {m.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary Action Button: RIDE NOW */}
          <button
            onClick={onStartRide}
            className="mt-2 w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-lg sm:text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-98 group cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
            <span>START RIDE (SPACE / ENTER)</span>
          </button>
        </div>
      </div>

      {/* Flat Single-Line Control Hint Banner */}
      <div className="w-full max-w-6xl mx-auto text-center pt-2 border-t border-slate-800/80">
        <p className="text-xs font-mono font-medium text-slate-400 tracking-wide">
          <span className="text-cyan-400 font-bold">SPACE / W / ↑</span> Speed (Gas) ·{' '}
          <span className="text-amber-400 font-bold">SHIFT</span> Wheelie (Aage Se Uthana) ·{' '}
          <span className="text-rose-400 font-bold">ENTER / S / ↓</span> Brake (Stop) ·{' '}
          <span className="text-cyan-400 font-bold">← / → / A / D</span> Steer ·{' '}
          <span className="text-indigo-400 font-bold">C</span> Camera ·{' '}
          <span className="text-emerald-400 font-bold">R</span> Reset ·{' '}
          <span className="text-slate-300 font-bold">Esc</span> Pause
        </p>
      </div>
    </div>
  );
};
