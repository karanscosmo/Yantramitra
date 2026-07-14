# YantraMitra

Industrial operations intelligence platform for multi-plant monitoring, asset diagnostics, AI-assisted analysis, and work order management.

## Features

- **Command Center** — Dashboard with plant KPIs, alarms, machine status, and executive summary across facilities.
- **Digital Twin** — Three.js 3D factory floor with clickable machines, health overlay, and inspector panel.
- **AI Copilot (YantraNklan)** — Chat with streaming responses, file upload (PDF/DOCX/XLSX/CSV/TXT/images), text extraction, and per-page context injection.
- **Work Orders** — CRUD with status/priority/location filters, search, sortable columns, pagination, and detail drawer.
- **Asset Fleet & Detail** — Machine health cards, telemetry, component breakdown, maintenance timeline, AI predictions.
- **Anomaly Investigation** — Alarm management, root-cause graph with zoom/pan/draggable nodes, evidence timeline, and AI reasoning.
- **Scenario Simulator** — Configuration presets with animated KPI bars.
- **Agent Mission Control** — AI agent status management, mission queue, and activity feed.
- **Global Map** — Leaflet map with facility status markers and drill-down.
- **Reliability Forecast** — Analytics and prediction views.
- **Diagnostics** — Per-asset telemetry, AI predictions, and remaining useful life.
- **Maintenance Planner** — Schedule and event management.
- **Settings** — Profile, notifications, team & roles, integrations, security (password, 2FA, API keys, sessions).
- **Role-based Access** — Admin, plant_manager, maintenance, operator, executive roles.
- **Audit Logging** — All mutations recorded with actor, action, entity, and detail.
- **Command Palette** — Cmd+K / Ctrl+K global search across plants, machines, work orders, agents, and incidents.

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
| Deployment | Vercel |

## Project Structure

```
api/index.js              Vercel serverless entry point
views/                    21 page directories
prisma/schema.prisma      Database schema (15 models)
public/js/                28 page controllers + shared app shell
public/assets/            Images, logos, icons
scripts/seed.js           Demo data seeder
services/prisma.js        PrismaClient singleton
server.js                 Express application
vercel.json               Build and routing configuration
```

## Installation

```bash
git clone <repo-url>
cd yantramitra-platform
npm install
cp .env.example .env
```

Edit `.env` with your database and API credentials, then:

```bash
npx prisma db push
npm run seed
npm start
```

Open `http://localhost:3000`. Default login: `admin@yantramitra.com` / `password123`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection URL (pooled, e.g. Neon with PgBouncer) |
| `DIRECT_URL` | Yes | Direct PostgreSQL URL for migrations |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `GROQ_API_KEY` | No | Groq API key (AI features disabled without it) |
| `ENABLE_DEMO_PASSWORD_RESET` | No | Set `true` to enable reset-password in demo |

## Run Locally

```bash
npm start
```

Server runs on `http://localhost:3000`.

## Deployment

Deploy on Vercel. Set environment variables in the Vercel dashboard. `vercel.json` rewrites all paths to the serverless function at `api/index.js`.

## License

MIT
