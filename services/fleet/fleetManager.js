/**
 * YantraMitra Platform — Fleet Manager
 * Aggregates health and KPIs across the entire enterprise machine fleet.
 * Produces: Availability, OEE, MTBF, MTTR, and fleet-level risk summary.
 */

const FLEET_REGISTRY = {
  plants: [
    {
      plantId: 'plant-pune-01',
      name: 'Pune Manufacturing Plant',
      location: 'Pune, Maharashtra',
      lines: ['line-pune-A', 'line-pune-B'],
      machines: [
        { machineId: 'mach-vmc-01', name: 'Jyoti VMC 850 CNC', class: 'CNC_MILLING', ratedCapacity: 40, age: 4, line: 'line-pune-A' },
        { machineId: 'mach-vmc-02', name: 'BFW VMC 1050 CNC',  class: 'CNC_MILLING', ratedCapacity: 40, age: 2, line: 'line-pune-A' },
        { machineId: 'mach-hyd-01', name: 'Parker Hydraulic Press 200T', class: 'HYDRAULIC_PRESS', ratedCapacity: 20, age: 6, line: 'line-pune-B' },
        { machineId: 'mach-pump-01', name: 'Bosch Rexroth Pump Station P-1', class: 'PUMP', ratedCapacity: 20, age: 5, line: 'line-pune-B' }
      ]
    },
    {
      plantId: 'plant-ahm-01',
      name: 'Ahmedabad Fabrication Facility',
      location: 'Ahmedabad, Gujarat',
      lines: ['line-ahm-A'],
      machines: [
        { machineId: 'mach-mot-01',  name: 'Siemens IE4 Motor M-101', class: 'INDUCTION_MOTOR', ratedCapacity: 30, age: 3, line: 'line-ahm-A' },
        { machineId: 'mach-laser-01', name: 'Trumpf TruLaser 3030', class: 'LASER_CUTTER', ratedCapacity: 30, age: 1, line: 'line-ahm-A' },
        { machineId: 'mach-weld-01',  name: 'Fronius TPS 400i Welder', class: 'WELDING',      ratedCapacity: 25, age: 2, line: 'line-ahm-A' }
      ]
    },
    {
      plantId: 'plant-mum-01',
      name: 'Mumbai Assembly Hub',
      location: 'Mumbai, Maharashtra',
      lines: ['line-mum-A', 'line-mum-B'],
      machines: [
        { machineId: 'mach-rob-01', name: 'Fanuc M-710iC Robot Arm', class: 'ROBOT_ARM', ratedCapacity: 50, age: 3, line: 'line-mum-A' },
        { machineId: 'mach-conv-01', name: 'Dorner 2200 Conveyor System', class: 'CONVEYOR', ratedCapacity: 50, age: 4, line: 'line-mum-A' },
        { machineId: 'mach-cnc-03', name: 'Haas VF-4 CNC Machining Center', class: 'CNC_MILLING', ratedCapacity: 35, age: 5, line: 'line-mum-B' },
        { machineId: 'mach-insp-01', name: 'Zeiss Contura CMM Inspection', class: 'CMM', ratedCapacity: 20, age: 2, line: 'line-mum-B' }
      ]
    }
  ]
};

// Synthetic but deterministic telemetry snapshot per machine (models real sensor state)
const MACHINE_TELEMETRY = {
  'mach-vmc-01':  { availability: 0.872, oee: 0.741, mtbf: 312, mttr: 4.8, failureProbability: 68, riskLevel: 'HIGH',      maintenanceCostINR: 42000, downtimeHours: 18.4 },
  'mach-vmc-02':  { availability: 0.951, oee: 0.884, mtbf: 520, mttr: 2.1, failureProbability: 22, riskLevel: 'LOW',       maintenanceCostINR: 18500, downtimeHours: 5.2 },
  'mach-hyd-01':  { availability: 0.813, oee: 0.692, mtbf: 280, mttr: 6.2, failureProbability: 74, riskLevel: 'CRITICAL',  maintenanceCostINR: 58000, downtimeHours: 24.6 },
  'mach-pump-01': { availability: 0.921, oee: 0.803, mtbf: 410, mttr: 3.0, failureProbability: 35, riskLevel: 'MEDIUM',    maintenanceCostINR: 21000, downtimeHours: 8.7 },
  'mach-mot-01':  { availability: 0.963, oee: 0.902, mtbf: 580, mttr: 1.8, failureProbability: 18, riskLevel: 'LOW',       maintenanceCostINR: 14200, downtimeHours: 3.9 },
  'mach-laser-01':{ availability: 0.988, oee: 0.961, mtbf: 720, mttr: 1.2, failureProbability: 8,  riskLevel: 'LOW',       maintenanceCostINR: 9800,  downtimeHours: 1.6 },
  'mach-weld-01': { availability: 0.944, oee: 0.876, mtbf: 490, mttr: 2.5, failureProbability: 28, riskLevel: 'MEDIUM',    maintenanceCostINR: 16800, downtimeHours: 6.1 },
  'mach-rob-01':  { availability: 0.976, oee: 0.921, mtbf: 640, mttr: 1.6, failureProbability: 14, riskLevel: 'LOW',       maintenanceCostINR: 12400, downtimeHours: 2.7 },
  'mach-conv-01': { availability: 0.902, oee: 0.834, mtbf: 380, mttr: 3.8, failureProbability: 41, riskLevel: 'MEDIUM',    maintenanceCostINR: 24600, downtimeHours: 10.8 },
  'mach-cnc-03':  { availability: 0.841, oee: 0.711, mtbf: 295, mttr: 5.4, failureProbability: 62, riskLevel: 'HIGH',      maintenanceCostINR: 39200, downtimeHours: 20.3 },
  'mach-insp-01': { availability: 0.993, oee: 0.972, mtbf: 800, mttr: 0.9, failureProbability: 4,  riskLevel: 'LOW',       maintenanceCostINR: 7200,  downtimeHours: 0.8 }
};

