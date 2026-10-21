/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameEngine, TelemetryData } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { GarageModal } from './components/GarageModal';
import { SettingsModal } from './components/SettingsModal';
import { CareerModal } from './components/CareerModal';
import { PauseModal } from './components/PauseModal';
import { soundManager } from './audio/SoundManager';
import {
  BikeSpec,
  CareerMission,
  GameModeType,
  GameSettings,
  InputState,
  NearMissEvent,
  PlayerStats,
  TimeOfDay,
} from './types/game';
import {
  loadBikes,
  loadMissions,
  loadPlayerStats,
  loadSettings,
  saveBikes,
  saveMissions,
  savePlayerStats,
  saveSettings,
} from './utils/storage';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistence State
  const [bikes, setBikes] = useState<BikeSpec[]>(loadBikes);
  const [missions, setMissions] = useState<CareerMission[]>(loadMissions);
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // App Lifecycle State
  const [gameScreen, setGameScreen] = useState<'title' | 'playing'>('title');
  const [selectedMode, setSelectedMode] = useState<GameModeType>('free_ride');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [activeMission, setActiveMission] = useState<CareerMission | null>(null);

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCareerOpen, setIsCareerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mobile / Touch detection
  const [showMobileControls, setShowMobileControls] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Telemetry state updated by game loop
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speedKmh: 0,
    rpm: 1600,
    rpmRatio: 0,
    gear: 1,
    distanceMeters: 0,
    nearMissCount: 0,
    nearMissPoints: 0,
    isCrashed: false,
    isWheelie: false,
    activeCamera: 'chase',
  });

  const [nearMissAlerts, setNearMissAlerts] = useState<NearMissEvent[]>([]);
  const [victoryBanner, setVictoryBanner] = useState<{ message: string; reward: number } | null>(null);

  const currentBike = bikes.find((b) => b.id === stats.selectedBikeId) || bikes[0];

  // 1. Initialize GameEngine inside isolated canvas ref
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      currentBike,
      settings,
      selectedMode,
      timeOfDay,
      {
        onTelemetry: (data) => {
          setTelemetry(data);

          // Update stats records
          if (data.speedKmh > stats.highSpeed) {
            setStats((prev) => {
              const updated = { ...prev, highSpeed: data.speedKmh };
              savePlayerStats(updated);
              return updated;
            });
          }
          if (data.distanceMeters > stats.bestDistance) {
            setStats((prev) => {
              const updated = { ...prev, bestDistance: data.distanceMeters };
              savePlayerStats(updated);
              return updated;
            });
          }
        },
        onNearMiss: (event) => {
          // Add near miss floating alert
          setNearMissAlerts((prev) => [event, ...prev.slice(0, 3)]);
          setTimeout(() => {
            setNearMissAlerts((prev) => prev.filter((a) => a.id !== event.id));
          }, 2400);

          // Reward coins for near misses
          setStats((prev) => {
            const updated = {
              ...prev,
              coins: prev.coins + Math.max(10, Math.floor(event.points * 0.1)),
              totalNearMisses: prev.totalNearMisses + 1,
            };
            savePlayerStats(updated);
            return updated;
          });
        },
        onCrash: () => {
          // Crashed
        },
        onVictory: (rewardCoins) => {
          triggerVictory(rewardCoins);
        },
      }
    );

    engineRef.current = engine;

    // Start engine in background for title screen live backdrop
    engine.start();
    engine.pause(); // Idle until user starts or unpauses

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update bike in engine when selected bike changes
  useEffect(() => {
    if (engineRef.current && currentBike) {
      engineRef.current.loadBike(currentBike);
    }
  }, [currentBike]);

  // Update settings in engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSettings(settings);
    }
  }, [settings]);

  // Trigger Mission Victory
  const triggerVictory = (reward: number) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setVictoryBanner({
      message: 'MISSION OBJECTIVE ACCOMPLISHED!',
      reward,
    });

    setStats((prev) => {
      const updated = {
        ...prev,
        coins: prev.coins + reward,
        completedMissions: activeMission
          ? Array.from(new Set([...prev.completedMissions, activeMission.id]))
          : prev.completedMissions,
      };
      savePlayerStats(updated);
      return updated;
    });

    if (activeMission) {
      setMissions((prev) => {
        const updated = prev.map((m) => {
          if (m.id === activeMission.id) return { ...m, completed: true };
          return m;
        });
        saveMissions(updated);
        return updated;
      });
    }

    setTimeout(() => {
      setVictoryBanner(null);
    }, 4500);
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameScreen === 'playing') {
          setIsPaused((p) => {
            const next = !p;
            if (next) engineRef.current?.pause();
            else engineRef.current?.resume();
            return next;
          });
        } else {
          setIsGarageOpen(false);
          setIsSettingsOpen(false);
          setIsCareerOpen(false);
        }
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        if (gameScreen === 'title' && !isGarageOpen && !isSettingsOpen && !isCareerOpen) {
          handleStartRide();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameScreen, isGarageOpen, isSettingsOpen, isCareerOpen, selectedMode, timeOfDay]);

  // Actions
  const handleStartRide = (mode?: GameModeType, tod?: TimeOfDay, targetVal?: number, timeLimit?: number) => {
    const targetMode = mode || selectedMode;
    const targetTod = tod || timeOfDay;

    soundManager.init();
    soundManager.resume();
    soundManager.playUiClick();

    if (engineRef.current) {
      engineRef.current.setMode(targetMode, targetTod, targetVal, timeLimit);
      engineRef.current.resume();
    }

    setGameScreen('playing');
    setIsPaused(false);
  };

  const handlePause = () => {
    soundManager.playUiClick();
    setIsPaused(true);
    engineRef.current?.pause();
  };

  const handleResume = () => {
    soundManager.playUiClick();
    setIsPaused(false);
    engineRef.current?.resume();
  };

  const handleRestartRide = () => {
    soundManager.playUiClick();
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.resetRide();
      engineRef.current.resume();
    }
  };

  const handleReturnToMenu = () => {
    soundManager.playUiClick();
    setIsPaused(false);
    setGameScreen('title');
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMusic();
    setIsMuted(!nextMuted);
  };

  const handleSelectBike = (bikeId: string) => {
    setStats((prev) => {
      const updated = { ...prev, selectedBikeId: bikeId };
      savePlayerStats(updated);
      return updated;
    });
    const target = bikes.find((b) => b.id === bikeId);
    if (target && engineRef.current) {
      engineRef.current.loadBike(target);
    }
  };

  const handleUnlockAll = () => {
    const updated = bikes.map((b) => ({ ...b, unlocked: true, price: 0 }));
    setBikes(updated);
    saveBikes(updated);
    confetti({ particleCount: 120, spread: 80 });
  };

  const handleAddVehicle = (newVehicle: BikeSpec) => {
    const updated = [...bikes, newVehicle];
    setBikes(updated);
    saveBikes(updated);
    handleSelectBike(newVehicle.id);
    confetti({ particleCount: 100, spread: 70 });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const updated = bikes.filter((b) => b.id !== vehicleId);
    setBikes(updated);
    saveBikes(updated);
    if (stats.selectedBikeId === vehicleId) {
      handleSelectBike(updated[0]?.id || 'apex_rr1000');
    }
  };

  const handleUpgradeBike = (bikeId: string, upgradeType: 'engine' | 'transmission' | 'brakes' | 'tires') => {
    const UPGRADE_COSTS = [600, 1200, 2200, 4000];
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike) return;

    const currentLvl = bike.upgrades[upgradeType];
    if (currentLvl >= 4) return;
    const cost = UPGRADE_COSTS[currentLvl];
    if (stats.coins < cost) return;

    // Deduct coins
    const updatedStats = { ...stats, coins: stats.coins - cost };
    setStats(updatedStats);
    savePlayerStats(updatedStats);

    // Update bike upgrade level
    const updatedBikes = bikes.map((b) => {
      if (b.id === bikeId) {
        return {
          ...b,
          upgrades: {
            ...b.upgrades,
            [upgradeType]: currentLvl + 1,
          },
        };
      }
      return b;
    });
    setBikes(updatedBikes);
    saveBikes(updatedBikes);
    soundManager.playNearMiss();
  };

  const handlePaintBike = (bikeId: string, color: string) => {
    const updatedBikes = bikes.map((b) => {
      if (b.id === bikeId) {
        return { ...b, color };
      }
      return b;
    });
    setBikes(updatedBikes);
    saveBikes(updatedBikes);
    const target = updatedBikes.find((b) => b.id === bikeId);
    if (target && target.id === stats.selectedBikeId && engineRef.current) {
      engineRef.current.loadBike(target);
    }
  };

  const handleBuyBike = (bikeId: string) => {
    const updatedStats = {
      ...stats,
      selectedBikeId: bikeId,
    };
    setStats(updatedStats);
    savePlayerStats(updatedStats);

    const updatedBikes = bikes.map((b) => {
      if (b.id === bikeId) {
        return { ...b, unlocked: true, price: 0 };
      }
      return b;
    });
    setBikes(updatedBikes);
    saveBikes(updatedBikes);

    confetti({ particleCount: 80, spread: 60 });
    soundManager.playNearMiss();
  };

  const handleStartMission = (mission: CareerMission) => {
    setIsCareerOpen(false);
    setActiveMission(mission);
    setSelectedMode(mission.mode);
    setTimeOfDay(mission.timeOfDay);
    handleStartRide(
      mission.mode,
      mission.timeOfDay,
      mission.targetDistance || mission.targetSpeed,
      mission.timeLimit
    );
  };

  const handleInputPartial = (partial: Partial<InputState>) => {
    engineRef.current?.setExternalInput(partial);
  };

  const handleRecover = () => {
    engineRef.current?.recoverFromCrash();
  };

  const handleCycleCamera = () => {
    engineRef.current?.cycleCamera();
  };

  const handleHorn = () => {
    soundManager.playHorn();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans select-none touch-none">
      {/* 1. ISOLATED 3D WEBGL CANVAS MOUNT */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* 2. TITLE SCREEN (when in title mode) */}
      {gameScreen === 'title' && (
        <TitleScreen
          onStartRide={() => handleStartRide()}
          onOpenGarage={() => {
            soundManager.playUiClick();
            setIsGarageOpen(true);
          }}
          onOpenSettings={() => {
            soundManager.playUiClick();
            setIsSettingsOpen(true);
          }}
          onOpenCareer={() => {
            soundManager.playUiClick();
            setIsCareerOpen(true);
          }}
          selectedMode={selectedMode}
          onSelectMode={(m) => {
            soundManager.playUiClick();
            setSelectedMode(m);
          }}
          timeOfDay={timeOfDay}
          onSelectTimeOfDay={(tod) => {
            soundManager.playUiClick();
            setTimeOfDay(tod);
            engineRef.current?.setMode(selectedMode, tod);
          }}
          currentBike={currentBike}
          stats={stats}
        />
      )}

      {/* 3. GAMEPLAY HUD (when riding) */}
      {gameScreen === 'playing' && (
        <>
          <HUD
            telemetry={telemetry}
            mode={selectedMode}
            speedUnit={settings.speedUnit}
            nearMissAlerts={nearMissAlerts}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            onRecover={handleRecover}
            showMobileControls={showMobileControls}
            onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
          />

          {/* On-Screen Mobile Touch Controls (when active or on mobile) */}
          {showMobileControls && (
            <TouchControls
              onInputChange={handleInputPartial}
              onCycleCamera={handleCycleCamera}
              onResetBike={handleRecover}
              onHorn={handleHorn}
              isCrashed={telemetry.isCrashed}
              cameraName={telemetry.activeCamera.toUpperCase()}
            />
          )}

          {/* Mission Victory Banner */}
          {victoryBanner && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border-2 border-emerald-400 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <span className="text-2xl">🏆</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  {victoryBanner.message}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  +{victoryBanner.reward} COINS AWARDED!
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. MODALS */}
      {isGarageOpen && (
        <GarageModal
          bikes={bikes}
          selectedBikeId={stats.selectedBikeId}
          stats={stats}
          onSelectBike={handleSelectBike}
          onUpgradeBike={handleUpgradeBike}
          onPaintBike={handlePaintBike}
          onBuyBike={handleBuyBike}
          onUnlockAll={handleUnlockAll}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveSettings(newSettings);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isCareerOpen && (
        <CareerModal
          missions={missions}
          onStartMission={handleStartMission}
          onClose={() => setIsCareerOpen(false)}
        />
      )}

      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartRide}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onMainMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
