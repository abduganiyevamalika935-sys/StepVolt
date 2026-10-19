import {
  EnergyZone,
  InfrastructureLoad,
  ScenarioId,
  SimulationSettings,
  HistoricalDataPoint,
} from '../types/simulation';

export const INITIAL_ZONES: EnergyZone[] = [
  {
    id: 'metro',
    name: 'Metro Transit Concourse',
    description: 'High-density commuter ingress/egress corridor with heavy continuous footfalls.',
    density: 'EXTREME',
    tileCount: 160,
    averageStepsPerHour: 12400,
    generationShare: 44,
    colorHex: '#06b6d4', // cyan
  },
  {
    id: 'plaza',
    name: 'Central Civic Plaza',
    description: 'Open public gathering square with multi-directional pedestrian movement.',
    density: 'HIGH',
    tileCount: 180,
    averageStepsPerHour: 7800,
    generationShare: 30,
    colorHex: '#3b82f6', // blue
  },
  {
    id: 'shopping',
    name: 'Commercial Arcade',
    description: 'Bustling retail boulevard with steady window shoppers and diners.',
    density: 'MEDIUM',
    tileCount: 100,
    averageStepsPerHour: 4500,
    generationShare: 18,
    colorHex: '#10b981', // emerald
  },
  {
    id: 'park',
    name: 'Eco-Corridor Promenade',
    description: 'Leisure green park walkway connecting civic center to transit.',
    density: 'LOW',
    tileCount: 46,
    averageStepsPerHour: 1800,
    generationShare: 8,
    colorHex: '#84cc16', // lime
  },
];

export const INITIAL_LOADS: InfrastructureLoad[] = [
  {
    id: 'street_lights',
    name: 'Smart LED Path Luminaires',
    category: 'lighting',
    icon: 'LampCeiling',
    nominalWatts: 95,
    currentWatts: 25, // low during day, high at night
    isEnabled: true,
    priority: 2,
    description: 'Adaptive 24V LED lighting along pedestrian pathways with ambient dimming.',
    poweredByPedestrian: true,
    unitCount: 14,
  },
  {
    id: 'smart_sensors',
    name: 'Environmental & Air-Quality Nodes',
    category: 'sensors',
    icon: 'Radio',
    nominalWatts: 22,
    currentWatts: 22,
    isEnabled: true,
    priority: 1,
    description: 'Micro-sensors monitoring PM2.5, NO2, ambient noise, and thermal index.',
    poweredByPedestrian: true,
    unitCount: 8,
  },
  {
    id: 'info_displays',
    name: 'Dynamic Transit Wayfinding Screens',
    category: 'display',
    icon: 'Monitor',
    nominalWatts: 55,
    currentWatts: 55,
    isEnabled: true,
    priority: 3,
    description: 'Ultra-low-power outdoor e-paper and high-contrast LED wayfinding kiosks.',
    poweredByPedestrian: true,
    unitCount: 4,
  },
  {
    id: 'traffic_signals',
    name: 'Smart Pedestrian Crosswalk Beacons',
    category: 'signal',
    icon: 'TrafficCone',
    nominalWatts: 28,
    currentWatts: 28,
    isEnabled: true,
    priority: 1,
    description: 'Pavement-level flashing LED safety warning markers for crossings.',
    poweredByPedestrian: true,
    unitCount: 6,
  },
  {
    id: 'iot_gateways',
    name: 'District IoT Mesh Gateways',
    category: 'iot',
    icon: 'Wifi',
    nominalWatts: 14,
    currentWatts: 14,
    isEnabled: true,
    priority: 1,
    description: 'LoRaWAN micro-concentrators transmitting municipal environmental telemetry.',
    poweredByPedestrian: true,
    unitCount: 3,
  },
  {
    id: 'charging_hub',
    name: 'Solar-Kinetic Public USB Bench Stations',
    category: 'charging',
    icon: 'BatteryCharging',
    nominalWatts: 40,
    currentWatts: 35,
    isEnabled: true,
    priority: 4,
    description: 'Public low-voltage rapid USB-C smart charging terminals on city benches.',
    poweredByPedestrian: true,
    unitCount: 4,
  },
];

export const SCENARIO_PRESETS: Record<
  ScenarioId,
  {
    name: string;
    description: string;
    pedestrianDensityMultiplier: number;
    timeOfDay: number;
    dayNightMode: 'day' | 'night' | 'auto';
    zoneDensities: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'>;
  }
