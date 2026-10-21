import React from 'react';
import { X, Trophy, Check, Lock, Play, Flame, Gauge, Navigation } from 'lucide-react';
import { CareerMission } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface CareerModalProps {
  missions: CareerMission[];
  onStartMission: (mission: CareerMission) => void;
  onClose: () => void;
}

export const CareerModal: React.FC<CareerModalProps> = ({
  missions,
  onStartMission,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                CAREER MISSIONS & CHALLENGES
              </h2>
              <p className="text-xs text-slate-400">Complete highway contracts to earn huge coin bounties.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions List */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
          {missions.map((mission, idx) => {
            const isClickable = mission.unlocked;

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  mission.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : mission.unlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50'
                    : 'bg-slate-950/30 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      mission.completed
                        ? 'bg-emerald-500 text-slate-950'
                        : mission.unlocked
                        ? 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {mission.completed ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide">
                        {mission.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {mission.timeOfDay}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mission.subtitle}</p>

                    {/* Mission specific targets */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono font-bold text-slate-300">
                      {mission.targetDistance && (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{mission.targetDistance} M</span>
                        </div>
                      )}
                      {mission.targetSpeed && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Gauge className="w-3.5 h-3.5" />
                          <span>{mission.targetSpeed} KM/H</span>
                        </div>
                      )}
                      {mission.targetNearMisses && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{mission.targetNearMisses} NEAR MISSES</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Reward and Start Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                    <span>🪙</span>
                    <span>+{mission.rewardCoins}</span>
                  </div>

                  {mission.unlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playUiClick();
                        onStartMission(mission);
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{mission.completed ? 'REPLAY' : 'LAUNCH'}</span>
                    </button>
                  ) : (
                    <div className="p-2 text-slate-500 flex items-center gap-1 text-xs">
                      <Lock className="w-4 h-4" />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
