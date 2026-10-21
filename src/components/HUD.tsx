import React from 'react';
import { Pause, Volume2, VolumeX, ShieldAlert, Trophy, Flame } from 'lucide-react';
import { TelemetryData } from '../game/GameEngine';
import { GameModeType, NearMissEvent } from '../types/game';

interface HUDProps {
  telemetry: TelemetryData;
  mode: GameModeType;
  speedUnit: 'kmh' | 'mph';
  nearMissAlerts: NearMissEvent[];
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRecover: () => void;
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  mode,
  speedUnit,
  nearMissAlerts,
  isMuted,
  onToggleMute,
  onPause,
  onRecover,
  showMobileControls,
  onToggleMobileControls,
}) => {
  // Unit conversion
  const displaySpeed =
    speedUnit === 'mph' ? Math.round(telemetry.speedKmh * 0.621371) : telemetry.speedKmh;
  const unitLabel = speedUnit === 'mph' ? 'MPH' : 'KM/H';

  // Format distance
  const distanceFormatted =
    telemetry.distanceMeters > 1000
      ? `${(telemetry.distanceMeters / 1000).toFixed(2)} KM`
      : `${telemetry.distanceMeters} M`;

  // RPM percentage
  const rpmPercent = Math.min(100, Math.max(0, telemetry.rpmRatio * 100));
  const isRedline = rpmPercent > 85;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-sans">
      {/* 1. TOP STATUS CLUSTER (Low-occlusion, perimeter styled) */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Left: Mode & Objective Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-900/80 text-cyan-400 border border-cyan-500/30 text-xs font-black tracking-widest uppercase">
              {mode.replace('_', ' ')}
            </span>
            <button
              onClick={onToggleMobileControls}
              className="px-2.5 py-1 rounded-md bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium tracking-wider"
              title="Toggle On-Screen Touch Buttons"
            >
              TOUCH: {showMobileControls ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Time Trial Countdown */}
          {telemetry.timeRemaining !== undefined && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-500/40 px-3 py-1.5 rounded-lg">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">TIME:</span>
              <span className={`font-mono text-lg font-black tabular-nums ${telemetry.timeRemaining <= 10 ? 'text-rose-500 animate-pulse' : 'text-amber-300'}`}>
                {telemetry.timeRemaining}s
              </span>
            </div>
          )}

          {/* Mission Progress if in Career */}
          {telemetry.objectiveProgress && (
            <div className="flex flex-col gap-1 bg-slate-900/85 border border-indigo-500/40 px-3 py-1.5 rounded-lg max-w-xs">
              <div className="flex justify-between text-[11px] font-bold text-indigo-300 uppercase">
                <span>{telemetry.objectiveProgress.label}</span>
                <span className="tabular-nums">
                  {telemetry.objectiveProgress.current} / {telemetry.objectiveProgress.target}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{
                    width: `${Math.min(
                      100,
                      (telemetry.objectiveProgress.current / telemetry.objectiveProgress.target) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Distance, Score & Pause */}
        <div className="flex items-center gap-3">
          {/* Near-Miss Score & Combo */}
          {telemetry.nearMissCount > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg">
              <Flame className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">NEAR MISSES</span>
                <span className="font-mono text-xs font-black text-white tabular-nums">
                  {telemetry.nearMissCount} · {telemetry.nearMissPoints} PTS
                </span>
              </div>
            </div>
          )}

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-md transition-all active:scale-95"
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-md transition-all active:scale-95"
            aria-label="Pause Ride"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. NEAR-MISS FLOATING ADRENALINE POPUPS (Center-Right) */}
      <div className="absolute top-20 right-6 flex flex-col gap-2 pointer-events-none items-end">
        {nearMissAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/90 border-2 border-emerald-400 shadow-2xl animate-in fade-in slide-in-from-right duration-200"
          >
            <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                NEAR MISS! {alert.combo > 1 ? `x${alert.combo} COMBO` : ''}
              </span>
              <span className="text-xs font-bold text-white tabular-nums">
                +{alert.points} PTS · {alert.speedKmh} KM/H
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CRASH OVERLAY (Centered) */}
      {telemetry.isCrashed && (
        <div className="self-center my-auto flex flex-col items-center gap-4 bg-slate-950/90 border-2 border-rose-500 p-6 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto text-center max-w-sm animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-1">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-wider">CRASH DETECTED</h3>
            <p className="text-xs text-slate-400 font-medium">Impact on highway barrier or traffic vehicle.</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
            <div className="flex flex-col text-left">
              <span className="text-slate-500 uppercase">Distance</span>
              <span className="text-white font-mono font-bold">{distanceFormatted}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-slate-500 uppercase">Near Misses</span>
              <span className="text-emerald-400 font-mono font-bold">{telemetry.nearMissCount}</span>
            </div>
          </div>

          <button
            onClick={onRecover}
            className="w-full py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>RECOVER BIKE (R)</span>
          </button>
        </div>
      )}

      {/* 4. DIGITAL COCKPIT DASHBOARD (Bottom Center - Low Occlusion) */}
      {!telemetry.isCrashed && (
        <div className="self-center pointer-events-auto mb-2 flex flex-col items-center">
          <div className="relative flex flex-col items-center px-6 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 shadow-2xl backdrop-blur-md min-w-[240px] sm:min-w-[280px]">
            {/* Wheelie Stunt Active Badge */}
            {telemetry.isWheelie && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-amber-500/40 animate-bounce">
                <span>🔥</span>
                <span>WHEELIE!</span>
              </div>
            )}

            {/* RPM Gauge Bar Arc */}
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>RPM x1000</span>
              <span className={`font-mono tabular-nums ${isRedline ? 'text-rose-500 font-black animate-pulse' : 'text-slate-400'}`}>
                {(telemetry.rpm / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2">
              <div
                className={`h-full transition-all duration-75 ${
                  isRedline
                    ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                    : rpmPercent > 65
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>

            {/* Core Speed & Gear Readout */}
            <div className="flex items-baseline justify-center gap-4">
              {/* Gear Box */}
              <div className="flex flex-col items-center justify-center px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700">
                <span className="text-[9px] font-black text-slate-500 tracking-wider">GEAR</span>
                <span className="font-mono text-2xl font-black text-cyan-400 tabular-nums">
                  {telemetry.gear}
                </span>
              </div>

              {/* Huge Speedometer Digits */}
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">
                  {displaySpeed}
                </span>
                <span className="text-xs font-black text-cyan-400 tracking-wider uppercase">
                  {unitLabel}
                </span>
              </div>

              {/* Distance Meter */}
              <div className="flex flex-col items-center justify-center px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700">
                <span className="text-[9px] font-black text-slate-500 tracking-wider">DIST</span>
                <span className="font-mono text-xs font-black text-slate-200 tabular-nums">
                  {distanceFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
