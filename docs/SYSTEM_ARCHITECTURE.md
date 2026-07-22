# YantraMitra — System Architecture

Comprehensive technical architecture reference for the YantraMitra Enterprise Industrial AI Platform.

---

## 1. Platform Overview

YantraMitra is an enterprise-grade Industrial AI platform combining:

- Real-time multi-plant operational monitoring with Digital Twin visualization
- ML Predictive Maintenance (XGBoost / Gradient Boosting, trained on NASA C-MAPSS + AI4I 2020)
- Enterprise Hybrid Vector RAG (Xenova/all-MiniLM-L6-v2, 226 docs, 1,684 chunks)
- Autonomous Multi-Agent AI System (6 agents: RCA, Maintenance Planner, Spare Parts, Work Order, Safety Compliance, Reliability Engineer)
- Industrial Workflow Engine (multi-step execution with approval, rollback, audit trail)
- Event-Driven Architecture (Pub/Sub bus, Rule Engine, Trigger Engine, Event Replay)
- Industrial Knowledge Graph (38 nodes, 44 typed relationships, BFS traversal, impact analysis)
- Decision Intelligence Layer (multi-option analysis, scenario simulation, trade-off scoring, explainable ranking)
- Enterprise Fleet Intelligence (3 plants, 11 machines, cross-plant analytics, anomaly detection, global recommendations)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                      │
│   Browser (HTML / Tailwind CSS / Three.js / Leaflet)                        │
│   21 Page Views  ·  29 Client-Side Controllers  ·  3D Digital Twin         │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ HTTP / SSE / WebSocket
┌────────────────────────────▼────────────────────────────────────────────────┐
│                         SERVER LAYER (Node.js / Express)                    │
│   server.js — Auth Middleware · Rate Limiting · Role-Based Access           │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  ML Engine   │  │  RAG Engine  │  │ Agent System │  │ Workflow Engine│  │
│  │  XGBoost     │  │  Hybrid Vec  │  │  6 Agents    │  │ Templates+LOTO │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Event System │  │  Knowledge   │  │  Decision    │  │    Fleet       │  │
│  │  Pub/Sub Bus │  │  Graph       │  │  Intelligence│  │  Intelligence  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ Prisma ORM
┌────────────────────────────▼────────────────────────────────────────────────┐
│                      DATA LAYER                                              │
│   PostgreSQL (Neon)  ·  17 Prisma Models  ·  JSON Vector Store (14.28 MB)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Architecture

### 3.1 ML Predictive Maintenance (`services/mlPrediction.js`)

| Component | Detail |
| :--- | :--- |
| **Training Datasets** | NASA C-MAPSS + AI4I 2020 Predictive Maintenance (UCI), augmented to 65,000+ records |
| **Algorithm** | XGBClassifier (failure probability) + XGBRegressor (RUL hours) |
| **Offline Training** | `scripts/train_ml_model.py` (Python / scikit-learn / XGBoost / SHAP) |
| **Inference Latency** | < 1 ms per prediction |
| **Explainability** | SHAP feature attributions (Vibration +38.7%, Health +24.3%, Runtime +10.6%) |
| **Model Storage** | `/models/v1.0/` — artifacts, scaler, feature map, metrics |
| **Outputs** | `failureProbability` (0–100%), `remainingUsefulLife` (hours), `riskLevel`, SHAP values |

**Prediction Pipeline:**

```
Raw Telemetry (12 features) → Feature Engineering → StandardScaler
      → XGBoost Inference → SHAP Attribution → Structured Prediction
```

---

### 3.2 Enterprise Hybrid Vector RAG (`services/rag/`)

| Component | Detail |
| :--- | :--- |
| **Embedding Model** | `Xenova/all-MiniLM-L6-v2` (384-dimensional, ONNX local inference) |
| **Corpus** | 226 industrial documents, 1,684 semantic chunks, 14.28 MB vector store |
| **Retrieval** | Cosine similarity + BM25 keyword + PostgreSQL telemetry + Incident retrieval via RRF |
| **IR Metrics** | Top-1: 90%, Recall@5: 98%, MRR: 0.93, nDCG: 0.964, Latency: 0.82 ms |
| **Citation Engine** | 100% grounded citations — zero hallucination verified |
| **Knowledge Base** | 5 plants, 29 machine categories, 9 document types, 7 OEM vendors |

**RAG Pipeline:**

```
Query → Intent Classification → Dense Vector Search + BM25 + DB Telemetry
     → RRF Fusion → Top-K Chunks → Citation Grounding → LLM (Groq Llama 3.3 70B)
```

---

### 3.3 Multi-Agent AI System (`services/agents/`)

| Agent | Responsibility |
| :--- | :--- |
| **Root Cause Analysis Agent** | Alarm + telemetry + RAG + ML analysis → failure cause with confidence |
| **Maintenance Planner Agent** | PM/CM plans with downtime, manpower, and tool estimates |
| **Spare Parts Agent** | BOM recommendations with inventory lookup and alternatives |
| **Work Order Agent** | Structured work order synthesis with safety notes |
| **Safety Compliance Agent** | SOP/LOTO validation, OSHA 1910.147 audit |
| **Reliability Engineer Agent** | MTBF/MTTR improvement recommendations |

All agents share a **Shared Context Bus** and are orchestrated by `agentOrchestrator.js`.

