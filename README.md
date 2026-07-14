# YantraMitra

Industrial operations intelligence platform with multi-plant monitoring, asset diagnostics, AI-assisted analysis, and work order management for manufacturing environments.

## Features

- **Command Center** — Dashboard with plant KPIs, active alarms, machine status, and executive summary across facilities.
- **Digital Twin** — Three.js 3D factory floor with clickable machines, health overlay, and inspector panel.
- **AI Copilot (YantraNklan)** — Chat with streaming responses, file upload (PDF/DOCX/XLSX/CSV/TXT/images), text extraction, and conversation history. Context injected per page (assets, work orders, missions, anomaly investigation).
- **Work Orders** — CRUD, status/priority/location filters, search, sortable columns, pagination, detail drawer. Auto-seeds 25 orders on first fetch if fewer than 5 exist.
- **Asset Fleet & Detail** — Machine health cards, telemetry, component breakdown, maintenance timeline, AI predictions. Four tabs: Overview, Sensors, History, Documents.
- **Anomaly Investigation** — Active alarm management, root-cause graph with zoom/pan/draggable nodes, investigation path, evidence timeline, causal hypotheses with confidence bars, recommended actions, affected assets, AI reasoning panel.
- **Scenario Simulator** — Configuration presets (Balanced, Energy Saver, Maximum Output, Maintenance Mode), animated KPI bars.
- **Agent Mission Control** — AI agents with status management, mission queue, activity feed, timeline, recommendations.
- **Global Map** — Leaflet map with Indian city coordinates, facility status markers, drill-down.
- **Reliability Forecast** — Analytics and prediction views.
- **Diagnostics** — Per-asset diagnostics with telemetry, AI predictions, remaining useful life, hierarchy.
- **Maintenance Planner** — Maintenance schedule and event management.
- **Settings** — Profile, notifications, team & roles (invite/remove/role-change), integrations (connect/disconnect/configure/test), security (password change, 2FA, API keys, sessions, login history).
- **Command Palette** — Cmd+K / Ctrl+K global search across plants, machines, work orders, agents, and incidents.
- **Role-based Access** — Admin, plant_manager, maintenance, operator, executive roles with permission boundaries.
- **Audit Logging** — All mutations recorded with actor, action, entity, detail.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS (CDN), Material Symbols |
| 3D Rendering | Three.js (CDN) |
| Maps | Leaflet (CDN) |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (httpOnly cookies), bcryptjs |
| AI | Groq (Llama 3.3 70B) via OpenAI-compatible API |
| File Parsing | pdf-parse, mammoth (DOCX), xlsx |
| File Upload | multer |
| Deployment | Vercel (serverless via `api/index.js`) |

## Project Structure

```
api/
  index.js                    Vercel serverless entry point
views/                        21 page directories (home, login, command-center, asset-fleet, etc.)
prisma/
  schema.prisma               Database schema (15 models)
public/
  js/                         28 page controllers + shared app shell
  assets/                     images, logos, icons
scripts/
  seed.js                     Demo data seeder
services/
  prisma.js                   PrismaClient singleton
server.js                     Express app (~1795 lines)
vercel.json                   Build and routing configuration
```

## Installation

```bash
git clone <repo-url>
cd yantramitra-platform
npm install
cp .env.example .env
# Edit .env with your database and API credentials
npx prisma db push
npm run seed
npm start
```

Open `http://localhost:3000` and log in with `admin@yantramitra.com` / `password123`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection URL (pooled, e.g. Neon with PgBouncer) |
| `DIRECT_URL` | Yes | Direct PostgreSQL URL for migrations |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `GROQ_API_KEY` | No (AI features disabled without it) | Groq API key (get at https://console.groq.com) |
| `ENABLE_DEMO_PASSWORD_RESET` | No | Set `true` to enable reset-password in demo |

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start server on port 3000 |
| `npm run dev` | Same as start |
| `npm run seed` | Seed demo data (5 plants, 29 machines, 16K readings, team, incidents) |
| `npm run build` | Generate Prisma client |
| `npm run postinstall` | Auto-generates Prisma client after install |

## Architecture Overview

The application is a single Express server (`server.js`) that serves both API routes and static HTML pages. Each page is a standalone HTML file in `views/` with a corresponding controller in `public/js/`. Authentication uses JWT stored in httpOnly cookies with role-based middleware on admin routes. The AI chat uses Groq's OpenAI-compatible API with SSE streaming; it falls back to non-streaming if the client doesn't support SSE. Database access is through Prisma ORM with a singleton client instance (`services/prisma.js`) that caches across serverless invocations.

## Notes

- **Vercel deployment:** All routes are handled through `api/index.js` which re-exports the Express app. Set environment variables in the Vercel dashboard. The `vercel.json` rewrites all paths to the serverless function.
- **Database:** Designed for PostgreSQL (Neon). Prisma migrations require a `DIRECT_URL` (non-pooled). The `DATABASE_URL` should use PgBouncer pooling for serverless compatibility.
- **Demo data:** Running `npm run seed` populates 5 Indian manufacturing plants, 29 machines with components and sensors, 16,704 sensor readings, active alarms, 9 AI agents, 5 maintenance plans, 6 work orders, 1 operational incident, and 7 team members. Work orders auto-seed an additional 25 on first GET if fewer than 5 exist.
- **Seeded credentials:** `admin@yantramitra.com` / `operator@yantramitra.com` / `password123`. Additional roles (plant_manager, maintenance, executive) available via signup.

## Routes

| Path | Page |
|---|---|
| `/` | Landing |
| `/login`, `/signup`, `/reset-password`, `/onboarding` | Auth |
| `/dashboard` | Command center |
| `/map` | Global map |
| `/plant/:id` | Plant overview |
| `/digital-twin` | 3D factory |
| `/assets` | Asset fleet |
| `/assets/:id` | Asset detail |
| `/anomaly` | Anomaly investigation |
| `/reliability` | Reliability forecast |
| `/diagnostics/:assetId` | Diagnostics |
| `/simulator` | Scenario simulator |
| `/ai-console` | AI chat |
| `/agents` | Agent mission control |
| `/plans` | Plan review |
| `/maintenance` | Maintenance planner |
| `/work-orders` | Work orders |
| `/settings` | Settings & profile |
| `/privacy`, `/terms`, `/sitemap`, `/api-status`, `/about`, `/help`, `/contact`, `/documentation` | Static pages |
