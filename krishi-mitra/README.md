# 🌾 Krishi Mitra – AI-Powered Crop Advisory Chatbot

> Mandakini Organic Produce Collective · Uttarakhand Mountain Farming

A full-stack AI chatbot that gives field supervisors instant, practical crop advisory using Google Gemini AI, with all conversations stored in Supabase PostgreSQL.

---

## Project Structure

```
krishi-mitra/
├── backend/
│   ├── server.js          # Fastify API server
│   ├── gemini.js          # Gemini AI integration + system prompt
│   ├── db.js              # Supabase client + DB helper functions
│   ├── schema.sql         # PostgreSQL schema (run in Supabase SQL Editor)
│   ├── .env.example       # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx / .module.css
│   │   │   ├── MessageBubble.jsx / .module.css
│   │   │   └── Sidebar.jsx / .module.css
│   │   ├── pages/
│   │   │   └── Chat.jsx / .module.css
│   │   ├── utils/
│   │   │   └── api.js     # API helper + response parser
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── package.json           # Root scripts
└── README.md
```

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite + CSS Modules |
| Backend  | Node.js + Fastify v5 |
| AI       | Google Gemini 1.5 Flash API |
| Database | PostgreSQL via Supabase |

---

## Setup Instructions

### Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Open **SQL Editor** in the Supabase dashboard
3. Copy and paste the entire contents of `backend/schema.sql`
4. Click **Run** — this creates all tables and indexes
5. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://xyz.supabase.co`)
   - **Service Role Key** (under "Project API keys" — use the secret service role key)

### Step 2 — Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a new API key (free tier available)

### Step 3 — Backend Setup

```powershell
cd backend

# Copy and fill the env file
copy .env.example .env
# Edit .env with your keys (see below)

npm install
npm run dev     # development with auto-reload
# OR
npm start       # production
```

**`backend/.env`** contents:
```
GEMINI_API_KEY=AIza...your_key...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your_service_role_key...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Step 4 — Frontend Setup

```powershell
cd frontend

# Copy env file
copy .env.example .env
# .env already has: VITE_API_URL=http://localhost:3001

npm install
npm run dev     # → http://localhost:5173
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/health` | Health check |
| POST | `/chat` | Send message, get AI response |
| GET  | `/conversations/:supervisorId` | List past conversations |
| GET  | `/conversations/:supervisorId/:conversationId` | Load conversation messages |
| POST | `/feedback` | Submit thumbs up/down on a response |

### POST `/chat` body
```json
{
  "message": "My rajma leaves have yellow spots",
  "supervisorId": "sup_abc123",
  "conversationId": null
}
```

### POST `/feedback` body
```json
{
  "messageId": "uuid",
  "conversationId": "uuid",
  "supervisorId": "sup_abc123",
  "rating": 1
}
```

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `sessions` | Tracks browser sessions per supervisor |
| `conversations` | Groups messages into conversations |
| `messages` | Stores all user + AI messages |
| `feedback` | Thumbs up/down ratings per AI message |
| `query_logs` | Analytics: crop mentioned, severity, tokens used |

---

## Deploy

### Backend → Render.com

1. Push `backend/` to GitHub
2. New Web Service on render.com
3. Build: `npm install` | Start: `node server.js`
4. Add all 5 environment variables from `.env`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import on vercel.com
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
4. Build: `npm run build` | Output: `dist`

---

## Features

- 💬 Multi-turn conversations with full history
- 🗄️ All conversations saved to Supabase PostgreSQL
- 📋 Sidebar showing past conversation history
- 👍 Thumbs up/down feedback on every AI response
- 🌿 Structured responses: Diagnosis → Action → Remedies → Escalate → Severity
- 🔴 Severity pills (Low / Medium / High)
- ⚠️ Mandatory disclaimer on every AI response
- 📱 Mobile-responsive with slide-in sidebar
- 🔒 No user login needed — browser fingerprint ID