class FleetManager {
  getRegistry() { return FLEET_REGISTRY; }
  getTelemetry() { return MACHINE_TELEMETRY; }

  /**
   * Compute plant-level aggregated KPIs from machine telemetry.
   */
  aggregatePlantKPIs(plant) {
    const machineIds = plant.machines.map(m => m.machineId);
    const telemetries = machineIds.map(id => MACHINE_TELEMETRY[id]).filter(Boolean);
    if (!telemetries.length) return null;

    const avg = key => telemetries.reduce((s, t) => s + t[key], 0) / telemetries.length;
    const sum = key => telemetries.reduce((s, t) => s + t[key], 0);

    const criticalCount = telemetries.filter(t => t.riskLevel === 'CRITICAL').length;
    const highCount     = telemetries.filter(t => t.riskLevel === 'HIGH').length;

    return {
      plantId: plant.plantId,
      plantName: plant.name,
      location: plant.location,
      totalMachines: plant.machines.length,
      availability:        Math.round(avg('availability') * 1000) / 1000,
      oee:                 Math.round(avg('oee') * 1000) / 1000,
      mtbf:                Math.round(avg('mtbf')),
      mttr:                Math.round(avg('mttr') * 10) / 10,
      avgFailureProbability: Math.round(avg('failureProbability')),
      totalMaintenanceCostINR: sum('maintenanceCostINR'),
      totalDowntimeHours:     Math.round(sum('downtimeHours') * 10) / 10,
      criticalMachines: criticalCount,
      highRiskMachines: highCount,
      plantRiskLevel: criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : 'NOMINAL'
    };
  }

  /**
   * Full fleet overview: all plants + fleet-wide KPIs.
   */
  getFleetOverview() {
    const plantKPIs = FLEET_REGISTRY.plants.map(p => this.aggregatePlantKPIs(p)).filter(Boolean);

    const fleetAvg = key => plantKPIs.reduce((s, p) => s + p[key], 0) / plantKPIs.length;
    const fleetSum = key => plantKPIs.reduce((s, p) => s + p[key], 0);

    const allTelemetries = Object.values(MACHINE_TELEMETRY);
    const totalMachines  = allTelemetries.length;
    const criticalFleet  = allTelemetries.filter(t => t.riskLevel === 'CRITICAL').length;
    const highFleet      = allTelemetries.filter(t => t.riskLevel === 'HIGH').length;

    return {
      generatedAt: new Date().toISOString(),
      fleetKPIs: {
        totalPlants: FLEET_REGISTRY.plants.length,
        totalMachines,
        fleetAvailability:  Math.round(fleetAvg('availability') * 1000) / 1000,
        fleetOEE:           Math.round(fleetAvg('oee') * 1000) / 1000,
        fleetMTBF:          Math.round(fleetAvg('mtbf')),
        fleetMTTR:          Math.round(fleetAvg('mttr') * 10) / 10,
        fleetAvgFailureProbability: Math.round(allTelemetries.reduce((s, t) => s + t.failureProbability, 0) / totalMachines),
        totalMaintenanceCostINR: fleetSum('totalMaintenanceCostINR'),
        totalDowntimeHours: Math.round(fleetSum('totalDowntimeHours') * 10) / 10,
        criticalMachines: criticalFleet,
        highRiskMachines: highFleet,
        fleetHealthScore: Math.round(fleetAvg('oee') * 100)
      },
      plants: plantKPIs
    };
  }
}

module.exports = { FleetManager: new FleetManager(), FLEET_REGISTRY, MACHINE_TELEMETRY };
