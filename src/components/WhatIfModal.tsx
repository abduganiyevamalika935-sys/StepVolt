import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Zap,
  Battery,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { calculateStepEnergyWh } from '../simulation/physicsEngine';

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings: (settings: {
    pedestrianCount: number;
    joulesPerStep: number;
    nominalWattsMultiplier: number;
  }) => void;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({
  isOpen,
  onClose,
  onApplySettings,
}) => {
  // Simulator parameters
  const [pedestrians, setPedestrians] = useState(6500);
  const [tilesCount, setTilesCount] = useState(480);
  const [joulesPerStep, setJoulesPerStep] = useState(3.5);
  const [avgStepsPerPerson, setAvgStepsPerPerson] = useState(8);
  const [infrastructureDrawWatts, setInfrastructureDrawWatts] = useState(140);

  if (!isOpen) return null;

  // Real physical calculations:
  // Total steps across harvesting tiles daily = pedestrians * avgStepsPerPerson
  const totalDailySteps = pedestrians * avgStepsPerPerson;
  const singleStepWh = calculateStepEnergyWh(joulesPerStep, 0.85, 0.88);
  const dailyGeneratedWh = totalDailySteps * singleStepWh;

  // Daily infrastructure consumption = average 14 hours active load
  const dailyConsumedWh = infrastructureDrawWatts * 14;
  const netDailyWh = dailyGeneratedWh - dailyConsumedWh;
  const coveragePercent = Math.min(100, (dailyGeneratedWh / dailyConsumedWh) * 100);

  const isSurplus = netDailyWh >= 0;

  const handleReset = () => {
    setPedestrians(6500);
    setTilesCount(480);
    setJoulesPerStep(3.5);
    setAvgStepsPerPerson(8);
    setInfrastructureDrawWatts(140);
  };

  const handleApply = () => {
    // Map pedestrians (1,000 to 25,000) to avatar count (15 to 110)
    const avatarCount = Math.round(Math.min(110, Math.max(15, (pedestrians / 25000) * 110)));
    const wattsMultiplier = infrastructureDrawWatts / 140;

    onApplySettings({
      pedestrianCount: avatarCount,
      joulesPerStep,
      nominalWattsMultiplier: wattsMultiplier,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                "What If?" Smart-City Scenario Simulator
              </h3>
              <p className="text-[11px] text-slate-400">
                Predict kinetic yield, battery equilibrium, and municipal device coverage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pedestrians Slider */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Daily Pedestrians</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {pedestrians.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={pedestrians}
                onChange={(e) => setPedestrians(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1,000 (Low)</span>
                <span>25,000 (Hub)</span>
              </div>
            </div>

            {/* Installed Tiles Slider */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Kinetic Tiles Installed</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {tilesCount.toLocaleString()} tiles
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={tilesCount}
                onChange={(e) => setTilesCount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>50</span>
                <span>2,000</span>
              </div>
            </div>

            {/* Kinetic Energy / Step */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Energy / Footstep</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {joulesPerStep.toFixed(1)} J
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="7.0"
                step="0.1"
                value={joulesPerStep}
                onChange={(e) => setJoulesPerStep(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.5 J (Light)</span>
                <span>7.0 J (Heavy stride)</span>
              </div>
            </div>

            {/* Infrastructure Draw Watts */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Infrastructure Load</span>
                <span className="font-mono text-amber-400 font-bold">
                  {infrastructureDrawWatts} Watts
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="10"
                value={infrastructureDrawWatts}
                onChange={(e) => setInfrastructureDrawWatts(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>30 W (Sensors only)</span>
                <span>300 W (All streetlights)</span>
              </div>
            </div>
          </div>

          {/* Predictive Results Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Simulation Projections</span>
              <span className="text-[10px] text-slate-500">Physics-grounded estimate</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Est. Generation</div>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {(dailyGeneratedWh / 1000).toFixed(2)} kWh/day
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{dailyGeneratedWh.toFixed(0)} Wh</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Est. Consumption</div>
                <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                  {(dailyConsumedWh / 1000).toFixed(2)} kWh/day
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{dailyConsumedWh.toFixed(0)} Wh</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Daily Net Balance</div>
                <div
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    isSurplus ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isSurplus ? `+${(netDailyWh / 1000).toFixed(2)}` : `${(netDailyWh / 1000).toFixed(2)}`} kWh
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isSurplus ? 'Surplus buffer' : 'Grid supplemented'}
                </div>
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Local Infrastructure Autonomy Coverage:</span>
                <span className="font-mono font-bold text-cyan-300">{coveragePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    coveragePercent >= 100 ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, coveragePercent)}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              {isSurplus
                ? '✅ Footstep harvesting provides 100% self-sustained power for all local sensors, wayfinding screens, and smart lighting.'
                : '⚡ Harvested energy offsets a significant fraction of municipal power; remaining load seamlessly supplied by municipal grid.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
            >
              <span>Apply to Live Simulation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
