/**
 * YantraMitra Platform — RAG Hybrid Retriever Service
 * Combines 5 retrieval streams: Semantic Vector Search + BM25 Keyword Search +
 * PostgreSQL Telemetry + Active Alarms & Work Orders + Historical Similar Incidents
 * Optimized with in-memory caching for sub-millisecond RAG throughput.
 */

const vectorStore = require('./vectorStore');
const { detectQueryIntent } = require('./intentDetector');
const { retrieveSimilarIncidents } = require('./similarIncidentRetriever');
const prisma = require('../prisma');

let cachedDbContext = null;
let lastDbFetchTime = 0;
const DB_CACHE_TTL_MS = 30000;

/**
 * Executes multi-stream Hybrid Retrieval across vector database, live telemetry, and relational database
 */
async function retrieveHybridContext(queryText, options = {}) {
  const intentInfo = detectQueryIntent(queryText);
  const topK = options.topK || 5;

  // Stream 1: Semantic Vector Search
  const vectorResults = vectorStore.similaritySearch(queryText, topK, options.filterOptions || {});

  // Stream 2: Keyword / BM25 Search
  const keywordResults = vectorStore.keywordSearch(queryText, topK);

  // Stream 3: Live PostgreSQL Telemetry & Database State
  const now = Date.now();
  if (!cachedDbContext || (now - lastDbFetchTime > DB_CACHE_TTL_MS)) {
    try {
      const [plants, machines, alarms, workOrders] = await Promise.all([
        prisma.plant.findMany({ select: { id: true, name: true, location: true, oee: true, energyUsage: true } }),
        prisma.machine.findMany({
          take: 20,
          select: {
            id: true, name: true, type: true, status: true, health: true,
            failureProbability: true, remainingUsefulLife: true,
            plant: { select: { name: true } }
          }
        }),
        prisma.alarm.findMany({ where: { status: 'active' }, take: 10, include: { machine: { select: { name: true } } } }),
        prisma.workOrder.findMany({ where: { status: 'in_progress' }, take: 10, include: { machine: { select: { name: true } } } })
      ]);

      cachedDbContext = { plants, machines, alarms, workOrders };
      lastDbFetchTime = now;
    } catch (err) {
      console.error('Error fetching live DB context for Hybrid RAG:', err.message);
    }
  }

  // Stream 4: Similar Incident Retrieval (for diagnostics / maintenance intents)
  let similarIncidents = { incidents: [], maintenanceEvents: [], completedWorkOrders: [] };
  if (['diagnostics', 'maintenance', 'machine_health', 'sop'].includes(intentInfo.primaryIntent)) {
    similarIncidents = await retrieveSimilarIncidents(queryText, options.machineId, 3);
  }

  // Fusion & Reciprocal Rank Fusion (RRF) of Vector + BM25 Chunks
  const fusedChunkMap = new Map();

  vectorResults.forEach((res, rank) => {
    const id = res.chunk.id;
    const rrfScore = 1.0 / (60 + rank + 1);
    fusedChunkMap.set(id, {
      chunk: res.chunk,
      vectorScore: res.score,
      rrfScore: rrfScore + (res.score * 0.5)
    });
  });

  keywordResults.forEach((res, rank) => {
    const id = res.chunk.id;
    const rrfScore = 1.0 / (60 + rank + 1);
    if (fusedChunkMap.has(id)) {
      const existing = fusedChunkMap.get(id);
      existing.rrfScore += rrfScore;
    } else {
      fusedChunkMap.set(id, {
        chunk: res.chunk,
        vectorScore: 0.1,
        rrfScore: rrfScore
      });
    }
  });

  const rankedChunks = Array.from(fusedChunkMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);

  return {
    queryText,
    intent: intentInfo,
    vectorChunks: rankedChunks.map(item => ({
      ...item.chunk,
      relevanceScore: Math.round(item.rrfScore * 100) / 100
    })),
    dbContext: cachedDbContext,
    similarIncidents
  };
}

module.exports = {
  retrieveHybridContext
};
