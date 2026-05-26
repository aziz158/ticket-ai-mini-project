# Ticket AI — Customer Support Command Center

A full-stack SaaS dashboard for AI-assisted customer support ticket management, powered by a local **Llama 3.2** model running through **Ollama**.

---

## Features

- **AI Ticket Pipeline** — every new ticket is automatically classified, sentiment-analyzed, summarized, and generates a suggested reply
- **Escalation Detection** — hybrid rule-based + LLM detection flags high-risk tickets (angry sentiment, legal keywords, refund disputes, low confidence)
- **Real-time Updates** — live ticket feed via Socket.IO; the frontend cache invalidates automatically on `ticket_created`, `ticket_updated`, `ticket_deleted`, and `message_added` events
- **Analytics Dashboard** — KPIs, 14-day sentiment trends, 7-day escalation trends, agent performance stats, and AI vs. human resolution breakdowns
- **Conversation Threads** — per-ticket message history with `customer`, `agent`, `ai`, and `note` (internal) sender types
- **Agent Assignment** — assign tickets to support agents with a dropdown populated from the users table
- **Filtering & Search** — filter tickets by status, priority, sentiment, escalation flag; full-text search; sortable columns

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Model** | Llama 3.2 via Ollama (`POST http://localhost:11434/api/generate`) |
| **Backend** | Python 3 · Flask 3.0 · Flask-SQLAlchemy · Flask-SocketIO · eventlet |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Frontend** | React 19 · TypeScript 6 · Vite 8 |
| **UI** | Tailwind CSS · Radix UI · shadcn/ui-style components · Lucide icons |
| **Data Fetching** | TanStack Query v5 · Axios |
| **State** | Zustand (notifications) |
| **Charts** | Recharts |
| **Real-time** | socket.io-client v4 |

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Ollama** — [install here](https://ollama.com)

### 1 — Pull the model

```bash
ollama pull llama3.2
```

### 2 — Backend setup

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Seed the database (run once):

```powershell
python seed.py
```

### 3 — Frontend setup

```powershell
cd frontend
npm install
```

---

## Running the App

Start all three processes in separate terminals:

```powershell
# Terminal 1 — AI model server (port 11434)
ollama serve

# Terminal 2 — Flask API (port 5000)
cd backend
venv\Scripts\Activate.ps1
python app.py

# Terminal 3 — Vite dev server (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS configuration is needed in development.

---

## AI Pipeline

Every ticket created via `POST /api/tickets` automatically runs this pipeline (defined in `backend/services/ai_service.py`):

```
classify → analyze_sentiment → summarize → suggest_reply → detect_escalation
```

Escalation uses a **hybrid strategy**: rule-based checks (angry sentiment, legal keywords, refund disputes, confidence below threshold) run first, with an LLM call as fallback. If Ollama is unavailable, all functions return deterministic fallbacks so the rest of the app continues to work.

To re-run the pipeline on an existing ticket:

```
POST /api/ai/process-ticket/:id
```

---

## API Reference

### Tickets

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tickets` | Paginated list — filters: `status`, `priority`, `sentiment`, `escalated`, `search`, `sort_by`, `sort_dir` |
| `GET` | `/api/tickets/:id` | Single ticket with full message thread |
| `POST` | `/api/tickets` | Create ticket → runs full AI pipeline |
| `PUT` | `/api/tickets/:id` | Update status / priority / escalation / agent; optionally append a message |
| `DELETE` | `/api/tickets/:id` | Delete ticket and all messages |
| `POST` | `/api/tickets/:id/messages` | Append a message (`customer` / `agent` / `ai` / `note`) |
| `GET` | `/api/users` | All users (for agent assignment dropdown) |

### AI

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/classify` | Classify subject + message → category + confidence |
| `POST` | `/api/ai/summarize` | Summarize ticket content |
| `POST` | `/api/ai/suggest-reply` | Generate a suggested reply |
| `POST` | `/api/ai/analyze-sentiment` | Sentiment analysis of a message |
| `POST` | `/api/ai/process-ticket/:id` | Re-run full AI pipeline on an existing ticket |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/overview` | KPIs: counts, AI%, avg response time, distributions |
| `GET` | `/api/analytics/escalations` | Escalation reasons + 7-day trend |
| `GET` | `/api/analytics/sentiment` | 14-day sentiment trend + overall |
| `GET` | `/api/analytics/performance` | Agent stats, 30-day volume, AI vs human resolution |

---

## Real-time Events

The backend emits Socket.IO events that the React app listens to, triggering TanStack Query cache invalidation:

| Event | Trigger |
|-------|---------|
| `ticket_created` | New ticket POSTed |
| `ticket_updated` | Ticket PUT (status, priority, agent, escalation) |
| `ticket_deleted` | Ticket DELETE |
| `message_added` | New message appended to a ticket |

---

## Type Checking & Build

```powershell
# Type check (frontend)
cd frontend
npx tsc --noEmit

# Production build
npm run build
```