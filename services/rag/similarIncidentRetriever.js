/**
 * YantraMitra Platform — Similar Incident & Maintenance History Retriever Service
 * Searches past operational incidents, maintenance events, and work orders to find
 * similar root causes and proven resolution actions.
 * Optimized with in-memory caching for sub-millisecond RAG performance.
 */

const prisma = require('../prisma');

let cachedIncidentData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 60-second cache

/**
 * Retrieves similar past incidents and maintenance records for a target query or machine
 */
async function retrieveSimilarIncidents(queryText, machineId = null, limit = 4) {
  const now = Date.now();

  try {
    if (!cachedIncidentData || (now - lastFetchTime > CACHE_TTL_MS)) {
      const [incidents, maintenanceEvents, workOrders] = await Promise.all([
        prisma.operationalIncident.findMany({
          include: {
            machine: { select: { id: true, name: true, type: true, plant: { select: { name: true } } } }
          },
          orderBy: { updatedAt: 'desc' },
          take: 20
        }),
        prisma.maintenanceEvent.findMany({
          include: { machine: { select: { id: true, name: true } } },
          orderBy: { performedAt: 'desc' },
          take: 10
        }),
        prisma.workOrder.findMany({
          where: { status: 'completed' },
          include: { machine: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      cachedIncidentData = { incidents, maintenanceEvents, workOrders };
      lastFetchTime = now;
    }

    const { incidents, maintenanceEvents, workOrders } = cachedIncidentData;
    const queryLower = (queryText || '').toLowerCase();

    let filteredIncidents = incidents;
    if (machineId) {
      filteredIncidents = incidents.filter(inc => inc.machineId === machineId);
      if (filteredIncidents.length === 0) filteredIncidents = incidents;
    }

    const scoredIncidents = filteredIncidents.map(inc => {
      let score = 0.5;
      if (machineId && inc.machineId === machineId) score += 0.4;
      if (queryLower.includes((inc.title || '').toLowerCase())) score += 0.3;
      if (queryLower.includes((inc.rootCause || '').toLowerCase())) score += 0.3;

      return {
        score,
        type: 'Historical Incident',
        id: inc.id,
        title: inc.title,
        severity: inc.severity,
        stage: inc.stage,
        rootCause: inc.rootCause || 'Vibration / Thermal fatigue',
        machineName: inc.machine?.name || 'Machine',
        plantName: inc.machine?.plant?.name || 'Plant',
        impactCost: inc.impactCost,
        downtimeMinutes: inc.downtimeMinutes,
        updatedAt: inc.updatedAt
      };
    });

    scoredIncidents.sort((a, b) => b.score - a.score);
    const topIncidents = scoredIncidents.slice(0, limit);

    return {
      incidents: topIncidents,
      maintenanceEvents: maintenanceEvents.slice(0, limit).map(m => ({
        id: m.id,
        title: m.title,
        notes: m.notes,
        performedBy: m.performedBy,
        performedAt: m.performedAt,
        machineName: m.machine?.name
      })),
      completedWorkOrders: workOrders.slice(0, limit).map(w => ({
        id: w.id,
        title: w.title,
        description: w.description,
        assignedTo: w.assignedTo,
        completedAt: w.updatedAt,
        machineName: w.machine?.name
      }))
    };
  } catch (err) {
    console.error('Error retrieving similar incidents:', err.message);
    return { incidents: [], maintenanceEvents: [], completedWorkOrders: [] };
  }
}

module.exports = {
  retrieveSimilarIncidents
};
