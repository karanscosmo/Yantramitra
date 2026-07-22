# YantraMitra — API Reference

Complete reference for all REST API endpoints. All endpoints require authentication via JWT cookie (`authApi` middleware) unless noted.

---

## Authentication

### POST /api/auth/login
Login with email + password. Sets httpOnly JWT cookie.

### POST /api/auth/signup
Register a new user.

### POST /api/auth/logout
Clears JWT cookie.

### GET /api/auth/google
Initiates Google OAuth flow.

### GET /api/auth/google/callback
OAuth callback — sets JWT and redirects.

### GET /api/auth/me
Returns current authenticated user profile.

---

## Machine Learning Predictive Maintenance

### GET /api/ml/model-info
Returns active model metadata: version, algorithm, accuracy metrics, SHAP feature importances.

### POST /api/ml/predict
Generate ML prediction for a machine.

**Body:**
```json
{
  "machineId": "mach-001",
  "vibration": 3.8,
  "temperature": 78.2,
  "pressure": 14.5,
  "current": 42.1,
  "rpm": 2800
}
```

**Response:** `failureProbability`, `remainingUsefulLife`, `riskLevel`, `confidence`, `shapValues`

### GET /api/ml/health
ML service health check.

---

## Enterprise Hybrid Vector RAG

### GET /api/rag/status
RAG system status: indexed docs, chunk count, embedding model, storage size.

### POST /api/rag/query
Query the knowledge base.

**Body:** `{ "query": "bearing lubrication interval", "topK": 5 }`

### POST /api/rag/index
Rebuild the vector index from knowledge base documents.

### GET /api/rag/admin
Administrative stats: document list, embedding timestamps, model version.

---

## AI Copilot (YantraNklan)

### POST /api/ai-chat
Chat with YantraNklan. Supports conversation history and RAG context.

**Body:** `{ "message": "...", "conversationId": "...", "history": [...] }`

### POST /api/ai-chat/stream
Streaming chat with SSE fallback.

### POST /api/ai-upload
Upload and analyze files (PDF, DOCX, XLSX, CSV, TXT, images). Max 5 files.

---

## Multi-Agent AI System

### GET /api/agents
Returns all agent configurations and status.

### POST /api/agents/run
Dispatch one or more agents.

**Body:**
```json
{
  "agents": ["rca", "maintenance_planner", "spare_parts"],
  "machineId": "mach-001",
  "alarmId": "alarm-xyz",
  "context": {}
}
```

**Available agent keys:** `rca`, `maintenance_planner`, `spare_parts`, `work_order`, `safety_compliance`, `reliability_engineer`

### POST /api/agents/orchestrate
Run the full multi-agent orchestration pipeline for a machine event.

---

## Industrial Workflow Engine

### GET /api/workflows/templates
Lists all available workflow templates.

**Available templates:** `tpl_bearing_replacement`, `tpl_motor_overheating`, `tpl_pump_cavitation`, `tpl_spindle_vibration`, `tpl_emergency_shutdown`, `tpl_preventive_maintenance`, `tpl_hydraulic_pm`

### POST /api/workflows/create
Create and execute a workflow from a template.

**Body:** `{ "templateId": "tpl_bearing_replacement", "machineId": "mach-001", "triggeredBy": "alarm" }`

### GET /api/workflows/active
Returns all active workflow instances.

### POST /api/workflows/:id/action
Control a running workflow.

**Body:** `{ "action": "pause" | "resume" | "complete" | "abort" }`

### GET /api/workflows/:id/audit
Returns the full immutable audit trail for a workflow instance.

### POST /api/workflows/simulate
Dry-run a workflow — returns predicted impact, downtime, and risks without executing.

---

## Event-Driven System

### GET /api/events
Event system status: subscriber count, active rules, event throughput.

### GET /api/events/history
Query event history with filters.

**Query params:** `machineId`, `eventType`, `severity`, `startTime`, `endTime`, `limit`

### POST /api/events/publish
Publish an event to the bus.

**Body:**
```json
{
  "eventType": "TELEMETRY",
  "machineId": "mach-001",
  "payload": { "vibration": 5.2, "temperature": 88 },
  "severity": "HIGH"
}
```

### POST /api/events/replay
Replay historical events through the trigger engine.

**Body:** `{ "eventIds": ["evt-001", "evt-002"], "limit": 50 }`

