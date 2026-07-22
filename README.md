# YantraMitra

**Enterprise Industrial AI Platform** — Multi-plant monitoring, predictive maintenance, autonomous agents, and fleet intelligence for Indian manufacturing operations.

[![Tests](https://img.shields.io/badge/tests-205%20passed-brightgreen)](tests/)
[![ML](https://img.shields.io/badge/ML-XGBoost%20%7C%20SHAP-blue)](services/mlPrediction.js)
[![RAG](https://img.shields.io/badge/RAG-all--MiniLM--L6--v2%20%7C%201684%20chunks-blue)](services/rag/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Overview

YantraMitra is a production-grade Industrial AI platform that combines real-time operational monitoring with a deep AI backend stack built across 8 engineering phases:

| Layer | Technology |
| :--- | :--- |
| **ML Predictive Maintenance** | XGBoost / Gradient Boosting, NASA C-MAPSS + AI4I 2020, SHAP explainability |
| **Enterprise RAG** | Hybrid Vector Search (Cosine + BM25 + RRF), `all-MiniLM-L6-v2` (ONNX), 226 docs |
| **Multi-Agent AI** | 6 autonomous agents: RCA, Maintenance, Spare Parts, Work Order, Safety, Reliability |
| **Workflow Engine** | 7 industrial templates, LOTO gates, approval engine, dry-run simulation |
| **Event System** | Pub/Sub bus, Rule Engine (IF→THEN), Trigger Engine, Event Replay |
| **Knowledge Graph** | 38 nodes, 44 typed relationships, BFS traversal, impact analysis |
| **Decision Intelligence** | Multi-option analysis, scenario simulation, trade-off scoring, explainable ranking |
| **Fleet Intelligence** | 3 plants, 11 machines, Z-score anomaly detection, global recommendations |
| **Digital Twin** | Three.js 3D factory floor with live sensor overlays |
| **Frontend** | 21 pages, 29 client-side controllers, role-based access |

---

## Platform Capabilities

### 🏭 Operations
- **Command Center** — Cross-plant dashboard: OEE, energy, CO₂, uptime, alarm summary, agent activity
- **Digital Twin** — Three.js 3D factory floor with interactive machines, health color overlay, orbit controls
- **Multi-Plant Monitoring** — Five Indian facilities with per-plant drilldown and global map (Leaflet)
- **Asset Fleet** — Machine health cards, telemetry graphs, component status, maintenance history

### 🤖 AI & Intelligence
- **ML Predictive Maintenance** — XGBoost models (failure probability, remaining useful life, risk score) with SHAP explanations, replacing all legacy heuristics
- **Enterprise Hybrid Vector RAG** — Semantic retrieval from 226 industrial documents (SOPs, OEM manuals, LOTO protocols, RCA reports) with 100% citation grounding
- **Multi-Agent AI (YantraNklan)** — 6 autonomous agents that analyze, plan, and recommend; orchestrated with a shared context bus
- **Decision Intelligence** — Compares 3 action alternatives with Best/Expected/Worst case simulation, 6-dimension trade-off scoring, and explainable ranking citing ML + RAG + Graph evidence
- **Fleet Intelligence** — Fleet-wide KPIs (OEE 85.1%, MTBF 502h), cross-plant analytics, benchmark scoring (ELITE→POOR), Z-score anomaly detection, and prioritized global recommendations

### ⚙️ Operational Systems
- **Workflow Engine** — Creates and executes 7 industrial workflow templates with pause/resume/rollback, LOTO safety gates, dry-run simulation, and immutable audit trail
- **Event System** — Event-driven Pub/Sub bus processing 1,000 events/2ms; rule-based triggers auto-dispatch workflows and agents on telemetry, alarms, and predictions
- **Knowledge Graph** — Typed graph connecting Plant → Line → Machine → Sensor → Alarm → Workflow → Work Order → Spare Parts → Technicians; multi-hop traversal and impact analysis

### 🔐 Security & Access
- JWT authentication (httpOnly cookies), Google OAuth with account linking
- Role-based access: admin, plant_manager, maintenance, operator, executive
- Rate limiting, bcrypt passwords, security headers, full audit log

---

## Quick Start

```bash
git clone https://github.com/karanscosmo/yantramitra
cd yantramitra
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, GROQ_API_KEY
npx prisma db push
npm run seed
npm start
```

Open **http://localhost:3000** — Login: `admin@yantramitra.com` / `password123`

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL (pooled) |
| `DIRECT_URL` | **Yes** | Direct PostgreSQL URL for schema migrations |
| `JWT_SECRET` | **Yes** | JWT signing secret (≥ 32 characters) |
| `GROQ_API_KEY` | No | Groq API key (Llama 3.3 70B) — enables AI chat |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | OAuth redirect URI |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions including Vercel.

---

## ML Model Training

A pre-trained model is included. To retrain on new data:

```bash
pip install xgboost scikit-learn pandas numpy shap joblib
npm run train-model     # Runs scripts/train_ml_model.py
```

---

## Testing

```bash
node tests/fleet_intelligence.test.js       # Fleet Intelligence — 10 tests
node tests/decision_intelligence.test.js    # Decision Intelligence — 10 tests
node tests/knowledge_graph.test.js          # Knowledge Graph — 10 tests
node tests/event_driven.test.js             # Event System — 10 tests
node tests/workflow_engine.test.js          # Workflow Engine — 10 tests
node tests/multi_agent.test.js              # Multi-Agent AI — 10 tests
node tests/rag_stress_eval.test.js          # RAG 100-Query Stress — 100 tests
node tests/retrieval_eval.test.js           # IR Evaluation — 10 tests
node tests/rag_enterprise.test.js           # RAG Architecture — 10 tests
node tests/ml_prediction.test.js            # ML Engine — 7 tests
node tests/ml_hardening.test.js             # ML Hardening — 18 tests
```

**Total: 205 tests — 0 failures**

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | HTML, Tailwind CSS (CDN), Material Symbols |
| 3D Rendering | Three.js r160 (CDN) |
| Maps | Leaflet (CDN) |
| Backend | Node.js 18+, Express |
| Database | PostgreSQL (Neon), Prisma ORM |
| ML Training | Python, XGBoost, scikit-learn, SHAP |
| ML Inference | Node.js (< 1 ms latency) |
| Embeddings | Xenova/all-MiniLM-L6-v2 (ONNX, local) |
| AI Chat | Groq (Llama 3.3 70B) |
| Deployment | Vercel (serverless) |

---

## Project Structure

```
yantramitra/
├── README.md
├── LICENSE                   MIT License
├── .env.example
├── package.json
├── server.js                   Express app + all API endpoints
├── api/index.js                Vercel serverless entry point
├── services/
│   ├── mlPrediction.js         ML inference engine
│   ├── rag/                    Hybrid Vector RAG pipeline
│   ├── agents/                 Multi-Agent AI system (6 agents)
│   ├── workflows/              Industrial Workflow Engine
│   ├── events/                 Event-Driven Architecture
│   ├── graph/                  Industrial Knowledge Graph
│   ├── decisions/              Decision Intelligence Layer
│   └── fleet/                  Enterprise Fleet Intelligence
├── models/latest/              Pre-trained XGBoost model artifacts
├── prisma/schema.prisma        17-model database schema
├── data/
│   ├── knowledge_base/         226 industrial documents
│   └── vector_db/              Pre-built vector store (14.28 MB)
├── scripts/
│   ├── seed.js
│   └── train_ml_model.py
├── tests/                      11 test suites, 205 tests
├── views/                      21 page HTML views
├── public/js/                  29 client-side controllers
└── docs/
    ├── SYSTEM_ARCHITECTURE.md
    ├── API_REFERENCE.md
    ├── DEPLOYMENT.md
    └── PROJECT_ROADMAP.md
```

---

## Documentation

| Document | Description |
| :--- | :--- |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Full technical architecture for all 8 AI layers |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Complete REST API reference (50+ endpoints) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local dev + Vercel deployment guide |
| [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) | Completed phases + planned roadmap |

---

## Screens

`/` · `/login` · `/signup` · `/onboarding` · `/dashboard` · `/map` · `/plant/:id` · `/digital-twin` · `/assets` · `/assets/:id` · `/anomaly` · `/reliability` · `/diagnostics/:assetId` · `/simulator` · `/ai-console` · `/agents` · `/plans` · `/maintenance` · `/work-orders` · `/settings`

---

## License

MIT
