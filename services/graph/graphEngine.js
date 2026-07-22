/**
 * YantraMitra Platform — Industrial Knowledge Graph Engine
 * In-memory adjacency-list graph with typed nodes, typed relationships,
 * BFS multi-hop traversal, and shortest-path finding.
 */

const { NODE_TYPES, RELATIONSHIP_TYPES } = require('./graphSchema');

class GraphEngine {
  constructor() {
    this.nodes = new Map();       // nodeId → { id, type, label, properties }
    this.edges = new Map();       // nodeId → [ { targetId, type, properties } ]
    this.reverseEdges = new Map(); // nodeId → [ { sourceId, type } ]  (for inbound queries)
    this._seed();
  }

  // ─────────────────────────────────────────────
  // Core CRUD
  // ─────────────────────────────────────────────

  addNode(id, type, label, properties = {}) {
    this.nodes.set(id, { id, type, label, properties, createdAt: new Date().toISOString() });
    if (!this.edges.has(id)) this.edges.set(id, []);
    if (!this.reverseEdges.has(id)) this.reverseEdges.set(id, []);
    return this.nodes.get(id);
  }

  addRelationship(sourceId, targetId, type, properties = {}) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return false;
    const edge = { targetId, type, properties, createdAt: new Date().toISOString() };
    this.edges.get(sourceId).push(edge);
    this.reverseEdges.get(targetId).push({ sourceId, type, properties });
    return edge;
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  // ─────────────────────────────────────────────
  // Neighbor Queries
  // ─────────────────────────────────────────────

  getNeighbors(id, relationshipFilter = null) {
    const outEdges = (this.edges.get(id) || []).filter(e =>
      !relationshipFilter || e.type === relationshipFilter
    ).map(e => ({ direction: 'OUT', relationship: e.type, node: this.nodes.get(e.targetId), properties: e.properties }));

    const inEdges = (this.reverseEdges.get(id) || []).filter(e =>
      !relationshipFilter || e.type === relationshipFilter
    ).map(e => ({ direction: 'IN', relationship: e.type, node: this.nodes.get(e.sourceId), properties: e.properties }));

    return [...outEdges, ...inEdges].filter(e => e.node);
  }

  // ─────────────────────────────────────────────
  // BFS Multi-Hop Traversal
  // ─────────────────────────────────────────────