---

## Industrial Knowledge Graph

### GET /api/graph
Graph system status: total nodes, edges, node type breakdown.

### GET /api/graph/node/:id
Fetch a single graph node by ID.

**Example IDs:** `mach-vmc-01`, `plant-pune-01`, `alarm-vib-critical`, `sop-loto`

### GET /api/graph/neighbors/:id
Get all neighbors of a node. Optional `?relationship=HAS_SENSOR` filter.

**Relationship types:** `CONTAINS`, `HAS_SENSOR`, `TRIGGERS`, `GOVERNED_BY`, `INITIATES`, `GENERATES`, `REQUIRES`, `ASSIGNED_TO`, `DOCUMENTED_IN`, `RELATED_TO`, `CAUSED_BY`, `SIMILAR_TO`

### GET /api/graph/path?from=X&to=Y
BFS shortest path between two nodes.

**Example:** `GET /api/graph/path?from=plant-pune-01&to=part-bearing-6206`

### GET /api/graph/impact/:machineId
Full impact analysis for a machine: impacted sensors, alarms, workflows, work orders, spare parts, technicians, SOPs.

### GET /api/graph/dependencies/:machineId
Full 6-hop dependency chain map for a machine.

### GET /api/graph/similar/:nodeId
Similarity search: direct SIMILAR_TO links + same-type candidates. Optional `?limit=5`.

---

## Decision Intelligence

### GET /api/decisions
Decision engine status and capabilities.

### POST /api/decisions/analyze
Full multi-option decision analysis.

**Body:**
```json
{
  "machineId": "mach-vmc-01",
  "machineName": "Jyoti VMC 850 CNC Milling",
  "problemType": "vibration_anomaly",
  "mlPrediction": {
    "failureProbability": 78,
    "remainingUsefulLife": 4.2,
    "riskLevel": "CRITICAL"
  },
  "ragEvidence": [
    { "chunk": "Replace bearing after vibration exceeds 4.5 mm/s", "source": "sop_bearing.md" }
  ],
  "customWeights": {
    "safety": 0.40, "reliability": 0.30, "cost": 0.15,
    "downtime": 0.10, "productionImpact": 0.03, "energyImpact": 0.02
  }
}
```

**Response:** `decisionId`, `rankedRecommendations`, `tradeoffMatrix`, `explanations`, `topRecommendation`

---

## Enterprise Fleet Intelligence

### GET /api/fleet
Fleet system status: plant count, machine count, health score.

### GET /api/fleet/overview
Full fleet KPIs + cross-plant comparison + machine rankings.

**Returns:** `fleetKPIs` (OEE, Availability, MTBF, MTTR), `plants[]`, `crossPlantComparison`, `machineRankings`, `machineClassComparison`

### GET /api/fleet/benchmark
Machine and plant benchmark scores and tier distribution.

**Returns:** `machineBenchmarks[]` (rank, score 0–100, tier), `plantBenchmarks[]`, `tierDistribution`, `topMachine`, `bottomMachine`

### GET /api/fleet/anomalies
Z-score fleet anomaly report.

**Returns:** `anomalies[]` (machineId, anomalyFlags[], zScore, severity), `fleetBaseline`, `anomalyRate`

### GET /api/fleet/recommendations
Prioritized cross-plant global recommendations.

**Returns:** `recommendations[]` (type, priority P1–P4, title, description, estimatedImpact), `byPriority`, `byType`

---

## Core Operations

### GET /api/plants
All plants with summary KPIs.

### GET /api/plants/:id
Single plant detail with machines, alarms, KPIs.

### GET /api/machines
All machines with health status and telemetry.

### GET /api/machines/:id
Single machine with sensors, alarms, maintenance history, ML prediction.

### POST /api/machines/:id/telemetry
Submit new telemetry reading. Triggers ML prediction and event publication.

### GET /api/alarms
Active and historical alarms with filtering.

### GET /api/work-orders
Work orders with status/priority/location filtering.

### POST /api/work-orders
Create a new work order.

### PATCH /api/work-orders/:id
Update work order (status, assignment, notes).

### GET /api/missions
Agent missions aggregated with status.

### GET /api/audit-log
Mutation audit log with actor, action, entity, and detail.

---

## System

### GET /api/health
Platform health check — database, ML, RAG, event system status.
