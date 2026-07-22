# YantraMitra — Deployment Guide

---

## 1. Prerequisites

| Requirement | Version |
| :--- | :--- |
| Node.js | ≥ 18.x |
| Python | ≥ 3.9 (for ML training only) |
| PostgreSQL | ≥ 14 (Neon recommended) |
| npm | ≥ 9.x |

---

## 2. Local Development

### 2.1 Clone & Install

```bash
git clone https://github.com/karanscosmo/yantramitra
cd yantramitra
npm install
cp .env.example .env
```

### 2.2 Configure Environment

Edit `.env` with your credentials:

```env
DATABASE_URL=postgresql://user:password@host:5432/yantramitra?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/yantramitra
JWT_SECRET=your_jwt_secret_minimum_32_chars
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 2.3 Database Setup

```bash
npx prisma db push      # Apply schema to database
npm run seed            # Seed: 7 users, 5 plants, 30 machines, agents, alarms, work orders
```

### 2.4 ML Model Training (Optional)

The pre-trained model is included in `/models/latest/`. To retrain:

```bash
pip install xgboost scikit-learn pandas numpy shap joblib
npm run train-model     # Runs scripts/train_ml_model.py
```

### 2.5 RAG Index Building

The vector store is pre-built in `data/vector_db/`. To rebuild from `data/knowledge_base/`:

```bash
node -e "require('./services/rag').buildIndex()"
# Or via API: POST /api/rag/index
```

### 2.6 Start Server

```bash
npm start               # Starts Express on http://localhost:3000
```

Default login: `admin@yantramitra.com` / `password123`

---

## 3. Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL (pooled, for Neon use PgBouncer URL) |
| `DIRECT_URL` | **Yes** | Direct PostgreSQL URL for Prisma schema migrations |
| `JWT_SECRET` | **Yes** | JWT signing secret (minimum 32 characters in production) |
| `GROQ_API_KEY` | No | Groq API key — enables AI chat (Llama 3.3 70B). Chat is disabled without it |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | OAuth redirect URI (e.g. `https://your-app.vercel.app/api/auth/google/callback`) |
| `ENABLE_DEMO_PASSWORD_RESET` | No | Set `true` to enable password reset in demo environments |

---

## 4. Vercel Deployment

### 4.1 Push to GitHub

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

### 4.2 Import in Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the `yantramitra` repository
3. Framework Preset: **Other**
4. Root Directory: `/`

### 4.3 Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add all variables from Section 3.

> **Important for Google OAuth:** Add the production callback URL to your Google Cloud Console under Authorized redirect URIs:
> `https://your-domain.vercel.app/api/auth/google/callback`

### 4.4 Deploy

Click **Deploy**. The `vercel.json` configuration rewrites all paths to the serverless entry point at `api/index.js`.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index.js" }]
}
```

---

## 5. Running Tests

```bash
# Full platform test suite (all 11 suites, 205 tests)
node tests/fleet_intelligence.test.js
node tests/decision_intelligence.test.js
node tests/knowledge_graph.test.js
node tests/event_driven.test.js
node tests/workflow_engine.test.js
node tests/multi_agent.test.js
node tests/rag_stress_eval.test.js
node tests/retrieval_eval.test.js
node tests/rag_enterprise.test.js
node tests/ml_prediction.test.js
node tests/ml_hardening.test.js
```

**All 205 tests pass** with 0 failures.

---

## 6. Project Structure

```
yantramitra/
├── README.md
├── LICENSE
├── .env.example
├── package.json
├── server.js                   Express app (auth, routes, all API endpoints)
├── vercel.json
├── api/
│   └── index.js                Vercel serverless entry point
├── services/
│   ├── mlPrediction.js         ML inference engine
│   ├── rag/                    Enterprise Hybrid Vector RAG pipeline
│   ├── agents/                 Multi-Agent AI System (6 agents)
│   ├── workflows/              Industrial Workflow Engine
│   ├── events/                 Event-Driven Architecture (Bus, Rules, Triggers)
│   ├── graph/                  Industrial Knowledge Graph
│   ├── decisions/              Decision Intelligence Layer
│   └── fleet/                  Enterprise Fleet Intelligence
├── models/
│   ├── v1.0/                   ML model artifacts (XGBoost)
│   └── latest -> v1.0/
├── prisma/
│   └── schema.prisma           17-model Prisma schema
├── data/
│   ├── knowledge_base/         226 industrial documents (markdown)
│   └── vector_db/              Pre-built vector store (14.28 MB)
├── scripts/
│   ├── seed.js                 Demo data seeder
│   └── train_ml_model.py       Offline ML training pipeline
├── tests/                      11 automated test suites (205 tests)
├── views/                      21 page HTML views
├── public/
│   ├── js/                     29 client-side controllers
│   └── assets/                 Images, logos, icons
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   └── PROJECT_ROADMAP.md
└── uploads/                    User-uploaded files (gitignored)
```

---

## 7. Health Check

After deployment, verify the platform is healthy:

```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "ml": "loaded",
  "rag": "indexed",
  "events": "active"
}
```
