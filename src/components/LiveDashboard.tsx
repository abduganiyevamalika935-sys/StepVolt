import React from 'react';
import {
  Zap,
  Battery,
  BatteryCharging,
  Users,
  Footprints,
  Leaf,
  ShieldCheck,
  Power,
  ChevronRight,
  Sun,
  Moon,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { BatteryState, InfrastructureLoad, SimulationTelemetry } from '../types/simulation';

interface LiveDashboardProps {
  telemetry: SimulationTelemetry;
  battery: BatteryState;
  loads: InfrastructureLoad[];
  onToggleLoad: (loadId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  degradedTilesCount: number;
  onOpenTileInspectorWithDegraded: () => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  telemetry,
  battery,
  loads,
  onToggleLoad,
  isOpen,
  onToggle,
  degradedTilesCount,
  onOpenTileInspectorWithDegraded,
}) => {
  const isNetPositive = telemetry.netWatts >= 0;

  return (
    <aside
      className={`absolute top-16 bottom-0 right-0 z-20 w-88 bg-slate-950/95 backdrop-blur-md border-l border-slate-800 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Toggle Tab */}
      <button
        onClick={onToggle}
        className="absolute -left-8 top-6 bg-slate-900 border-y border-l border-slate-800 text-slate-300 hover:text-white px-2 py-3 rounded-l-lg shadow-xl text-xs font-semibold flex items-center justify-center cursor-pointer"
        title="Toggle Live Dashboard"
      >
        <span className="[writing-mode:vertical-lr] tracking-widest text-[10px] uppercase">
          {isOpen ? 'Close' : 'Live Dashboard'}
        </span>
      </button>

      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live Energy Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          Simulation
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300 custom-scrollbar">
        {/* Core Metric Cards */}
        <section className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pedestrians</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {Math.round(telemetry.pedestrianCount * 220).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {telemetry.pedestrianCount} active in view
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Steps</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {telemetry.totalSteps.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {telemetry.activeTilesCount} kinetic tiles
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Harvested</span>
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300">
              {telemetry.energyGeneratedWh.toFixed(1)} <span className="text-xs font-normal">Wh</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              +{(telemetry.generationRateWatts).toFixed(1)} W kinetic rate
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Consumed</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300">
              {telemetry.energyConsumedWh.toFixed(1)} <span className="text-xs font-normal">Wh</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              -{(telemetry.consumptionRateWatts).toFixed(1)} W local loads
            </div>
          </div>
        </section>

        {/* Central Battery Storage Gauge */}
        <section className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <BatteryCharging className="w-4 h-4 text-cyan-400" />
              <span>Central Battery Storage</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                isNetPositive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
              }`}
            >
              {isNetPositive ? `+${telemetry.netWatts.toFixed(1)} W Net` : `${telemetry.netWatts.toFixed(1)} W Net`}
            </span>
          </div>

          {/* Battery Progress Bar */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Buffer Charge Level</span>
              <span className="font-mono font-bold text-white">{battery.percentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  battery.percentage > 40
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, battery.percentage))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 font-mono">
            <div>
              <div className="text-slate-500">Stored</div>
              <div className="text-slate-200 font-semibold">{battery.storedWh.toFixed(1)} Wh</div>
            </div>
            <div>
              <div className="text-slate-500">Capacity</div>
              <div className="text-slate-200 font-semibold">{battery.capacityWh} Wh</div>
            </div>
            <div>
              <div className="text-slate-500">Temp</div>
              <div className="text-slate-200 font-semibold">{battery.temperatureC.toFixed(1)}°C</div>
            </div>
          </div>
        </section>

        {/* Smart City Infrastructure Loads */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Smart City Loads
            </span>
            <span className="text-[10px] text-cyan-400">
              {telemetry.infrastructurePoweredCount} devices powered
            </span>
          </div>

          <div className="space-y-1.5">
            {loads.map((load) => {
              return (
                <div
                  key={load.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    load.isEnabled
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          load.isEnabled ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{load.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {load.unitCount} units · {load.currentWatts.toFixed(0)} W draw
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleLoad(load.id)}
                      className={`p-1.5 rounded-md border text-[11px] transition-colors ${
                        load.isEnabled
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                      title={load.isEnabled ? 'Turn load off' : 'Turn load on'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {load.isEnabled && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Leaf className="w-3 h-3" />
                        POWERED BY PEDESTRIAN ENERGY
                      </span>
                      <span className="font-mono text-slate-400">P{load.priority}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Maintenance Warnings if degraded tiles exist */}
        {degradedTilesCount > 0 && (
          <section
            onClick={onOpenTileInspectorWithDegraded}
            className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 cursor-pointer hover:bg-amber-950/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{degradedTilesCount} Tiles Need Maintenance</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-amber-200/80 mt-1">
              Tile SG-2048 and others report high fatigue cycles and dampening. Click to inspect & calibrate.
            </p>
          </section>
        )}

        {/* Sustainability & Environmental Metrics */}
        <section className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sustainability Impact</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
              <div className="text-slate-400 text-[10px]">Avoided CO₂</div>
              <div className="text-emerald-400 font-bold font-mono text-sm mt-0.5">
                {telemetry.co2AvoidedKg.toFixed(3)} kg
              </div>
            </div>

            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
              <div className="text-slate-400 text-[10px]">System Efficiency</div>
              <div className="text-cyan-400 font-bold font-mono text-sm mt-0.5">
                {telemetry.systemEfficiency}%
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic mt-1">
            *Simulation disclaimer: Pedestrian kinetic harvesting supplements localized micro-loads; not intended as total grid replacement.
          </p>
        </section>
      </div>
    </aside>
  );
};