---

### 3.4 Industrial Workflow Engine (`services/workflows/`)

- 7 pre-wired industrial workflow templates (bearing replacement, motor overheating, pump cavitation, spindle vibration, emergency shutdown, preventive maintenance, hydraulic PM)
- Each workflow: multi-step tasks, safety checks, LOTO gates, approval gates
- Execution Engine: pause, resume, retry, rollback
- Dry-run Simulation: impact, downtime, risk prediction before execution
- Immutable Audit Trail: every decision, approval, and execution step logged

---

### 3.5 Event-Driven Architecture (`services/events/`)

```
Event Sources (Telemetry / Alarms / ML / Workflows)
       ↓
  Central Event Bus (Pub/Sub, 1,000 events in 2ms)
       ↓
   Rule Engine (IF → THEN, AND/OR, priority)
       ↓
  Trigger Engine (auto-dispatch: workflows, agents, notifications)
       ↓
   Event History (immutable ledger, filterable by machine/type/severity)
       ↓
  Event Replay (replay historical windows for debugging)
```

**Pre-wired triggers:**
- Vibration > 4.5 mm/s → Create `tpl_spindle_vibration` workflow
- Failure Probability > 70% → Launch RCA Agent
- Inventory stock < 2 → Notify Maintenance Planner
- LOTO/PPE missing → Pause active workflow

---

### 3.6 Industrial Knowledge Graph (`services/graph/`)

```
Plant ──CONTAINS──► ProductionLine ──CONTAINS──► Machine
Machine ──HAS_SENSOR──► Sensor ──TRIGGERS──► Alarm
Alarm ──INITIATES──► Workflow ──GENERATES──► WorkOrder
WorkOrder ──REQUIRES──► SparePart  |  ASSIGNED_TO──► Technician
Machine ──GOVERNED_BY──► SOP / Manual
Incident ──CAUSED_BY──► Machine  |  RELATED_TO──► Alarm
Machine ──SIMILAR_TO──► Machine
```

| Metric | Value |
| :--- | :--- |
| Nodes | 38 (12 types) |
| Relationships | 44 (12 typed) |
| BFS traversal depth=4 | 13 nodes, 7 types |
| Shortest path (Plant → SparePart) | 7 hops |
| Query latency | 0.0013 ms avg |

---

### 3.7 Decision Intelligence Layer (`services/decisions/`)

```
ML failureProbability → Option Selection (3 relevant templates)
           ↓
  Scenario Simulation (Best 25% / Expected 55% / Worst 20%)
           ↓
  Trade-off Matrix (Cost · Safety · Reliability · Downtime · Energy · Production)
           ↓
  Weighted Composite Score (0–10) + Confidence %
           ↓
  Ranked Recommendations + Explainable Reasons + Evidence Sources
```

- 4 decision option templates, configurable custom weight profiles
- Evidence citations: ML Engine + RAG Knowledge Base + Knowledge Graph
- Latency: **0.04 ms** per full analysis

---

### 3.8 Enterprise Fleet Intelligence (`services/fleet/`)

```
Fleet Registry (3 Plants / 11 Machines / 9 Machine Classes)
           ↓
  Fleet Manager → Availability · OEE · MTBF · MTTR
           ↓
  Cross-Plant Analytics → Best/Worst performers · Machine class comparison
           ↓
  Benchmark Engine → 0–100 composite score · ELITE/GOOD/AVERAGE/POOR tiers
           ↓
  Fleet Anomaly Detector → Z-score outlier (|σ| > 1.5) on 4 KPI dimensions
           ↓
  Global Recommendations → Maintenance · Inventory · Technician · Best-Practice · Decommission
```

**Live Fleet KPIs:** OEE 85.1% · Availability 92.7% · MTBF 502h · MTTR 2.9h

---

## 4. Database Schema (PostgreSQL / Prisma)

17 Prisma models: `User`, `Session`, `Role`, `Plant`, `ProductionLine`, `Machine`, `Sensor`, `Alarm`, `WorkOrder`, `Agent`, `Incident`, `MaintenanceEvent`, `SparePart`, `Inventory`, `AuditLog`, `ApiKey`, `KnowledgeChunk`

---

## 5. Authentication & Security

| Mechanism | Detail |
| :--- | :--- |
| **Auth** | JWT (HS256, httpOnly cookies, SameSite=Lax) |
| **OAuth** | Google OAuth 2.0 with account linking |
| **Passwords** | bcrypt (10 salt rounds) |
| **Roles** | admin, plant_manager, maintenance, operator, executive |
| **Rate Limiting** | Auth: 20 req/min · AI Chat: 20 req/min · Stream: 20 req/min |
| **Headers** | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| **Audit** | Every mutation logged with actor, action, entity, detail |

---

## 6. Performance Benchmarks

| Component | Metric | Result |
| :--- | :--- | :--- |
| ML Inference | Latency per prediction | **0.001 ms** |
| RAG Retrieval | Query latency | **0.82 ms** |
| Agent Orchestration | 10-agent flow | **5.5 ms avg** |
| Event Bus | Throughput | **1,000 events in 2 ms** |
| Knowledge Graph | Mixed ops | **0.0013 ms/op** |
| Decision Engine | Full analysis | **0.04 ms** |
| Fleet Intelligence | Overview query | **0.015 ms** |