> = {
  normal: {
    name: 'Normal Day',
    description: 'Standard midday business hours with balanced pedestrian movement across all zones.',
    pedestrianDensityMultiplier: 1.0,
    timeOfDay: 14, // 2:00 PM
    dayNightMode: 'day',
    zoneDensities: { metro: 'HIGH', plaza: 'MEDIUM', shopping: 'MEDIUM', park: 'LOW' },
  },
  rush_hour: {
    name: 'Morning Commuter Peak',
    description: 'Intense commuter rush from transit stations towards commercial offices.',
    pedestrianDensityMultiplier: 2.2,
    timeOfDay: 8.5, // 8:30 AM
    dayNightMode: 'day',
    zoneDensities: { metro: 'EXTREME', plaza: 'HIGH', shopping: 'MEDIUM', park: 'LOW' },
  },
  metro_exit: {
    name: 'Metro Surge Event',
    description: 'Multiple high-capacity transit trains arriving simultaneously, maximizing entrance yield.',
    pedestrianDensityMultiplier: 2.8,
    timeOfDay: 17.5, // 5:30 PM
    dayNightMode: 'day',
    zoneDensities: { metro: 'EXTREME', plaza: 'HIGH', shopping: 'HIGH', park: 'LOW' },
  },
  concert: {
    name: 'Stadium / Evening Concert',
    description: 'Massive civic crowd gathering across the Central Plaza and entertainment arcade.',
    pedestrianDensityMultiplier: 3.2,
    timeOfDay: 20.0, // 8:00 PM
    dayNightMode: 'night',
    zoneDensities: { metro: 'EXTREME', plaza: 'EXTREME', shopping: 'HIGH', park: 'MEDIUM' },
  },
  night: {
    name: 'Midnight Calm',
    description: 'Sparse pedestrian activity with maximum municipal street lighting load demand.',
    pedestrianDensityMultiplier: 0.35,
    timeOfDay: 23.5, // 11:30 PM
    dayNightMode: 'night',
    zoneDensities: { metro: 'LOW', plaza: 'LOW', shopping: 'LOW', park: 'LOW' },
  },
  weekend: {
    name: 'Weekend Promenade',
    description: 'High recreational family foot traffic in the park and shopping district.',
    pedestrianDensityMultiplier: 1.6,
    timeOfDay: 15.0, // 3:00 PM
    dayNightMode: 'day',
    zoneDensities: { metro: 'MEDIUM', plaza: 'HIGH', shopping: 'EXTREME', park: 'HIGH' },
  },
};

/**
 * Calculates energy generated by a step based on physical parameters
 * @param joulesPerStep - Mechanical energy per step (J)
 * @param conversionEfficiency - Transducer conversion efficiency (0-1)
 * @param storageEfficiency - Conditioning & battery storage efficiency (0-1)
 * @returns Energy generated in Watt-hours (Wh)
 */
export function calculateStepEnergyWh(
  joulesPerStep: number = 3.5,
  conversionEfficiency: number = 0.85,
  storageEfficiency: number = 0.88
): number {
  const electricalJoules = joulesPerStep * conversionEfficiency * storageEfficiency;
  return electricalJoules / 3600; // 3600 Joules = 1 Watt-hour
}

/**
 * Calculates the current lighting power based on time of day and battery condition
 */
export function calculateLightingPower(
  nominalWatts: number,
  timeOfDayHours: number,
  batteryPercentage: number
): number {
  // Daylight: 6:00 to 18:30
  const isNight = timeOfDayHours < 6.5 || timeOfDayHours > 18.5;
  if (!isNight) {
    return nominalWatts * 0.15; // Ambient daytime accent only
  }

  // Eco-dimming when battery is low
  if (batteryPercentage < 20) {
    return nominalWatts * 0.45; // 45% eco mode
  } else if (batteryPercentage < 40) {
    return nominalWatts * 0.70; // 70% balanced mode
  }
  return nominalWatts; // Full 100% brightness
}

/**
 * Generate realistic historical analytics
 */
export function generateHistoricalData(period: '1h' | '24h' | '7d' | '30d'): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];

  if (period === '1h') {
    for (let i = 60; i >= 0; i -= 5) {
      const minAgo = i;
      const gen = 22 + Math.sin(i / 10) * 8 + Math.random() * 4;
      const con = 18 + Math.cos(i / 15) * 5 + Math.random() * 3;
      points.push({
        timeLabel: `${minAgo}m ago`,
        energyGeneratedWh: Number(gen.toFixed(1)),
        energyConsumedWh: Number(con.toFixed(1)),
        batteryPercentage: Math.min(100, Math.max(20, Math.round(72 + (60 - i) * 0.15))),
        pedestrianCount: Math.round(180 + Math.sin(i / 8) * 60),
      });
    }
  } else if (period === '24h') {
    for (let h = 24; h >= 0; h -= 2) {
      const hour = (24 - h + 14) % 24;
      const isNight = hour < 6 || hour > 19;
      const gen = isNight ? 8 + Math.random() * 5 : 45 + Math.sin(hour / 3) * 18 + Math.random() * 8;
      const con = isNight ? 65 + Math.random() * 10 : 32 + Math.random() * 6;
      points.push({
        timeLabel: `${hour.toString().padStart(2, '0')}:00`,
        energyGeneratedWh: Number(gen.toFixed(1)),
        energyConsumedWh: Number(con.toFixed(1)),
        batteryPercentage: Math.min(100, Math.max(30, Math.round(55 + Math.sin(h / 3) * 25))),
        pedestrianCount: isNight ? Math.round(40 + Math.random() * 20) : Math.round(280 + Math.random() * 140),
      });
    }
  } else if (period === '7d') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let d = 6; d >= 0; d--) {
      const dayName = days[(7 - d + 3) % 7];
      const gen = 520 + Math.random() * 140;
      const con = 460 + Math.random() * 90;
      points.push({
        timeLabel: dayName,
        energyGeneratedWh: Number(gen.toFixed(1)),
        energyConsumedWh: Number(con.toFixed(1)),
        batteryPercentage: Math.round(70 + Math.random() * 18),
        pedestrianCount: Math.round(3200 + Math.random() * 1200),
      });
    }
  } else {
    // 30 days
    for (let w = 4; w >= 0; w--) {
      const gen = 3400 + Math.random() * 800;
      const con = 3100 + Math.random() * 500;
      points.push({
        timeLabel: `Week ${5 - w}`,
        energyGeneratedWh: Number(gen.toFixed(1)),
        energyConsumedWh: Number(con.toFixed(1)),
        batteryPercentage: Math.round(74 + Math.random() * 12),
        pedestrianCount: Math.round(22000 + Math.random() * 6000),
      });
    }
  }

  return points;
}
