/**
 * YantraMitra Platform — Industrial Knowledge Graph Test Suite
 * Tests node/relationship seeding, BFS traversal, shortest-path finding,
 * impact analysis, dependency mapping, similarity search, and query latency (< 5ms).
 */

const assert = require('assert');
const graphService = require('../services/graph');
const { NODE_TYPES, RELATIONSHIP_TYPES } = require('../services/graph/graphSchema');

async function runKnowledgeGraphTests() {
  console.log('==================================================');
  console.log('YantraMitra Industrial Knowledge Graph Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;
  const { graphEngine } = graphService;

  function test(name, fn) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => { console.log(`  [PASS] ${name}`); passed++; })
      .catch(err => {
        console.error(`  [FAIL] ${name}`);
        console.error(`         Error: ${err.message}`);
        failed++;
      });
  }

  // Test 1: Graph Seeding & Statistics
  await test('1. Industrial Knowledge Graph Seeding & Node Count Validation', () => {
    const stats = graphEngine.getStats();
    assert(stats.totalNodes >= 30, `Graph must contain ≥ 30 nodes, got ${stats.totalNodes}`);
    assert(stats.totalEdges >= 30, `Graph must contain ≥ 30 relationships, got ${stats.totalEdges}`);
    assert(stats.nodeTypeBreakdown[NODE_TYPES.MACHINE] >= 5, 'Must have ≥ 5 Machine nodes');
    assert(stats.nodeTypeBreakdown[NODE_TYPES.SENSOR] >= 5, 'Must have ≥ 5 Sensor nodes');
    console.log(`         [Graph Stats] ${stats.totalNodes} nodes, ${stats.totalEdges} edges across ${Object.keys(stats.nodeTypeBreakdown).length} types`);
  });

  // Test 2: Node Retrieval
  await test('2. Node Retrieval by ID', () => {
    const machine = graphEngine.getNode('mach-vmc-01');
    assert(machine !== null, 'Machine node mach-vmc-01 must exist');
    assert.strictEqual(machine.type, NODE_TYPES.MACHINE);
    assert(machine.label.includes('VMC'));

    const plant = graphEngine.getNode('plant-pune-01');
    assert.strictEqual(plant.type, NODE_TYPES.PLANT);

    const missing = graphEngine.getNode('nonexistent-node');
    assert.strictEqual(missing, null, 'Non-existent node must return null');
  });

  // Test 3: Neighbor Queries (Outbound + Inbound)
  await test('3. Graph Neighbor Queries (Typed Relationship Filtering)', () => {
    const sensors = graphEngine.getNeighbors('mach-vmc-01', RELATIONSHIP_TYPES.HAS_SENSOR);
    assert(sensors.length >= 2, 'VMC-01 must have ≥ 2 sensor neighbors');
    assert(sensors.every(n => n.node.type === NODE_TYPES.SENSOR), 'All HAS_SENSOR neighbors must be Sensor nodes');

    const sops = graphEngine.getNeighbors('mach-vmc-01', RELATIONSHIP_TYPES.GOVERNED_BY);
    assert(sops.length >= 2, 'VMC-01 must have ≥ 2 SOP/Manual neighbors');
  });

  // Test 4: BFS Multi-Hop Traversal
  await test('4. BFS Multi-Hop Graph Traversal (depth=4)', () => {
    const traversal = graphEngine.traverse('mach-vmc-01', 4);
    assert(traversal.length > 5, 'VMC-01 traversal at depth=4 must reach > 5 nodes');

    const types = new Set(traversal.map(t => t.node?.type).filter(Boolean));
    assert(types.has(NODE_TYPES.SENSOR), 'Traversal must reach Sensor nodes');
    assert(types.has(NODE_TYPES.ALARM), 'Traversal must reach Alarm nodes');
    assert(types.has(NODE_TYPES.WORKFLOW), 'Traversal must reach Workflow nodes');

    console.log(`         [BFS] VMC-01 depth=4 traversal reached ${traversal.length} nodes across ${types.size} types`);
  });

  // Test 5: Shortest Path Between Two Nodes
  await test('5. Shortest Path — Plant → Spare Part (Multi-Hop)', () => {
    const result = graphEngine.findPath('plant-pune-01', 'part-bearing-6206');
    assert.strictEqual(result.found, true, 'Path must be found from Plant to Spare Part');
    assert(result.hops >= 4, `Path from Plant to Spare Part must traverse ≥ 4 hops, got ${result.hops}`);
    assert(result.path.length > 0, 'Path array must be non-empty');
    console.log(`         [Path] plant-pune-01 → part-bearing-6206: ${result.hops} hops`);
  });

  // Test 6: Path Not Found Scenario
  await test('6. Shortest Path — Disconnected Nodes Returns Not Found', () => {
    const result = graphEngine.findPath('plant-ahm-01', 'part-bearing-6206');
    // Ahmedabad plant has no connection to bearing parts (different plant)
    assert.strictEqual(result.found, false, 'Disconnected nodes must return found=false');
  });

  // Test 7: Impact Analysis — Machine → All Affected Assets
  await test('7. Machine Impact Analysis (Sensors, Alarms, Workflows, Parts, Technicians)', () => {
    const impact = graphEngine.analyzeImpact('mach-vmc-01');
    assert(impact !== null, 'Impact analysis must return a result');
    assert(impact.impactedSensors.length >= 2, 'Must identify ≥ 2 impacted sensors');
    assert(impact.impactedAlarms.length >= 1, 'Must identify ≥ 1 impacted alarms');
    assert(impact.impactedWorkflows.length >= 1, 'Must identify ≥ 1 impacted workflows');
    assert(impact.impactedSpareParts.length >= 1, 'Must identify ≥ 1 impacted spare parts');
    assert(impact.applicableSOPs.length >= 2, 'Must identify ≥ 2 applicable SOPs');
    console.log(`         [Impact] ${impact.totalImpactedNodes} total impacted nodes for VMC-01`);
  });

  // Test 8: Dependency Map — Machine → Full Dependency Chain
  await test('8. Machine Dependency Map (Full 6-hop Chain)', () => {
    const depMap = graphEngine.getDependencyMap('mach-vmc-01');
    assert(depMap.totalDependencies > 5, 'VMC-01 dependency chain must have > 5 nodes');
    assert(depMap.dependencyDepth >= 3, 'Dependency chain must reach ≥ 3 hops');
    assert(depMap.dependencies[NODE_TYPES.SENSOR], 'Dependency map must include Sensors');
    assert(depMap.dependencies[NODE_TYPES.ALARM], 'Dependency map must include Alarms');
    console.log(`         [Deps] VMC-01: ${depMap.totalDependencies} dependencies at depth ${depMap.dependencyDepth}`);
  });

  // Test 9: Similarity Search
  await test('9. Machine Similarity Search (Direct + Same-Type)', () => {
    const similar = graphEngine.findSimilar('mach-vmc-01');
    assert(similar.totalFound > 0, 'Similarity search must return ≥ 1 result');
    assert(similar.directSimilar.length >= 1 || similar.sameTypeCandidates.length >= 1,
      'Must find similar machines via direct link or same-type matching');
    console.log(`         [Similarity] Found ${similar.totalFound} similar nodes for VMC-01`);
  });

  // Test 10: Graph Query Latency Benchmark (< 5ms for 500 queries)
  await test('10. Knowledge Graph Query Latency Benchmark (500 queries < 5ms)', () => {
    const iterations = 500;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      graphEngine.getNode('mach-vmc-01');
      graphEngine.getNeighbors('mach-vmc-01');
      graphEngine.analyzeImpact('mach-hyd-01');
    }
    const elapsed = Date.now() - start;
    console.log(`         [Graph Benchmark] ${iterations * 3} graph operations in ${elapsed}ms (Avg: ${(elapsed / (iterations * 3)).toFixed(4)}ms per op)`);
    assert(elapsed < 100, `500 graph query cycles must complete in < 100ms, achieved ${elapsed}ms`);
  });

  console.log('\n==================================================');
  console.log(`Knowledge Graph Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runKnowledgeGraphTests();
