import React from 'react';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xl font-black mb-1">
          ⏸️
        </div>

        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            RIDE PAUSED
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Take a breather, rider.</p>
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-2">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RIDE (ESC)</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RIDE</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenSettings();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700"
          >
            <Settings className="w-4 h-4" />
            <span>SETTINGS & CONTROLS</span>
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onMainMenu();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-rose-400 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border border-rose-900/40 mt-1"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
