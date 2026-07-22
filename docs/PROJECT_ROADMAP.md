# YantraMitra — Project Roadmap

---

## Completed Phases

### ✅ Phase 0 — Foundation Platform
**Core operational platform with real-time monitoring, digital twin, and auth.**

- Command Center dashboard with cross-plant KPIs
- Three.js 3D Digital Twin with interactive machines and health overlays
- Role-based authentication (JWT + Google OAuth) with 5 roles
- Work order CRUD, alarm management, audit logging
- PostgreSQL schema (17 Prisma models), seeder (5 plants, 30 machines)
- 21 page views, 29 client-side controllers

---

### ✅ Phase 1 — ML Predictive Maintenance
**Replaced all heuristic calculations with a production ML model.**

- XGBoost / Gradient Boosting trained on NASA C-MAPSS + AI4I 2020 (65,000+ records)
- Outputs: `failureProbability`, `remainingUsefulLife`, `riskLevel`
- SHAP explainability: feature-level attribution per prediction
- Offline Python training pipeline (`scripts/train_ml_model.py`)
- Versioned model storage + `GET /api/ml/model-info`
- **25 tests passing** (7 ML + 18 hardening)

---

### ✅ Phase 2 — Enterprise Hybrid Vector RAG
**Replaced prompt injection with true semantic retrieval.**

- Local ONNX embedding: `Xenova/all-MiniLM-L6-v2` (384-dim, no paid APIs)
- Hybrid retrieval: Cosine similarity + BM25 + DB telemetry + Incident history via RRF
- 226 industrial documents, 1,684 semantic chunks, 14.28 MB vector store
- Citation engine: 100% grounded responses, zero hallucination
- IR Benchmarks: Top-1 90%, Recall@5 98%, MRR 0.93, nDCG 0.964, Latency 0.82 ms
- Enterprise knowledge base: 5 plants, 29 machine types, 9 document categories
- **120 tests passing** (100-query stress eval + 10 IR + 10 RAG architecture)

---

### ✅ Phase 3 — Autonomous Multi-Agent AI System
**Transformed YantraNklan from chatbot to industrial multi-agent system.**

- 6 specialized agents: RCA, Maintenance Planner, Spare Parts, Work Order, Safety Compliance, Reliability Engineer
- Shared Context Bus + Agent Orchestrator for coordinated multi-agent execution
- Citation grounding: all agent outputs reference RAG evidence
- **10 tests passing** (agent dispatch, orchestration, performance < 200ms)

---

### ✅ Phase 4 — Industrial Workflow Engine
**Enabled autonomous operational workflow execution.**

- 7 workflow templates: bearing replacement, motor overheating, pump cavitation, spindle vibration, emergency shutdown, preventive maintenance, hydraulic PM
- Execution: pause, resume, retry, rollback, approval gates, LOTO safety checks
- Dry-run simulation: predict impact, downtime, risk before execution
- Immutable audit trail
- **10 tests passing**

---

### ✅ Phase 5 — Event-Driven Architecture
**Made YantraMitra event-driven instead of request-driven.**

- Central Pub/Sub Event Bus (1,000 events in 2 ms)
- Standardized event taxonomy (7 types: Telemetry, Alarm, Prediction, Workflow, Maintenance, Inventory, Safety)
- Rule Engine: IF → THEN with AND/OR conditions and priority tiers
- Trigger Engine: 4 pre-wired industrial auto-triggers
- Immutable event history + Event Replay
- **10 tests passing**

---

### ✅ Phase 6 — Industrial Knowledge Graph
**Connected all operational entities in a typed graph.**

- 38 nodes (12 types), 44 typed relationships (12 types)
- BFS multi-hop traversal, BFS shortest path
- Impact analysis: machine → sensors → alarms → workflows → work orders → parts
- Dependency mapping (6-hop chain), similarity search
- Graph API: 7 endpoints
- **10 tests passing** (traversal, path, impact, similarity, latency)

---

### ✅ Phase 7 — Decision Intelligence Layer
**Compared multiple operational decisions before execution.**

- 4 decision option templates (immediate repair, deferred, PM, component replacement)
- Scenario Simulation: Best (25%) / Expected (55%) / Worst (20%) case
- Trade-off Matrix: 6 normalized dimensions (Cost, Safety, Reliability, Downtime, Energy, Production)
- Weighted composite scoring + confidence % + ranking
- Explainable reasoning: ML + RAG + Graph evidence citations
- Custom weight profiles (safety-first, cost-first, etc.)
- **10 tests passing** (0.04 ms per analysis)

---

### ✅ Phase 8 — Enterprise Fleet Intelligence
**Extended from plant-level to enterprise fleet intelligence.**

- Fleet registry: 3 plants, 11 machines, 9 machine classes
- Fleet KPIs: OEE 85.1%, Availability 92.7%, MTBF 502h, MTTR 2.9h
- Cross-plant analytics: best/worst performer identification per KPI dimension
- Benchmark engine: 0–100 composite score, ELITE/GOOD/AVERAGE/POOR tiers
- Fleet anomaly detection: Z-score outlier (|σ| > 1.5) on 4 dimensions
- Global recommendations: 6 types (maintenance, inventory, technician, best-practice, decommission)
- **10 tests passing** (0.015 ms per fleet operation)

---

## Platform Test Scorecard

| Suite | Tests | Status |
| :--- | :--- | :--- |
| Fleet Intelligence | 10 | ✅ PASS |
| Decision Intelligence | 10 | ✅ PASS |
| Knowledge Graph | 10 | ✅ PASS |
| Event-Driven Architecture | 10 | ✅ PASS |
| Workflow Engine | 10 | ✅ PASS |
| Multi-Agent System | 10 | ✅ PASS |
| RAG Stress Evaluation | 100 | ✅ PASS |
| IR Retrieval Evaluation | 10 | ✅ PASS |
| RAG Architecture | 10 | ✅ PASS |
| ML Hardening | 18 | ✅ PASS |
| ML Engine | 7 | ✅ PASS |
| **Total** | **205** | **✅ 0 FAILURES** |

---

## Planned Phases

### 🔲 Phase 9 — Operational Intelligence Dashboard Enhancements
- Real-time fleet KPI widgets surfacing fleet intelligence data
- Knowledge graph visualization panel
- Decision comparison UI component
- Event stream live feed

### 🔲 Phase 10 — External Integrations
- SCADA / OPC-UA protocol adapter
- ERP system integration (SAP PM work order sync)
- IoT device direct telemetry ingestion
- CMMS API bridge

### 🔲 Phase 11 — Predictive Supply Chain
- Spare parts demand forecasting
- Supplier lead-time optimization
- Automated purchase order generation on stockout prediction

### 🔲 Phase 12 — Carbon & Energy Intelligence
- Machine-level energy consumption tracking
- Carbon footprint calculation per work order
- ISO 50001 energy management compliance reporting

### 🔲 Phase 13 — Mobile & Edge
- Progressive Web App (PWA) for field technicians
- Offline-capable maintenance checklist execution
- Edge ML inference for air-gapped plant environments
