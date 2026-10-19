import React, { useState, useEffect, useRef, useCallback } from 'react';
import { City3DCanvas } from './components/City3DCanvas';
import { Header } from './components/Header';
import { CityControlsPanel } from './components/CityControlsPanel';
import { LiveDashboard } from './components/LiveDashboard';
import { TileInspectorModal } from './components/TileInspectorModal';
import { WhatIfModal } from './components/WhatIfModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import {
  EnergyTile,
  EnergyZone,
  InfrastructureLoad,
  BatteryState,
  SimulationTelemetry,
  DayNightMode,
  ScenarioId,
  ZoneId,
} from './types/simulation';
import {
  INITIAL_ZONES,
  INITIAL_LOADS,
  SCENARIO_PRESETS,
  calculateStepEnergyWh,
  calculateLightingPower,
} from './simulation/physicsEngine';

// Generate realistic kinetic tiles for the smart district
function generateDistrictTiles(): EnergyTile[] {
  const tiles: EnergyTile[] = [];
  let idCounter = 1000;

  // 1. Metro Transit Concourse Tiles (highest traffic)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      idCounter++;
      const id = idCounter === 1008 ? 'SG-2048' : `SG-${idCounter}`;
      tiles.push({
        id,
        zone: 'metro',
        x: -22 + c * 1.5,
        z: 14 + r * 1.5,
        width: 1.25,
        depth: 1.25,
        pressureEvents: id === 'SG-2048' ? 14820 : Math.floor(4000 + Math.random() * 6000),
        energyGeneratedWh: id === 'SG-2048' ? 16.4 : Number((3.5 + Math.random() * 6).toFixed(2)),
        efficiency: id === 'SG-2048' ? 76.2 : Number((84 + Math.random() * 4).toFixed(1)),
        temperature: id === 'SG-2048' ? 28.4 : Number((23 + Math.random() * 2).toFixed(1)),
        condition: id === 'SG-2048' ? 'MAINTENANCE_REQUIRED' : 'GOOD',
        lastSteppedAt: Date.now(),
        compression: 0,
      });
    }
  }

  // 2. Central Civic Plaza Tiles
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      idCounter++;
      const isWorn = idCounter === 1024;
      tiles.push({
        id: isWorn ? 'SG-1082' : `SG-${idCounter}`,
        zone: 'plaza',
        x: c * 1.6,
        z: r * 1.6,
        width: 1.3,
        depth: 1.3,
        pressureEvents: isWorn ? 11200 : Math.floor(2500 + Math.random() * 4000),
        energyGeneratedWh: Number((2.8 + Math.random() * 4).toFixed(2)),
        efficiency: isWorn ? 78.5 : Number((85 + Math.random() * 3).toFixed(1)),
        temperature: Number((22.5 + Math.random() * 2).toFixed(1)),
        condition: isWorn ? 'MAINTENANCE_REQUIRED' : 'GOOD',
        lastSteppedAt: Date.now(),
        compression: 0,
      });
    }
  }

  // 3. Commercial Arcade Tiles
  for (let i = 0; i < 8; i++) {
    idCounter++;
    tiles.push({
      id: `SG-${idCounter}`,
      zone: 'shopping',
      x: 10 + (i % 4) * 1.5,
      z: -6 - Math.floor(i / 4) * 1.6,
      width: 1.25,
      depth: 1.25,
      pressureEvents: Math.floor(1800 + Math.random() * 3000),
      energyGeneratedWh: Number((1.5 + Math.random() * 3).toFixed(2)),
      efficiency: Number((85 + Math.random() * 3).toFixed(1)),
      temperature: Number((22 + Math.random() * 2).toFixed(1)),
      condition: 'GOOD',
      lastSteppedAt: Date.now(),
      compression: 0,
    });
  }

  // 4. Eco-Corridor Promenade (Park) Tiles
  for (let i = 0; i < 6; i++) {
    idCounter++;
    tiles.push({
      id: `SG-${idCounter}`,
      zone: 'park',
      x: -16 + (i % 3) * 1.6,
      z: -14 - Math.floor(i / 3) * 1.6,
      width: 1.25,
      depth: 1.25,
      pressureEvents: Math.floor(900 + Math.random() * 1500),
      energyGeneratedWh: Number((0.8 + Math.random() * 1.5).toFixed(2)),
      efficiency: Number((86 + Math.random() * 2).toFixed(1)),
      temperature: Number((21 + Math.random() * 1.5).toFixed(1)),
      condition: 'GOOD',
      lastSteppedAt: Date.now(),
      compression: 0,
    });
  }

  return tiles;
}

