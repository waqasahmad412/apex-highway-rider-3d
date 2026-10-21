import React, { useState } from 'react';
import { X, Check, Zap, Gauge, Disc, Shield, Palette, Plus, Sparkles, Trash2, Car, Bike as BikeIcon } from 'lucide-react';
import { BikeSpec, PlayerStats } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface GarageModalProps {
  bikes: BikeSpec[];
  selectedBikeId: string;
  stats: PlayerStats;
  onSelectBike: (bikeId: string) => void;
  onUpgradeBike: (bikeId: string, upgradeType: 'engine' | 'transmission' | 'brakes' | 'tires') => void;
  onPaintBike: (bikeId: string, color: string) => void;
  onBuyBike: (bikeId: string) => void;
  onUnlockAll?: () => void;
  onAddVehicle?: (vehicle: BikeSpec) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
  onClose: () => void;
}

const PAINT_SWATCHES = [
  { name: 'Crimson Racing', color: '#e62424' },
  { name: 'Cyber Neon Cyan', color: '#06b6d4' },
  { name: 'Phantom Gold', color: '#f59e0b' },
  { name: 'Neon Violet', color: '#8b5cf6' },
  { name: 'Acid Green', color: '#10b981' },
  { name: 'Stealth Matte Black', color: '#18181b' },
  { name: 'Alpine Frost White', color: '#f8fafc' },
  { name: 'Sunset Orange', color: '#f97316' },
  { name: 'Bayside Deep Blue', color: '#2563eb' },
  { name: 'Hot Racing Pink', color: '#ec4899' },
  { name: 'Hyper Lime Glow', color: '#84cc16' },
  { name: 'Titanium Grey', color: '#64748b' },
];

const UPGRADE_COSTS = [600, 1200, 2200, 4000]; // tier 1, 2, 3, 4

const RANDOM_NAMES = {
  bike: [
    'Kawasaki Ninja H2',
    'Yamaha YZF R1M',
    'Ducati Panigale V4',
    'BMW S1000RR M',
    'Suzuki GSX-R1000',
    'Honda CBR1000RR Fireblade',
    'KTM Super Duke 1290 R',
    'MV Agusta Brutale 1000',
    'Triumph Speed Triple 1200',
    'Harley Custom V-Rod Bobber',
  ],
  car: [
    'Toyota Supra Turbo RZ',
    'Nissan GT-R Nismo R35',
    'Lamborghini Aventador SVJ',
    'Ferrari F8 Tributo',
    'Porsche 911 GT3 RS',
    'Ford Mustang Shelby GT500',
    'Dodge Charger Hellcat Redeye',
    'Bugatti Chiron Super Sport',
    'McLaren 765LT Spider',
    'Aston Martin Valkyrie',
  ],
};

