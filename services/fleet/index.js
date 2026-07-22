/**
 * YantraMitra Platform — Enterprise Fleet Intelligence System Facade
 */

const { FleetManager, FLEET_REGISTRY, MACHINE_TELEMETRY } = require('./fleetManager');
const crossPlantAnalytics   = require('./crossPlantAnalytics');
const benchmarkEngine       = require('./benchmarkEngine');
const fleetAnomalyDetector  = require('./fleetAnomalyDetector');
const globalRecommendations = require('./globalRecommendations');

function getFleetSystemStatus() {
  const overview = FleetManager.getFleetOverview();
  return {
    systemStatus: 'ACTIVE_READY',
    totalPlants:   overview.fleetKPIs.totalPlants,
    totalMachines: overview.fleetKPIs.totalMachines,
    fleetHealthScore: overview.fleetKPIs.fleetHealthScore,
    criticalMachines: overview.fleetKPIs.criticalMachines,
    capabilities: [
      'Fleet KPI Aggregation',
      'Cross-Plant Analytics',
      'Benchmark Engine',
      'Fleet Anomaly Detection',
      'Global Recommendations'
    ]
  };
}

module.exports = {
  FleetManager,
  crossPlantAnalytics,
  benchmarkEngine,
  fleetAnomalyDetector,
  globalRecommendations,
  FLEET_REGISTRY,
  MACHINE_TELEMETRY,
  getFleetSystemStatus
};
