import React from 'react';
import {
  X,
  Zap,
  Activity,
  Thermometer,
  Wrench,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { EnergyTile } from '../types/simulation';

interface TileInspectorModalProps {
  tile: EnergyTile | null;
  onClose: () => void;
  onMaintainTile: (tileId: string) => void;
}

export const TileInspectorModal: React.FC<TileInspectorModalProps> = ({
  tile,
  onClose,
  onMaintainTile,
}) => {
  if (!tile) return null;

  const isDegraded = tile.efficiency < 80 || tile.condition === 'MAINTENANCE_REQUIRED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Tile Telemetry Inspector</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  {tile.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zone: <span className="text-slate-200 capitalize font-medium">{tile.zone}</span> · Coords: [{tile.x.toFixed(1)}, {tile.z.toFixed(1)}]
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

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Alert Banner */}
          {isDegraded ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300">Maintenance Recommended</div>
                <div className="text-[11px] text-amber-200/80 mt-0.5">
                  Piezoelectric transducer efficiency has dropped to {tile.efficiency.toFixed(1)}%. Recalibration or cartridge replacement is advised.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-300">Optimal Operating Condition</div>
                <div className="text-[11px] text-emerald-200/80">
                  Transducer response and mechanical damping are within certified parameters.
                </div>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pressure Events</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {tile.pressureEvents.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Deflection cycles</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Energy Harvested</span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-300">
                {tile.energyGeneratedWh.toFixed(2)} Wh
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cumulative output</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Conversion Efficiency</span>
              </div>
              <div className={`text-base font-bold font-mono ${isDegraded ? 'text-amber-400' : 'text-cyan-300'}`}>
                {tile.efficiency.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Rating nominal: 85%</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Surface Temperature</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {tile.temperature.toFixed(1)}°C
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Thermal equilibrium</div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between py-0.5 text-slate-400">
              <span>Transducer Core:</span>
              <span className="text-slate-200 font-mono">PZT-5H Ceramic Multi-Layer</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-400">
              <span>Mechanical Travel:</span>
              <span className="text-slate-200 font-mono">4.5 mm Hydraulic Damped</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-400">
              <span>Subsurface Conductor:</span>
              <span className="text-slate-200 font-mono">Shielded 24V DC Bus SG-Net</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onMaintainTile(tile.id)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Calibrate & Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};