export const GarageModal: React.FC<GarageModalProps> = ({
  bikes,
  selectedBikeId,
  stats,
  onSelectBike,
  onUpgradeBike,
  onPaintBike,
  onBuyBike,
  onUnlockAll,
  onAddVehicle,
  onDeleteVehicle,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bike' | 'car'>('all');
  const [activeTab, setActiveTab] = useState<'specs' | 'upgrades' | 'paint'>('specs');
  const [inspectingBikeId, setInspectingBikeId] = useState(selectedBikeId);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // New Custom Vehicle form state
  const [customType, setCustomType] = useState<'bike' | 'car'>('bike');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Superbike');
  const [customStyle, setCustomStyle] = useState('superbike');
  const [customColor, setCustomColor] = useState('#e62424');
  const [customTopSpeed, setCustomTopSpeed] = useState(310);
  const [customAcceleration, setCustomAcceleration] = useState(92);
  const [customHandling, setCustomHandling] = useState(88);
  const [customBraking, setCustomBraking] = useState(88);

  const bike = bikes.find((b) => b.id === inspectingBikeId) || bikes[0];

  const handleSelect = (id: string) => {
    soundManager.playUiClick();
    setInspectingBikeId(id);
    onSelectBike(id);
  };

  const handleRandomizeName = () => {
    soundManager.playUiClick();
    const pool = RANDOM_NAMES[customType];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setCustomName(picked);
  };

  const handleCreateCustomVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playUiClick();

    const name = customName.trim() || (customType === 'car' ? 'Custom Highway Racer' : 'Custom Apex Rider');
    const newId = `custom_${customType}_${Date.now()}`;

    const newVehicle: BikeSpec = {
      id: newId,
      name,
      category: customCategory,
      vehicleType: customType,
      style: customStyle,
      isCustom: true,
      price: 0,
      unlocked: true,
      color: customColor,
      secondaryColor: '#171717',
      baseStats: {
        topSpeed: customTopSpeed,
        acceleration: customAcceleration,
        handling: customHandling,
        braking: customBraking,
      },
      upgrades: { engine: 0, transmission: 0, brakes: 0, tires: 0 },
      description: `Custom ${customType === 'car' ? 'sports car' : 'motorcycle'} tuned for highway high-speed velocity.`,
    };

    if (onAddVehicle) {
      onAddVehicle(newVehicle);
    }
    setInspectingBikeId(newId);
    setIsCreatorOpen(false);
  };

  const filteredBikes = bikes.filter((b) => {
    if (filterType === 'bike') return b.vehicleType !== 'car';
    if (filterType === 'car') return b.vehicleType === 'car';
    return true;
  });

  const bikeCount = bikes.filter((b) => b.vehicleType !== 'car').length;
  const carCount = bikes.filter((b) => b.vehicleType === 'car').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <span className="text-xl">🔧</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  VEHICLE GARAGE & TUNING
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ALL UNLOCKED / سب ان لاک ہیں
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose any Motorcycle or Sports Car — all models are fully unlocked and ready to ride!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Custom Vehicle */}
            <button
              onClick={() => {
                soundManager.playUiClick();
                setIsCreatorOpen(true);
                if (!customName) {
                  setCustomName(RANDOM_NAMES[customType][0]);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Vehicle</span>
            </button>

            {/* Coins */}
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/40 px-3 py-1.5 rounded-xl">
              <span className="text-amber-400">🪙</span>
              <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Switcher */}
        <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterType('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>All Vehicles ({bikes.length})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterType('bike');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filterType === 'bike'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-cyan-300 border border-slate-800'
              }`}
            >
              <BikeIcon className="w-3.5 h-3.5" />
              <span>Motorcycles ({bikeCount})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterType('car');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filterType === 'car'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Sports Cars ({carCount})</span>
            </button>
          </div>

          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Click any vehicle to instantly ride</span>
          </div>
        </div>

        {/* Vehicles Horizontal / Multi-row Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4 bg-slate-950/20 border-b border-slate-800 max-h-56 overflow-y-auto">
          {filteredBikes.map((b) => {
            const isInspecting = b.id === inspectingBikeId;
            const isEquipped = b.id === selectedBikeId;
            const isCar = b.vehicleType === 'car';

            return (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                className={`p-2.5 rounded-2xl flex flex-col items-start gap-1 text-left transition-all relative group cursor-pointer ${
                  isEquipped
                    ? 'bg-slate-800/90 border-2 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : isInspecting
                    ? 'bg-slate-800 border-2 border-cyan-400 shadow-lg'
                    : 'bg-slate-900/70 border border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/50 shadow-sm"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {isCar ? '🏎️ CAR' : '🏍️ BIKE'}
                    </span>
                  </div>

                  {isEquipped ? (
                    <span className="text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/90 border border-emerald-700/80 px-1.5 py-0.5 rounded shadow-sm">
                      EQUIPPED
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase text-cyan-400/80 group-hover:text-cyan-300">
                      READY
                    </span>
                  )}
                </div>

                <span className="text-xs font-black text-white truncate w-full group-hover:text-cyan-300 transition-colors">
                  {b.name}
                </span>
                <span className="text-[10px] text-slate-400 uppercase truncate w-full">
                  {b.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Details Panel */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  {bike.category}
                </span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                  {bike.vehicleType === 'car' ? '🏎️ Sports Car' : '🏍️ Motorcycle'}
                </span>
                {bike.isCustom && (
                  <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded">
                    CUSTOM
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white italic tracking-wide">{bike.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{bike.description}</p>
            </div>

            {/* Performance Radar Readout */}
            <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                PERFORMANCE METRICS
              </span>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">TOP SPEED</span>
                  <span className="text-white font-mono">{bike.baseStats.topSpeed} KM/H</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${Math.min(100, (bike.baseStats.topSpeed / 380) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Acceleration */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">ACCELERATION</span>
                  <span className="text-emerald-400 font-mono">{bike.baseStats.acceleration}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${bike.baseStats.acceleration}%` }}
                  />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">HANDLING & LEAN</span>
                  <span className="text-indigo-400 font-mono">{bike.baseStats.handling}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400"
                    style={{ width: `${bike.baseStats.handling}%` }}
                  />
                </div>
              </div>

              {/* Braking */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">BRAKING FORCE</span>
                  <span className="text-rose-400 font-mono">{bike.baseStats.braking}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400"
                    style={{ width: `${bike.baseStats.braking}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Select / Active Button (All vehicles are fully unlocked!) */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onSelectBike(bike.id)}
                disabled={bike.id === selectedBikeId}
                className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  bike.id === selectedBikeId
                    ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 cursor-default shadow-lg shadow-emerald-500/10'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {bike.id === selectedBikeId
                    ? '✓ CURRENT ACTIVE VEHICLE (منتخب شدہ)'
                    : `SELECT ${bike.vehicleType === 'car' ? 'SPORTS CAR' : 'MOTORCYCLE'} (گاڑی چلائیں)`}
                </span>
              </button>

              {bike.isCustom && onDeleteVehicle && (
                <button
                  onClick={() => onDeleteVehicle(bike.id)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Custom Vehicle</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Tabs: Upgrades & Paint Shop */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Tabs Selector */}
            <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('upgrades')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upgrades'
                    ? 'bg-slate-800 text-cyan-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Performance Upgrades</span>
              </button>
              <button
                onClick={() => setActiveTab('paint')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'paint'
                    ? 'bg-slate-800 text-cyan-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Paint & Livery</span>
              </button>
            </div>

            {/* Upgrades Content */}
            {activeTab === 'upgrades' && (
              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'engine' as const,
                    name: bike.vehicleType === 'car' ? 'Twin-Turbo & ECU Remap' : 'ECU & Titanium Exhaust',
                    desc: 'Boosts horsepower, top speed, and redline stability.',
                    icon: Gauge,
                    color: 'text-amber-400',
                  },
                  {
                    key: 'transmission' as const,
                    name: bike.vehicleType === 'car' ? 'Dual-Clutch Transmission' : 'Quickshifter & Close-Ratio Box',
                    desc: 'Reduces shift lag and increases acceleration launch.',
                    icon: Zap,
                    color: 'text-cyan-400',
                  },
                  {
                    key: 'brakes' as const,
                    name: 'Carbon Ceramic Brembo Calipers',
                    desc: 'Sharper stopping bite and shorter braking distance.',
                    icon: Disc,
                    color: 'text-rose-400',
                  },
                  {
                    key: 'tires' as const,
                    name: bike.vehicleType === 'car' ? 'Track Slicks & Aero Diffuser' : 'Öhlins Suspension & Slicks',
                    desc: 'Deep lean angle limit and agile high-speed transitions.',
                    icon: Shield,
                    color: 'text-emerald-400',
                  },
                ].map((item) => {
                  const currentLevel = bike.upgrades[item.key] || 0;
                  const isMax = currentLevel >= 4;
                  const cost = !isMax ? UPGRADE_COSTS[currentLevel] : 0;
                  const canAfford = stats.coins >= cost && !isMax;

                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{item.name}</span>
                          <span className="text-[11px] text-slate-400">{item.desc}</span>
                          {/* Level Pips */}
                          <div className="flex gap-1.5 mt-1.5">
                            {[0, 1, 2, 3].map((lvl) => (
                              <div
                                key={lvl}
                                className={`w-5 h-1.5 rounded-full ${
                                  lvl < currentLevel ? 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]' : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onUpgradeBike(bike.id, item.key)}
                        disabled={isMax || !canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                          isMax
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 cursor-default'
                            : canAfford
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'MAX LEVEL' : `UPGRADE (${cost} 🪙)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paint Content */}
            {activeTab === 'paint' && (
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  SELECT COLOR SCHEME
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PAINT_SWATCHES.map((swatch) => {
                    const isSelected = bike.color.toLowerCase() === swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        onClick={() => {
                          soundManager.playUiClick();
                          onPaintBike(bike.id, swatch.color);
                        }}
                        className={`p-3 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-2 border-cyan-400 shadow-lg'
                            : 'bg-slate-950/60 border border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md flex items-center justify-center"
                          style={{ backgroundColor: swatch.color }}
                        >
                          {isSelected && <Check className="w-5 h-5 text-white drop-shadow" />}
                        </div>
                        <span className="text-[11px] font-bold text-slate-300 leading-tight">
                          {swatch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CUSTOM VEHICLE CREATOR DIALOG / MODAL */}
        {isCreatorOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    BUILD CUSTOM VEHICLE (نئی بائیک یا کار بنائیں)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create your own custom motorcycle or sports car and take it to the highway!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatorOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomVehicle} className="flex-1 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Type, Name, Style */}
              <div className="flex flex-col gap-4">
                {/* Vehicle Type Toggle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Vehicle Type (گاڑی کی قسم)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playUiClick();
                        setCustomType('bike');
                        setCustomCategory('Superbike');
                        setCustomStyle('superbike');
                      }}
                      className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        customType === 'bike'
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <BikeIcon className="w-4 h-4" />
                      <span>Motorcycle (موٹرسائیکل)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playUiClick();
                        setCustomType('car');
                        setCustomCategory('Supercar');
                        setCustomStyle('supercar');
                      }}
                      className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        customType === 'car'
                          ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span>Sports Car (کار)</span>
                    </button>
                  </div>
                </div>

                {/* Vehicle Name with Randomize */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Vehicle Name (گاڑی کا نام)
                    </label>
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random Name (بے ترتیب نام)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={customType === 'car' ? 'e.g. Supra Turbo RZ' : 'e.g. Ninja H2 Carbon'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-cyan-400 focus:outline-none"
                    maxLength={35}
                  />
                </div>

                {/* Style / Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Model Style (باڈی اسٹائل)
                  </label>
                  <select
                    value={customStyle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomStyle(val);
                      if (val === 'superbike') setCustomCategory('Superbike');
                      else if (val === 'naked') setCustomCategory('Naked Beast');
                      else if (val === 'chopper') setCustomCategory('Cruiser Custom');
                      else if (val === 'motocross') setCustomCategory('Motocross Enduro');
                      else if (val === 'classic') setCustomCategory('Classic Cafe');
                      else if (val === 'supercar') setCustomCategory('Supercar');
                      else if (val === 'muscle') setCustomCategory('V8 Muscle Car');
                      else if (val === 'hypercar') setCustomCategory('Stealth Hypercar');
                      else if (val === 'drift') setCustomCategory('JDM Drift Coupe');
                      else if (val === 'police') setCustomCategory('Police Interceptor');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-cyan-400 focus:outline-none"
                  >
                    {customType === 'bike' ? (
                      <>
                        <option value="superbike">🏍️ Superbike (Aerodynamic Full-Fairing)</option>
                        <option value="naked">🏍️ Naked Streetfighter (Wide Handlebars)</option>
                        <option value="chopper">🏍️ Custom Cruiser / Chopper (Ape Hangers)</option>
                        <option value="motocross">🏍️ Motocross Enduro (Off-Road Dual-Sport)</option>
                        <option value="classic">🏍️ Classic Cafe Racer (Retro Round Lamp)</option>
                      </>
                    ) : (
                      <>
                        <option value="supercar">🏎️ Italian Supercar (Mid-Engine V8, Carbon Splitter)</option>
                        <option value="muscle">🏎️ V8 American Muscle (Supercharger Hood Scoop)</option>
                        <option value="hypercar">🏎️ Stealth Hypercar (Active Aero Diffusers)</option>
                        <option value="drift">🏎️ JDM Drift Spec (Widebody & High GT Wing)</option>
                        <option value="police">🏎️ Police Pursuit Special (Strobe Lights & Bullbar)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Color Swatches */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Body Color (رنگ منتخب کریں)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAINT_SWATCHES.map((s) => (
                      <button
                        key={s.color}
                        type="button"
                        onClick={() => setCustomColor(s.color)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          customColor === s.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: s.color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                      title="Custom Hex Color"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Custom Stats */}
              <div className="flex flex-col gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  TUNING PARAMETERS (کارکردگی کی ترتیبات)
                </span>

                {/* Top Speed */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">TOP SPEED</span>
                    <span className="font-mono text-cyan-400">{customTopSpeed} KM/H</span>
                  </div>
                  <input
                    type="range"
                    min={220}
                    max={380}
                    step={5}
                    value={customTopSpeed}
                    onChange={(e) => setCustomTopSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Acceleration */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">ACCELERATION</span>
                    <span className="font-mono text-emerald-400">{customAcceleration}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    step={1}
                    value={customAcceleration}
                    onChange={(e) => setCustomAcceleration(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                {/* Handling */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">HANDLING</span>
                    <span className="font-mono text-indigo-400">{customHandling}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    step={1}
                    value={customHandling}
                    onChange={(e) => setCustomHandling(Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>

                {/* Braking */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">BRAKING FORCE</span>
                    <span className="font-mono text-rose-400">{customBraking}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    step={1}
                    value={customBraking}
                    onChange={(e) => setCustomBraking(Number(e.target.value))}
                    className="w-full accent-rose-400"
                  />
                </div>

                {/* Live Preview Preview Badge */}
                <div className="mt-auto p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border border-white/20 shadow-inner flex items-center justify-center text-xs"
                    style={{ backgroundColor: customColor }}
                  >
                    {customType === 'car' ? '🏎️' : '🏍️'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">
                      {customName.trim() || 'Custom Vehicle'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {customTopSpeed} KM/H • {customCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  Save & Drive Now (گاڑی شامل کریں اور چلائیں)
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