export default function App() {
  // Primary Simulation State
  const [tiles, setTiles] = useState<EnergyTile[]>(() => generateDistrictTiles());
  const [zones] = useState<EnergyZone[]>(INITIAL_ZONES);
  const [loads, setLoads] = useState<InfrastructureLoad[]>(INITIAL_LOADS);

  const [currentScenario, setCurrentScenario] = useState<ScenarioId>('normal');
  const [pedestrianCount, setPedestrianCount] = useState<number>(45); // 3D avatars
  const [joulesPerStep, setJoulesPerStep] = useState<number>(3.5);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [energyFlowMode, setEnergyFlowMode] = useState<boolean>(false);
  const [dayNightMode, setDayNightMode] = useState<DayNightMode>('day');
  const [timeOfDay, setTimeOfDay] = useState<number>(14.0); // 2:00 PM
  const [cameraPreset, setCameraPreset] = useState<
    'overview' | 'metro' | 'plaza' | 'battery' | 'top' | 'street'
  >('overview');

  // Battery Storage Core State (500 Wh localized buffer)
  const [battery, setBattery] = useState<BatteryState>({
    percentage: 74.0,
    capacityWh: 500,
    storedWh: 370.0,
    chargingRateWatts: 42.5,
    consumptionRateWatts: 38.0,
    netWatts: 4.5,
    temperatureC: 24.2,
    health: 98.4,
  });

  // Cumulative Telemetry
  const [telemetry, setTelemetry] = useState<SimulationTelemetry>({
    pedestrianCount: 45,
    activeTilesCount: tiles.length,
    totalSteps: 186420,
    energyGeneratedWh: 48.6,
    energyStoredWh: 370.0,
    energyConsumedWh: 38.2,
    batteryPercentage: 74.0,
    infrastructurePoweredCount: 39,
    co2AvoidedKg: 0.0486 * 0.42, // kg CO2 avoided
    systemEfficiency: 85,
    generationRateWatts: 42.5,
    consumptionRateWatts: 38.0,
    netWatts: 4.5,
    scenario: 'normal',
    dayNightMode: 'day',
    timeOfDayHours: 14.0,
  });

  // UI Panels and Modals
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [selectedTile, setSelectedTile] = useState<EnergyTile | null>(null);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Responsive default sidebars
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsControlsOpen(false);
      setIsDashboardOpen(false);
    }
  }, []);

  // Degraded tiles count
  const degradedTilesCount = tiles.filter(
    (t) => t.condition === 'MAINTENANCE_REQUIRED' || t.efficiency < 80
  ).length;

  // Handle tile step from 3D physics canvas
  const handleTileStep = useCallback(
    (tileId: string) => {
      const stepWh = calculateStepEnergyWh(joulesPerStep, 0.85, 0.88);

      setTiles((prev) =>
        prev.map((t) => {
          if (t.id === tileId) {
            return {
              ...t,
              pressureEvents: t.pressureEvents + 1,
              energyGeneratedWh: Number((t.energyGeneratedWh + stepWh).toFixed(4)),
              lastSteppedAt: Date.now(),
            };
          }
          return t;
        })
      );

      // Increment total footstep counters
      setTelemetry((prev) => ({
        ...prev,
        totalSteps: prev.totalSteps + 1,
        energyGeneratedWh: Number((prev.energyGeneratedWh + stepWh).toFixed(3)),
        co2AvoidedKg: Number(((prev.energyGeneratedWh + stepWh) * 0.00042).toFixed(4)),
      }));
    },
    [joulesPerStep]
  );

  // Handle tile maintenance
  const handleMaintainTile = (tileId: string) => {
    setTiles((prev) =>
      prev.map((t) => {
        if (t.id === tileId) {
          return {
            ...t,
            efficiency: 87.5,
            temperature: 23.0,
            condition: 'GOOD',
          };
        }
        return t;
      })
    );
    if (selectedTile && selectedTile.id === tileId) {
      setSelectedTile((prev) =>
        prev
          ? {
              ...prev,
              efficiency: 87.5,
              temperature: 23.0,
              condition: 'GOOD',
            }
          : null
      );
    }
  };

  // Toggle smart infrastructure load
  const handleToggleLoad = (loadId: string) => {
    setLoads((prev) =>
      prev.map((item) => (item.id === loadId ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  // Change scenario preset
  const handleSelectScenario = (scenarioId: ScenarioId) => {
    setCurrentScenario(scenarioId);
    const preset = SCENARIO_PRESETS[scenarioId];
    if (preset) {
      setPedestrianCount(Math.round(45 * preset.pedestrianDensityMultiplier));
      setTimeOfDay(preset.timeOfDay);
      setDayNightMode(preset.dayNightMode);
    }
  };

  // Apply What-If simulation results
  const handleApplyWhatIfSettings = (settings: {
    pedestrianCount: number;
    joulesPerStep: number;
    nominalWattsMultiplier: number;
  }) => {
    setPedestrianCount(settings.pedestrianCount);
    setJoulesPerStep(settings.joulesPerStep);
    setLoads((prev) =>
      prev.map((l) => ({
        ...l,
        nominalWatts: Math.round(l.nominalWatts * settings.nominalWattsMultiplier),
      }))
    );
  };

  // Trigger dynamic city events
  const handleTriggerEvent = (eventName: string) => {
    if (eventName === 'surge') {
      setPedestrianCount((prev) => Math.min(120, prev + 35));
      setCameraPreset('metro');
    } else if (eventName === 'demand') {
      setLoads((prev) =>
        prev.map((l) => ({ ...l, currentWatts: Math.round(l.nominalWatts * 1.4) }))
      );
    } else if (eventName === 'rain') {
      setCameraPreset('plaza');
    } else if (eventName === 'wear') {
      setTiles((prev) => {
        const next = [...prev];
        if (next.length > 5) {
          next[3].efficiency = 74.0;
          next[3].condition = 'MAINTENANCE_REQUIRED';
        }
        return next;
      });
    }
  };

  // Simulation Clock Tick Loop
  useEffect(() => {
    const intervalMs = 1000 / simSpeed;

    const timer = setInterval(() => {
      // 1. Advance time of day if auto
      setTimeOfDay((prevTime) => {
        if (dayNightMode === 'auto') {
          return (prevTime + 0.05 * simSpeed) % 24;
        }
        return prevTime;
      });

      // 2. Calculate dynamic infrastructure draw
      let totalWattsDraw = 0;
      setLoads((prevLoads) =>
        prevLoads.map((load) => {
          if (!load.isEnabled) {
            return { ...load, currentWatts: 0 };
          }
          if (load.category === 'lighting') {
            const lightW = calculateLightingPower(
              load.nominalWatts,
              timeOfDay,
              battery.percentage
            );
            totalWattsDraw += lightW;
            return { ...load, currentWatts: lightW };
          } else {
            totalWattsDraw += load.nominalWatts;
            return { ...load, currentWatts: load.nominalWatts };
          }
        })
      );

      // 3. Calculate generation rate based on footfall
      // Real physics: steps per second ≈ pedestrianCount * 1.2
      const stepsPerSec = pedestrianCount * 1.4 * simSpeed;
      const stepWh = calculateStepEnergyWh(joulesPerStep, 0.85, 0.88);
      const generationRateWatts = stepsPerSec * (stepWh * 3600); // 1 W = 1 J/s
      const consumptionRateWatts = totalWattsDraw;
      const netWatts = generationRateWatts - consumptionRateWatts;

      // 4. Update Battery storage (Wh)
      // Delta energy in Wh = netWatts * (1 / 3600) * deltaSeconds
      const deltaHours = (1 / 3600) * simSpeed;
      const deltaStoredWh = netWatts * deltaHours;

      setBattery((prevBat) => {
        const newStored = Math.max(0, Math.min(prevBat.capacityWh, prevBat.storedWh + deltaStoredWh));
        const newPct = (newStored / prevBat.capacityWh) * 100;
        return {
          ...prevBat,
          storedWh: Number(newStored.toFixed(2)),
          percentage: Number(newPct.toFixed(1)),
          chargingRateWatts: Number(generationRateWatts.toFixed(1)),
          consumptionRateWatts: Number(consumptionRateWatts.toFixed(1)),
          netWatts: Number(netWatts.toFixed(1)),
        };
      });

      // 5. Update Telemetry
      setTelemetry((prev) => ({
        ...prev,
        pedestrianCount,
        generationRateWatts: Number(generationRateWatts.toFixed(1)),
        consumptionRateWatts: Number(consumptionRateWatts.toFixed(1)),
        netWatts: Number(netWatts.toFixed(1)),
        energyConsumedWh: Number(
          (prev.energyConsumedWh + consumptionRateWatts * deltaHours).toFixed(2)
        ),
        batteryPercentage: Number(((battery.storedWh + deltaStoredWh) / battery.capacityWh * 100).toFixed(1)),
        infrastructurePoweredCount: loads.filter((l) => l.isEnabled).reduce((sum, l) => sum + l.unitCount, 0),
        timeOfDayHours: timeOfDay,
      }));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    simSpeed,
    dayNightMode,
    timeOfDay,
    pedestrianCount,
    joulesPerStep,
    battery.capacityWh,
    battery.storedWh,
    battery.percentage,
    loads,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 1. Header Navigation Bar */}
      <Header
        dayNightMode={dayNightMode}
        timeOfDay={timeOfDay}
        energyFlowMode={energyFlowMode}
        onToggleEnergyFlow={() => setEnergyFlowMode((prev) => !prev)}
        onChangeDayNightMode={(mode) => {
          setDayNightMode(mode);
          if (mode === 'day') setTimeOfDay(14.0);
          if (mode === 'night') setTimeOfDay(23.0);
        }}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={(preset) => setCameraPreset(preset)}
        activeScenarioName={SCENARIO_PRESETS[currentScenario]?.name || 'Normal Day'}
      />

      {/* 2. Main Central Viewport (3D WebGL Canvas) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <City3DCanvas
          tiles={tiles}
          pedestrianCount={pedestrianCount}
          timeOfDay={timeOfDay}
          energyFlowMode={energyFlowMode}
          selectedTileId={selectedTile?.id || null}
          onTileClick={(tile) => setSelectedTile(tile)}
          onTileStep={handleTileStep}
          activeScenarioName={SCENARIO_PRESETS[currentScenario]?.name || 'Normal Day'}
          cameraPreset={cameraPreset}
        />

        {/* 3. Left Controls Sidebar */}
        <CityControlsPanel
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenario}
          pedestrianCount={pedestrianCount}
          onChangePedestrianCount={setPedestrianCount}
          joulesPerStep={joulesPerStep}
          onChangeJoulesPerStep={setJoulesPerStep}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
          zones={zones}
          onTriggerEvent={handleTriggerEvent}
          isOpen={isControlsOpen}
          onToggle={() => setIsControlsOpen((prev) => !prev)}
        />

        {/* 4. Right Live Telemetry Dashboard */}
        <LiveDashboard
          telemetry={telemetry}
          battery={battery}
          loads={loads}
          onToggleLoad={handleToggleLoad}
          isOpen={isDashboardOpen}
          onToggle={() => setIsDashboardOpen((prev) => !prev)}
          degradedTilesCount={degradedTilesCount}
          onOpenTileInspectorWithDegraded={() => {
            const wornTile = tiles.find(
              (t) => t.condition === 'MAINTENANCE_REQUIRED' || t.efficiency < 80
            );
            if (wornTile) setSelectedTile(wornTile);
          }}
        />
      </main>

      {/* 5. Modals & Overlays */}
      <TileInspectorModal
        tile={selectedTile}
        onClose={() => setSelectedTile(null)}
        onMaintainTile={handleMaintainTile}
      />

      <WhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        onApplySettings={handleApplyWhatIfSettings}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        telemetry={telemetry}
        degradedTilesCount={degradedTilesCount}
      />

      <AnalyticsPanel
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
