import React from 'react';
import {
  Activity,
  Users,
  Gauge,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  Flame,
  CloudRain,
  Wrench,
} from 'lucide-react';
import { EnergyZone, ScenarioId } from '../types/simulation';
import { SCENARIO_PRESETS } from '../simulation/physicsEngine';

interface CityControlsPanelProps {
  currentScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  pedestrianCount: number;
  onChangePedestrianCount: (count: number) => void;
  joulesPerStep: number;
  onChangeJoulesPerStep: (joules: number) => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  zones: EnergyZone[];
  onTriggerEvent: (eventName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const CityControlsPanel: React.FC<CityControlsPanelProps> = ({
  currentScenario,
  onSelectScenario,
  pedestrianCount,
  onChangePedestrianCount,
  joulesPerStep,
  onChangeJoulesPerStep,
  simSpeed,
  onChangeSimSpeed,
  zones,
  onTriggerEvent,
  isOpen,
  onToggle,
}) => {
  return (
    <aside
      className={`absolute top-16 bottom-0 left-0 z-20 w-80 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Toggle Tab */}
      <button
        onClick={onToggle}
        className="absolute -right-8 top-6 bg-slate-900 border-y border-r border-slate-800 text-slate-300 hover:text-white px-2 py-3 rounded-r-lg shadow-xl text-xs font-semibold flex items-center justify-center cursor-pointer"
        title="Toggle City Controls"
      >
        <span className="[writing-mode:vertical-lr] tracking-widest text-[10px] uppercase">
          {isOpen ? 'Close' : 'City Controls'}
        </span>
      </button>

      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            District Simulation Controls
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-slate-300 custom-scrollbar">
        {/* Preset Scenarios */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Scenarios
            </span>
            <span className="text-[10px] text-cyan-400">Pre-configured flows</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(SCENARIO_PRESETS) as ScenarioId[]).map((key) => {
              const preset = SCENARIO_PRESETS[key];
              const isSelected = currentScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => onSelectScenario(key)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-100 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {key === 'rush_hour'
                      ? 'Commuter rush'
                      : key === 'metro_exit'
                      ? 'Transit surge'
                      : key === 'concert'
                      ? 'Mass gathering'
                      : key === 'night'
                      ? 'Low footfall'
                      : key === 'weekend'
                      ? 'Promenade'
                      : 'Standard day'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Real-time Footfall Tuning */}
        <section className="space-y-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Pedestrian Traffic
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                {pedestrianCount} avatars ({Math.round(pedestrianCount * 220).toLocaleString()} district)
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={pedestrianCount}
              onChange={(e) => onChangePedestrianCount(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Light Flow</span>
              <span>Moderate</span>
              <span>Extreme Surge</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                Kinetic Energy / Step
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {joulesPerStep.toFixed(1)} Joules
              </span>
            </div>
            <input
              type="range"
              min="1.5"
              max="6.0"
              step="0.1"
              value={joulesPerStep}
              onChange={(e) => onChangeJoulesPerStep(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Physical piezoelectric conversion range: 2.0 to 5.0 Joules mechanical work.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-400" />
                Simulation Clock Speed
              </span>
              <span className="font-mono text-blue-400 font-semibold">{simSpeed}x</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0.5, 1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onChangeSimSpeed(speed)}
                  className={`py-1 rounded text-[11px] font-mono font-medium border transition-colors ${
                    simSpeed === speed
                      ? 'bg-blue-600/30 border-blue-500/60 text-blue-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live Event Injector */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Inject Dynamic Events
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onTriggerEvent('surge')}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Metro Surge</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Train arrival crowd burst</p>
            </button>

            <button
              onClick={() => onTriggerEvent('demand')}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-amber-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Flame className="w-3.5 h-3.5" />
                <span>Demand Spike</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">+50% display & light load</p>
            </button>

            <button
              onClick={() => onTriggerEvent('rain')}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-blue-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                <CloudRain className="w-3.5 h-3.5" />
                <span>Inclement Rain</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Diverts traffic to canopy</p>
            </button>

            <button
              onClick={() => onTriggerEvent('wear')}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-rose-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                <Wrench className="w-3.5 h-3.5" />
                <span>Fatigue Cycle</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Triggers maintenance flags</p>
            </button>
          </div>
        </section>

        {/* District Zones & Footfall Density Map */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pedestrian Zones
            </span>
            <span className="text-[10px] text-slate-500">Active Grid</span>
          </div>
          <div className="space-y-1.5">
            {zones.map((zone) => {
              const densityColor =
                zone.density === 'EXTREME'
                  ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
                  : zone.density === 'HIGH'
                  ? 'text-blue-400 bg-blue-950/60 border-blue-800/60'
                  : zone.density === 'MEDIUM'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                  : 'text-lime-400 bg-lime-950/60 border-lime-800/60';

              return (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{zone.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {zone.tileCount} tiles · {zone.generationShare}% yield share
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${densityColor}`}>
                    {zone.density}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
};
