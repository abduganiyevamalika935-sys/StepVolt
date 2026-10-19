export type DayNightMode = 'day' | 'night' | 'auto';

export type ScenarioId =
  | 'normal'
  | 'rush_hour'
  | 'metro_exit'
  | 'concert'
  | 'night'
  | 'weekend';

export type ZoneId = 'metro' | 'plaza' | 'shopping' | 'park';

export interface EnergyZone {
  id: ZoneId;
  name: string;
  description: string;
  density: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  tileCount: number;
  averageStepsPerHour: number;
  generationShare: number; // percentage
  colorHex: string;
}

export interface EnergyTile {
  id: string; // e.g. "SG-2048"
  zone: ZoneId;
  x: number;
  z: number;
  width: number;
  depth: number;
  pressureEvents: number;
  energyGeneratedWh: number;
  efficiency: number; // e.g. 86.4 (%)
  temperature: number; // e.g. 24.2 (°C)
  condition: 'GOOD' | 'FAIR' | 'MAINTENANCE_REQUIRED';
  lastSteppedAt: number;
  compression: number; // 0 to 1 for visual deflection
}

export interface Pedestrian {
  id: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  stepPhase: number;
  color: string;
  stepsCount: number;
  currentZone?: ZoneId;
}

export interface InfrastructureLoad {
  id: string;
  name: string;
  category: 'lighting' | 'sensors' | 'display' | 'signal' | 'iot' | 'charging';
  icon: string;
  nominalWatts: number;
  currentWatts: number;
  isEnabled: boolean;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  description: string;
  poweredByPedestrian: boolean;
  unitCount: number;
}

export interface BatteryState {
  percentage: number;
  capacityWh: number;
  storedWh: number;
  chargingRateWatts: number;
  consumptionRateWatts: number;
  netWatts: number;
  temperatureC: number;
  health: number;
}

export interface SimulationTelemetry {
  pedestrianCount: number;
  activeTilesCount: number;
  totalSteps: number;
  energyGeneratedWh: number;
  energyStoredWh: number;
  energyConsumedWh: number;
  batteryPercentage: number;
  infrastructurePoweredCount: number;
  co2AvoidedKg: number;
  systemEfficiency: number;
  generationRateWatts: number;
  consumptionRateWatts: number;
  netWatts: number;
  scenario: ScenarioId;
  dayNightMode: DayNightMode;
  timeOfDayHours: number; // 0 to 24
}

export interface SimulationSettings {
  energyPerStepJoules: number; // typically 2.5 - 5.0 J
  conversionEfficiency: number; // 0.70 - 0.95
  storageEfficiency: number; // 0.80 - 0.95
  pedestrianDensityMultiplier: number;
  timeOfDay: number; // 0 - 24
  dayNightMode: DayNightMode;
  simulationSpeed: number; // 1x, 2x, 5x
  energyFlowMode: boolean;
  showTileLabels: boolean;
  showDensityHeatmap: boolean;
}

export interface MaintenanceAlert {
  id: string;
  tileId: string;
  severity: 'info' | 'warning' | 'urgent';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface HistoricalDataPoint {
  timeLabel: string;
  energyGeneratedWh: number;
  energyConsumedWh: number;
  batteryPercentage: number;
  pedestrianCount: number;
}