  traverse(startId, maxDepth = 3, relationshipFilter = null) {
    const visited = new Set([startId]);
    const result = [];
    const queue = [{ id: startId, depth: 0, path: [startId] }];

    while (queue.length > 0) {
      const { id, depth, path } = queue.shift();
      if (depth >= maxDepth) continue;

      const edges = (this.edges.get(id) || []).filter(e =>
        !relationshipFilter || e.type === relationshipFilter
      );

      for (const edge of edges) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          const newPath = [...path, edge.targetId];
          result.push({
            node: this.nodes.get(edge.targetId),
            relationship: edge.type,
            depth: depth + 1,
            path: newPath
          });
          queue.push({ id: edge.targetId, depth: depth + 1, path: newPath });
        }
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────
  // Shortest Path (BFS)
  // ─────────────────────────────────────────────

  findPath(startId, endId) {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) return null;
    const visited = new Set([startId]);
    const queue = [{ id: startId, path: [startId], edges: [] }];

    while (queue.length > 0) {
      const { id, path, edges } = queue.shift();
      if (id === endId) {
        return {
          found: true,
          hops: path.length - 1,
          path: path.map(nid => this.nodes.get(nid)),
          relationships: edges
        };
      }

      for (const edge of (this.edges.get(id) || [])) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({
            id: edge.targetId,
            path: [...path, edge.targetId],
            edges: [...edges, { type: edge.type, from: id, to: edge.targetId }]
          });
        }
      }
    }
    return { found: false, hops: null, path: [], relationships: [] };
  }

  // ─────────────────────────────────────────────
  // Impact Analysis (given machine → all affected entities)
  // ─────────────────────────────────────────────

  analyzeImpact(machineId) {
    const machineNode = this.getNode(machineId);
    if (!machineNode) return null;

    const sensors = this.getNeighbors(machineId, RELATIONSHIP_TYPES.HAS_SENSOR).map(n => n.node).filter(Boolean);
    const alarms = sensors.flatMap(s => this.getNeighbors(s.id, RELATIONSHIP_TYPES.TRIGGERS).map(n => n.node)).filter(Boolean);
    const workflows = alarms.flatMap(a => this.getNeighbors(a.id, RELATIONSHIP_TYPES.INITIATES).map(n => n.node)).filter(Boolean);
    const workOrders = workflows.flatMap(w => this.getNeighbors(w.id, RELATIONSHIP_TYPES.GENERATES).map(n => n.node)).filter(Boolean);
    const spareParts = workOrders.flatMap(wo => this.getNeighbors(wo.id, RELATIONSHIP_TYPES.REQUIRES).map(n => n.node)).filter(Boolean);
    const technicians = workOrders.flatMap(wo => this.getNeighbors(wo.id, RELATIONSHIP_TYPES.ASSIGNED_TO).map(n => n.node)).filter(Boolean);
    const sops = this.getNeighbors(machineId, RELATIONSHIP_TYPES.GOVERNED_BY).map(n => n.node).filter(Boolean);

    return {
      machine: machineNode,
      impactedSensors: sensors,
      impactedAlarms: alarms,
      impactedWorkflows: workflows,
      impactedWorkOrders: workOrders,
      impactedSpareParts: spareParts,
      impactedTechnicians: technicians,
      applicableSOPs: sops,
      totalImpactedNodes: sensors.length + alarms.length + workflows.length + workOrders.length + spareParts.length
    };
  }

  // ─────────────────────────────────────────────
  // Dependency Map: Machine → Sensors → Alarms → Incidents → Work Orders → Parts → SOPs
  // ─────────────────────────────────────────────

  getDependencyMap(machineId) {
    const fullTraversal = this.traverse(machineId, 6);
    const grouped = {};
    for (const item of fullTraversal) {
      const t = item.node?.type || 'Unknown';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push({ node: item.node, relationship: item.relationship, depth: item.depth });
    }
    return {
      machineId,
      dependencyDepth: fullTraversal.length > 0 ? Math.max(...fullTraversal.map(i => i.depth)) : 0,
      totalDependencies: fullTraversal.length,
      dependencies: grouped
    };
  }

  // ─────────────────────────────────────────────
  // Similarity Search — find nodes connected via SIMILAR_TO
  // ─────────────────────────────────────────────

  findSimilar(nodeId, limit = 5) {
    const directSimilar = this.getNeighbors(nodeId, RELATIONSHIP_TYPES.SIMILAR_TO)
      .filter(n => n.node)
      .slice(0, limit);

    // Widen search: second-hop similarity via shared sensor/alarm types
    const node = this.getNode(nodeId);
    const sameTypeNodes = [];
    if (node) {
      for (const [id, n] of this.nodes.entries()) {
        if (n.type === node.type && id !== nodeId && sameTypeNodes.length < limit) {
          sameTypeNodes.push({ node: n, relationship: 'SAME_TYPE', depth: 1 });
        }
      }
    }

    return {
      nodeId,
      directSimilar: directSimilar.map(n => n.node),
      sameTypeCandidates: sameTypeNodes.map(n => n.node),
      totalFound: directSimilar.length + sameTypeNodes.length
    };
  }

  getStats() {
    return {
      totalNodes: this.nodes.size,
      totalEdges: Array.from(this.edges.values()).reduce((s, v) => s + v.length, 0),
      nodeTypeBreakdown: [...this.nodes.values()].reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1; return acc;
      }, {})
    };
  }

  // ─────────────────────────────────────────────
  // Seed: Production-realistic Industrial Graph
  // ─────────────────────────────────────────────

  _seed() {
    // Plants
    this.addNode('plant-pune-01', NODE_TYPES.PLANT, 'Pune Manufacturing Plant', { location: 'Pune, Maharashtra', capacity: '12,000 units/month' });
    this.addNode('plant-ahm-01', NODE_TYPES.PLANT, 'Ahmedabad Fabrication Facility', { location: 'Ahmedabad, Gujarat', capacity: '8,000 units/month' });

    // Production Lines
    this.addNode('line-pune-A', NODE_TYPES.LINE, 'CNC Machining Line A', { shift: '24x7', capacity: 40 });
    this.addNode('line-pune-B', NODE_TYPES.LINE, 'Hydraulic Press Line B', { shift: '2-shift', capacity: 20 });
    this.addNode('line-ahm-A', NODE_TYPES.LINE, 'Fabrication Line A', { shift: '3-shift', capacity: 30 });

    // Machines
    this.addNode('mach-vmc-01', NODE_TYPES.MACHINE, 'Jyoti VMC 850 CNC Milling', { model: 'VMC 850', age: 4, ratedRPM: 6000 });
    this.addNode('mach-vmc-02', NODE_TYPES.MACHINE, 'BFW VMC 1050 CNC Milling', { model: 'VMC 1050', age: 2, ratedRPM: 8000 });
    this.addNode('mach-hyd-01', NODE_TYPES.MACHINE, 'Parker Hannifin Hydraulic Press 200T', { model: 'HPP-200T', age: 6, ratedPressure: 200 });
    this.addNode('mach-mot-01', NODE_TYPES.MACHINE, 'Siemens IE4 Induction Motor M-101', { model: 'IE4-75kW', age: 3, ratedPower: 75 });
    this.addNode('mach-pump-01', NODE_TYPES.MACHINE, 'Bosch Rexroth Hydraulic Pump Station P-1', { model: 'A10VSO-71', age: 5, ratedPressure: 25 });

    // Sensors
    this.addNode('sensor-vib-01', NODE_TYPES.SENSOR, 'Vibration Sensor VS-101 (VMC-01)', { type: 'vibration', unit: 'mm/s', threshold: 4.5 });
    this.addNode('sensor-temp-01', NODE_TYPES.SENSOR, 'Thermal Sensor TS-101 (VMC-01)', { type: 'temperature', unit: '°C', threshold: 85 });
    this.addNode('sensor-vib-02', NODE_TYPES.SENSOR, 'Vibration Sensor VS-201 (VMC-02)', { type: 'vibration', unit: 'mm/s', threshold: 4.5 });
    this.addNode('sensor-press-01', NODE_TYPES.SENSOR, 'Pressure Sensor PS-101 (Hydraulic)', { type: 'pressure', unit: 'bar', threshold: 17.5 });
    this.addNode('sensor-curr-01', NODE_TYPES.SENSOR, 'Current Sensor CS-101 (Motor)', { type: 'current', unit: 'A', threshold: 145 });

    // Alarms
    this.addNode('alarm-vib-critical', NODE_TYPES.ALARM, 'Critical Vibration Alarm', { severity: 'CRITICAL', code: 'ALM-VIB-001' });
    this.addNode('alarm-temp-high', NODE_TYPES.ALARM, 'High Temperature Alarm', { severity: 'HIGH', code: 'ALM-TEMP-001' });
    this.addNode('alarm-press-low', NODE_TYPES.ALARM, 'Low Hydraulic Pressure Alarm', { severity: 'HIGH', code: 'ALM-HYD-001' });
    this.addNode('alarm-overload', NODE_TYPES.ALARM, 'Motor Overload Alarm', { severity: 'CRITICAL', code: 'ALM-MOT-001' });

    // SOPs
    this.addNode('sop-bearing-lubrication', NODE_TYPES.SOP, 'Bearing Lubrication SOP v2', { revision: 2, standard: 'ISO 281' });
    this.addNode('sop-loto', NODE_TYPES.SOP, 'LOTO Zero-Energy State SOP', { revision: 5, standard: 'OSHA 1910.147' });
    this.addNode('sop-hydraulic', NODE_TYPES.SOP, 'Hydraulic System Maintenance SOP', { revision: 3, standard: 'ISO 4406' });

    // Manuals
    this.addNode('manual-vmc-850', NODE_TYPES.MANUAL, 'Jyoti VMC 850 OEM Service Manual', { version: 'Rev 4', pages: 342 });
    this.addNode('manual-hydraulic', NODE_TYPES.MANUAL, 'Parker Hannifin Hydraulic Press Manual', { version: 'Rev 2', pages: 218 });

    // Workflows
    this.addNode('wf-bearing-replacement', NODE_TYPES.WORKFLOW, 'Spindle Bearing Replacement Workflow', { templateId: 'tpl_bearing_replacement', riskLevel: 'HIGH' });
    this.addNode('wf-motor-thermal', NODE_TYPES.WORKFLOW, 'Motor Thermal Flush Workflow', { templateId: 'tpl_motor_overheating', riskLevel: 'HIGH' });
    this.addNode('wf-hydraulic-pm', NODE_TYPES.WORKFLOW, 'Hydraulic PM Workflow', { templateId: 'tpl_pump_cavitation', riskLevel: 'MEDIUM' });

    // Work Orders
    this.addNode('wo-2026-1001', NODE_TYPES.WORK_ORDER, 'WO-2026-1001: VMC-01 Bearing Overhaul', { priority: 'CRITICAL', estimatedHours: 4 });
    this.addNode('wo-2026-1002', NODE_TYPES.WORK_ORDER, 'WO-2026-1002: Motor M-101 Thermal Flush', { priority: 'HIGH', estimatedHours: 3 });
    this.addNode('wo-2026-1003', NODE_TYPES.WORK_ORDER, 'WO-2026-1003: Hydraulic Pump PM', { priority: 'MEDIUM', estimatedHours: 2.5 });

    // Incidents
    this.addNode('inc-2026-001', NODE_TYPES.INCIDENT, 'INC-2026-001: VMC-01 Spindle Vibration Spike', { reportedAt: '2026-07-15', severity: 'CRITICAL', resolved: true });
    this.addNode('inc-2026-002', NODE_TYPES.INCIDENT, 'INC-2026-002: Motor M-101 Overcurrent Trip', { reportedAt: '2026-07-18', severity: 'HIGH', resolved: false });

    // Spare Parts
    this.addNode('part-bearing-6206', NODE_TYPES.SPARE_PART, 'SKF 6206-2RS Precision Bearing', { partNumber: 'SKF-6206-2RS', stockQty: 4, reorderPoint: 2 });
    this.addNode('part-seal-viton', NODE_TYPES.SPARE_PART, 'Viton O-Ring Seal Kit 75mm', { partNumber: 'VIT-SEAL-75', stockQty: 8, reorderPoint: 3 });
    this.addNode('part-grease-kluber', NODE_TYPES.SPARE_PART, 'Klüberplex BEV 41-822 Grease 1kg', { partNumber: 'KLU-BEV-1KG', stockQty: 6, reorderPoint: 2 });

    // Technicians
    this.addNode('tech-rajesh', NODE_TYPES.TECHNICIAN, 'Rajesh Kumar (Senior Maintenance)', { certifications: ['LOTO', 'Hydraulics', 'CNC'], shift: 'A' });
    this.addNode('tech-priya', NODE_TYPES.TECHNICIAN, 'Priya Sharma (Electrical Specialist)', { certifications: ['Electrical', 'Motor Winding', 'LOTO'], shift: 'B' });
    this.addNode('tech-amit', NODE_TYPES.TECHNICIAN, 'Amit Desai (Hydraulics Expert)', { certifications: ['Hydraulics', 'Pneumatics', 'LOTO'], shift: 'C' });

    // ─── Build Relationships ───

    // Plant → Lines
    this.addRelationship('plant-pune-01', 'line-pune-A', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('plant-pune-01', 'line-pune-B', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('plant-ahm-01', 'line-ahm-A', RELATIONSHIP_TYPES.CONTAINS);

    // Lines → Machines
    this.addRelationship('line-pune-A', 'mach-vmc-01', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('line-pune-A', 'mach-vmc-02', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('line-pune-B', 'mach-hyd-01', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('line-pune-B', 'mach-pump-01', RELATIONSHIP_TYPES.CONTAINS);
    this.addRelationship('line-ahm-A', 'mach-mot-01', RELATIONSHIP_TYPES.CONTAINS);

    // Machine → Sensors
    this.addRelationship('mach-vmc-01', 'sensor-vib-01', RELATIONSHIP_TYPES.HAS_SENSOR);
    this.addRelationship('mach-vmc-01', 'sensor-temp-01', RELATIONSHIP_TYPES.HAS_SENSOR);
    this.addRelationship('mach-vmc-02', 'sensor-vib-02', RELATIONSHIP_TYPES.HAS_SENSOR);
    this.addRelationship('mach-hyd-01', 'sensor-press-01', RELATIONSHIP_TYPES.HAS_SENSOR);
    this.addRelationship('mach-mot-01', 'sensor-curr-01', RELATIONSHIP_TYPES.HAS_SENSOR);

    // Sensor → Alarm
    this.addRelationship('sensor-vib-01', 'alarm-vib-critical', RELATIONSHIP_TYPES.TRIGGERS);
    this.addRelationship('sensor-temp-01', 'alarm-temp-high', RELATIONSHIP_TYPES.TRIGGERS);
    this.addRelationship('sensor-vib-02', 'alarm-vib-critical', RELATIONSHIP_TYPES.TRIGGERS);
    this.addRelationship('sensor-press-01', 'alarm-press-low', RELATIONSHIP_TYPES.TRIGGERS);
    this.addRelationship('sensor-curr-01', 'alarm-overload', RELATIONSHIP_TYPES.TRIGGERS);

    // Alarm → Workflow
    this.addRelationship('alarm-vib-critical', 'wf-bearing-replacement', RELATIONSHIP_TYPES.INITIATES);
    this.addRelationship('alarm-temp-high', 'wf-motor-thermal', RELATIONSHIP_TYPES.INITIATES);
    this.addRelationship('alarm-press-low', 'wf-hydraulic-pm', RELATIONSHIP_TYPES.INITIATES);

    // Workflow → Work Order
    this.addRelationship('wf-bearing-replacement', 'wo-2026-1001', RELATIONSHIP_TYPES.GENERATES);
    this.addRelationship('wf-motor-thermal', 'wo-2026-1002', RELATIONSHIP_TYPES.GENERATES);
    this.addRelationship('wf-hydraulic-pm', 'wo-2026-1003', RELATIONSHIP_TYPES.GENERATES);

    // Work Order → Spare Parts
    this.addRelationship('wo-2026-1001', 'part-bearing-6206', RELATIONSHIP_TYPES.REQUIRES);
    this.addRelationship('wo-2026-1001', 'part-grease-kluber', RELATIONSHIP_TYPES.REQUIRES);
    this.addRelationship('wo-2026-1002', 'part-seal-viton', RELATIONSHIP_TYPES.REQUIRES);
    this.addRelationship('wo-2026-1003', 'part-seal-viton', RELATIONSHIP_TYPES.REQUIRES);

    // Work Order → Technicians
    this.addRelationship('wo-2026-1001', 'tech-rajesh', RELATIONSHIP_TYPES.ASSIGNED_TO);
    this.addRelationship('wo-2026-1002', 'tech-priya', RELATIONSHIP_TYPES.ASSIGNED_TO);
    this.addRelationship('wo-2026-1003', 'tech-amit', RELATIONSHIP_TYPES.ASSIGNED_TO);

    // Machine → SOPs & Manuals
    this.addRelationship('mach-vmc-01', 'sop-bearing-lubrication', RELATIONSHIP_TYPES.GOVERNED_BY);
    this.addRelationship('mach-vmc-01', 'sop-loto', RELATIONSHIP_TYPES.GOVERNED_BY);
    this.addRelationship('mach-vmc-01', 'manual-vmc-850', RELATIONSHIP_TYPES.GOVERNED_BY);
    this.addRelationship('mach-hyd-01', 'sop-hydraulic', RELATIONSHIP_TYPES.GOVERNED_BY);
    this.addRelationship('mach-hyd-01', 'manual-hydraulic', RELATIONSHIP_TYPES.GOVERNED_BY);
    this.addRelationship('mach-pump-01', 'sop-hydraulic', RELATIONSHIP_TYPES.GOVERNED_BY);

    // Incidents → Machines (caused by)
    this.addRelationship('inc-2026-001', 'mach-vmc-01', RELATIONSHIP_TYPES.CAUSED_BY);
    this.addRelationship('inc-2026-002', 'mach-mot-01', RELATIONSHIP_TYPES.CAUSED_BY);

    // Incidents → Alarms (related to)
    this.addRelationship('inc-2026-001', 'alarm-vib-critical', RELATIONSHIP_TYPES.RELATED_TO);
    this.addRelationship('inc-2026-002', 'alarm-overload', RELATIONSHIP_TYPES.RELATED_TO);

    // Incidents → Manuals (documented in)
    this.addRelationship('inc-2026-001', 'manual-vmc-850', RELATIONSHIP_TYPES.DOCUMENTED_IN);

    // Machine Similarity (same type / same failure modes)
    this.addRelationship('mach-vmc-01', 'mach-vmc-02', RELATIONSHIP_TYPES.SIMILAR_TO);
    this.addRelationship('mach-hyd-01', 'mach-pump-01', RELATIONSHIP_TYPES.SIMILAR_TO);
  }
}

module.exports = new GraphEngine();
