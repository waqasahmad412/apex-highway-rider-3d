import React from 'react';
import { Camera, RotateCcw, Volume2 } from 'lucide-react';
import { InputState } from '../types/game';

interface TouchControlsProps {
  onInputChange: (partial: Partial<InputState>) => void;
  onCycleCamera: () => void;
  onResetBike: () => void;
  onHorn: () => void;
  isCrashed: boolean;
  cameraName: string;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInputChange,
  onCycleCamera,
  onResetBike,
  onHorn,
  isCrashed,
  cameraName,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 pb-6">
      {/* Top action bar buttons */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex gap-2">
          {/* Camera cycle */}
          <button
            onClick={onCycleCamera}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider backdrop-blur-md active:scale-95 transition-all shadow-lg"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>{cameraName}</span>
          </button>

          {/* Horn */}
          <button
            onClick={onHorn}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md active:scale-95 transition-all shadow-lg"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>HORN</span>
          </button>
        </div>

        {/* Quick Reset Button */}
        <button
          onClick={onResetBike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 backdrop-blur-md ${
            isCrashed
              ? 'bg-rose-600 text-white animate-bounce border-2 border-rose-400'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isCrashed ? 'RECOVER BIKE (R)' : 'RESET (R)'}</span>
        </button>
      </div>

      {/* Bottom Controls Area: Left Steering / Right Throttle & Brake */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left Thumb: Steering */}
        <div className="flex gap-3">
          <button
            onPointerDown={() => onInputChange({ steer: -1.0 })}
            onPointerUp={() => onInputChange({ steer: 0 })}
            onPointerLeave={() => onInputChange({ steer: 0 })}
            onPointerCancel={() => onInputChange({ steer: 0 })}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/80 active:bg-cyan-600 text-cyan-400 active:text-white border-2 border-cyan-500/40 font-bold text-2xl flex items-center justify-center shadow-xl backdrop-blur-md touch-none select-none transition-transform active:scale-90"
            aria-label="Steer Left"
          >
            ◀
          </button>

          <button
            onPointerDown={() => onInputChange({ steer: 1.0 })}
            onPointerUp={() => onInputChange({ steer: 0 })}
            onPointerLeave={() => onInputChange({ steer: 0 })}
            onPointerCancel={() => onInputChange({ steer: 0 })}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/80 active:bg-cyan-600 text-cyan-400 active:text-white border-2 border-cyan-500/40 font-bold text-2xl flex items-center justify-center shadow-xl backdrop-blur-md touch-none select-none transition-transform active:scale-90"
            aria-label="Steer Right"
          >
            ▶
          </button>
        </div>

        {/* Right Thumb: Wheelie, Brake & Throttle */}
        <div className="flex items-end gap-3">
          {/* Wheelie Stunt Button */}
          <button
            onPointerDown={() => onInputChange({ wheelie: true })}
            onPointerUp={() => onInputChange({ wheelie: false })}
            onPointerLeave={() => onInputChange({ wheelie: false })}
            onPointerCancel={() => onInputChange({ wheelie: false })}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-950/80 active:bg-amber-500 text-amber-400 active:text-white border-2 border-amber-500/50 font-black text-xs flex flex-col items-center justify-center shadow-xl backdrop-blur-md touch-none select-none transition-transform active:scale-90"
            aria-label="Wheelie"
          >
            <span className="text-lg">🏍️</span>
            <span className="tracking-wider text-[10px]">WHEELIE</span>
          </button>

          {/* Brake Button */}
          <button
            onPointerDown={() => onInputChange({ brake: 1.0 })}
            onPointerUp={() => onInputChange({ brake: 0 })}
            onPointerLeave={() => onInputChange({ brake: 0 })}
            onPointerCancel={() => onInputChange({ brake: 0 })}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-rose-950/80 active:bg-rose-600 text-rose-400 active:text-white border-2 border-rose-500/50 font-black text-sm flex flex-col items-center justify-center shadow-xl backdrop-blur-md touch-none select-none transition-transform active:scale-90"
            aria-label="Brake"
          >
            <span className="text-lg">🛑</span>
            <span className="tracking-wider">BRAKE</span>
          </button>

          {/* Throttle Gas Button */}
          <button
            onPointerDown={() => onInputChange({ throttle: 1.0 })}
            onPointerUp={() => onInputChange({ throttle: 0 })}
            onPointerLeave={() => onInputChange({ throttle: 0 })}
            onPointerCancel={() => onInputChange({ throttle: 0 })}
            className="w-20 h-22 sm:w-24 sm:h-26 rounded-2xl bg-emerald-950/80 active:bg-emerald-500 text-emerald-400 active:text-white border-2 border-emerald-500/60 font-black text-base flex flex-col items-center justify-center shadow-2xl backdrop-blur-md touch-none select-none transition-transform active:scale-95"
            aria-label="Throttle"
          >
            <span className="text-2xl">⚡</span>
            <span className="tracking-widest">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
