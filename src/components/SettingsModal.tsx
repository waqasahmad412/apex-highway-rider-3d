import React from 'react';
import { X, Sliders, Monitor, Gamepad2, Volume2, Eye } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    soundManager.playUiClick();
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                GAME SETTINGS & CONTROLS
              </h2>
              <p className="text-xs text-slate-400">Configure graphics quality, controls, audio, and physics.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* 1. CONTROLS CONFIGURATION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Gamepad2 className="w-4 h-4" />
              <span>Input & Steering System</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'keyboard' as const, label: 'Keyboard / PC', desc: 'WASD & Arrows' },
                { id: 'touch' as const, label: 'Touch Buttons', desc: 'On-Screen HUD' },
                { id: 'tilt' as const, label: 'Tilt Gyro', desc: 'Mobile Gyroscope' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleChange('controlType', c.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
                    settings.controlType === c.id
                      ? 'bg-slate-800 border-2 border-cyan-400 text-white shadow'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-black">{c.label}</span>
                  <span className="text-[10px] text-slate-500">{c.desc}</span>
                </button>
              ))}
            </div>

            {settings.controlType === 'keyboard' && (
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider text-cyan-400">
                  LAPTOP & PC KEYBOARD CONTROLS:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono font-bold">SPACE / W / ↑</kbd>
                    <span>Speed / Gas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold">SHIFT</kbd>
                    <span>Wheelie Stunt (Aage Se Uthana)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-rose-300 font-mono font-bold">ENTER / S / ↓</kbd>
                    <span>Brake / Stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-emerald-300 font-mono font-bold">← / → / A / D</kbd>
                    <span>Steer Left / Right</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono font-bold">C</kbd>
                    <span>Change Camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono font-bold">R</kbd>
                    <span>Reset Bike</span>
                  </div>
                </div>
              </div>
            )}

            {settings.controlType === 'tilt' && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>TILT SENSITIVITY</span>
                  <span className="font-mono text-cyan-400">{settings.tiltSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.tiltSensitivity}
                  onChange={(e) => handleChange('tiltSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 2. GRAPHICS PRESETS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Monitor className="w-4 h-4" />
              <span>Visual & Graphics Quality</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low' as const, label: 'Low', desc: 'Fastest 60fps' },
                { id: 'medium' as const, label: 'Medium', desc: 'Balanced' },
                { id: 'high' as const, label: 'High', desc: 'Soft Shadows & PBR' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleChange('graphicsQuality', g.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
                    settings.graphicsQuality === g.id
                      ? 'bg-slate-800 border-2 border-cyan-400 text-white shadow'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-black">{g.label}</span>
                  <span className="text-[10px] text-slate-500">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. AUDIO VOLUMES */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              <span>Audio Synthesis Master Levels</span>
            </div>
            <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {/* Engine */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>MOTORCYCLE ENGINE AUDIO</span>
                  <span className="font-mono text-cyan-400">{Math.round(settings.engineVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.engineVolume}
                  onChange={(e) => handleChange('engineVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* SFX */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>SOUND EFFECTS & CRASHES</span>
                  <span className="font-mono text-cyan-400">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Music */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>SYNTHWAVE BEAT MUSIC</span>
                  <span className="font-mono text-cyan-400">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. SPEED UNITS & TRAFFIC DENSITY */}
          <div className="grid grid-cols-2 gap-4">
            {/* Speed Unit */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SPEEDOMETER UNIT</span>
              <div className="grid grid-cols-2 gap-2">
                {(['kmh', 'mph'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleChange('speedUnit', unit)}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                      settings.speedUnit === unit
                        ? 'bg-slate-800 border-2 border-cyan-400 text-cyan-400'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Traffic Density */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TRAFFIC DENSITY</span>
              <div className="grid grid-cols-3 gap-1">
                {(['light', 'normal', 'dense'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleChange('trafficDensity', d)}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                      settings.trafficDensity === d
                        ? 'bg-slate-800 border-2 border-cyan-400 text-cyan-400'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. CAMERA FOV */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>FIELD OF VIEW (FOV)</span>
              </div>
              <span className="font-mono text-cyan-400">{settings.cameraFov}°</span>
            </div>
            <input
              type="range"
              min="55"
              max="95"
              step="1"
              value={settings.cameraFov}
              onChange={(e) => handleChange('cameraFov', parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
