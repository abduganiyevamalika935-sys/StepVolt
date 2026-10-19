import React from 'react';
import {
  Sun,
  Moon,
  Clock,
  Sparkles,
  Zap,
  SlidersHorizontal,
  BarChart3,
  Camera,
  Layers,
} from 'lucide-react';
import { DayNightMode } from '../types/simulation';

interface HeaderProps {
  dayNightMode: DayNightMode;
  timeOfDay: number;
  energyFlowMode: boolean;
  onToggleEnergyFlow: () => void;
  onChangeDayNightMode: (mode: DayNightMode) => void;
  onOpenAiAssistant: () => void;
  onOpenWhatIf: () => void;
  onOpenAnalytics: () => void;
  cameraPreset: 'overview' | 'metro' | 'plaza' | 'battery' | 'top' | 'street';
  onChangeCameraPreset: (preset: 'overview' | 'metro' | 'plaza' | 'battery' | 'top' | 'street') => void;
  activeScenarioName: string;
}

export const Header: React.FC<HeaderProps> = ({
  dayNightMode,
  timeOfDay,
  energyFlowMode,
  onToggleEnergyFlow,
  onChangeDayNightMode,
  onOpenAiAssistant,
  onOpenWhatIf,
  onOpenAnalytics,
  cameraPreset,
  onChangeCameraPreset,
  activeScenarioName,
}) => {
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              StepGrid
            </h1>
            <span className="text-[11px] font-medium text-cyan-400/90">
              Smart Pedestrian Energy Network
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Micro-Grid Simulation
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300 font-medium">{activeScenarioName}</span>
          </div>
        </div>
      </div>

      {/* Center Controls: Camera Presets & Energy Flow Mode */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Camera Views */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
          <div className="px-2 py-1 text-slate-400 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">View</span>
          </div>
          {(
            [
              { id: 'overview', label: 'District' },
              { id: 'metro', label: 'Metro' },
              { id: 'plaza', label: 'Plaza' },
              { id: 'battery', label: 'Battery' },
              { id: 'top', label: 'Top-Down' },
              { id: 'street', label: 'Street' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChangeCameraPreset(preset.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                cameraPreset === preset.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Energy Flow Toggle */}
        <button
          onClick={onToggleEnergyFlow}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
            energyFlowMode
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title="Toggle glowing underground conduits and energy particle flow"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Energy Flow</span>
        </button>
      </div>

      {/* Right Controls: Day/Night, AI Copilot, What-If, Analytics */}
      <div className="flex items-center gap-2">
        {/* Day / Night / Auto Control */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onChangeDayNightMode('day')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition-all ${
              dayNightMode === 'day'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Day Mode (Solar lighting, dimmed path lights)"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Day</span>
          </button>
          <button
            onClick={() => onChangeDayNightMode('night')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition-all ${
              dayNightMode === 'night'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Night Mode (Streetlights active, battery discharge)"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Night</span>
          </button>
          <button
            onClick={() => onChangeDayNightMode('auto')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition-all ${
              dayNightMode === 'auto'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="24-Hour Automated Cycle"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{formatTime(timeOfDay)}</span>
          </button>
        </div>

        {/* What-If Simulation */}
        <button
          onClick={onOpenWhatIf}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">What-If</span>
        </button>

        {/* Analytics Charts */}
        <button
          onClick={onOpenAnalytics}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Analytics</span>
        </button>

        {/* AI Copilot Button */}
        <button
          onClick={onOpenAiAssistant}
          className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/80 hover:to-blue-900/80 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Copilot</span>
        </button>
      </div>
    </header>
  );
};
