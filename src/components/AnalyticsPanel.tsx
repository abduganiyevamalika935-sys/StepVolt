import React, { useState } from 'react';
import {
  X,
  BarChart3,
  TrendingUp,
  Zap,
  Battery,
  Users,
} from 'lucide-react';
import { generateHistoricalData } from '../simulation/physicsEngine';

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const data = generateHistoricalData(period);

  if (!isOpen) return null;

  // Compute max values for SVG scaling
  const maxEnergy = Math.max(...data.map((d) => Math.max(d.energyGeneratedWh, d.energyConsumedWh)), 1);
  const maxPedestrians = Math.max(...data.map((d) => d.pedestrianCount), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  District Historical Analytics & Energy Trends
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  Telemetry History
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Evaluation of kinetic micro-generation vs municipal local load demand.
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

        {/* Period Selector Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" /> Energy Harvested (Wh)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-3 h-1 bg-amber-400 rounded-full" /> Load Consumed (Wh)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-3 h-1 bg-emerald-400 rounded-full" /> Battery Charge (%)
            </span>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {(
              [
                { id: '1h', label: '1 Hour' },
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  period === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Body */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar text-xs">
          {/* Chart 1: Energy Generation vs Consumption (Wh) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Energy Balance Profile</span>
              <span className="text-[10px] text-slate-400">Peak {maxEnergy.toFixed(1)} Wh</span>
            </div>

            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${data.length * 50} 140`}>
                {/* Horizontal reference lines */}
                <line x1="0" y1="20" x2={data.length * 50} y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="70" x2={data.length * 50} y2="70" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="120" x2={data.length * 50} y2="120" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />

                {/* Energy Generated Line (Cyan) */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  points={data
                    .map((d, i) => `${i * 50 + 25},${120 - (d.energyGeneratedWh / maxEnergy) * 100}`)
                    .join(' ')}
                />

                {/* Energy Consumed Line (Amber) */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  points={data
                    .map((d, i) => `${i * 50 + 25},${120 - (d.energyConsumedWh / maxEnergy) * 100}`)
                    .join(' ')}
                />

                {/* Data points */}
                {data.map((d, i) => (
                  <g key={i}>
                    <circle
                      cx={i * 50 + 25}
                      cy={120 - (d.energyGeneratedWh / maxEnergy) * 100}
                      r="3.5"
                      fill="#06b6d4"
                    />
                    <text
                      x={i * 50 + 25}
                      y="135"
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {d.timeLabel}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Chart 2: Battery State of Charge (%) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Battery Buffer Storage Level</span>
              <span className="text-[10px] text-emerald-400 font-mono">SoC Curve</span>
            </div>

            <div className="h-32 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${data.length * 50} 100`}>
                <line x1="0" y1="10" x2={data.length * 50} y2="10" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                <line x1="0" y1="50" x2={data.length * 50} y2="50" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                <line x1="0" y1="90" x2={data.length * 50} y2="90" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

                {/* Battery percentage line */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={data
                    .map((d, i) => `${i * 50 + 25},${90 - (d.batteryPercentage / 100) * 80}`)
                    .join(' ')}
                />

                {data.map((d, i) => (
                  <g key={i}>
                    <circle
                      cx={i * 50 + 25}
                      cy={90 - (d.batteryPercentage / 100) * 80}
                      r="3"
                      fill="#10b981"
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
