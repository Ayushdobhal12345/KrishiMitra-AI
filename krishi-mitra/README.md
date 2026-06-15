# Note
To start the frontend
go to cd krishi-mitra
cd frontend
npm install
npm run dev

**To test login:** use any email + password (e.g. `ayush@gmail.com` / `1234`) — authentication is a placeholder and will be connected to Supabase in a future release.


# 🌾 Krishi Mitra – AI-Powered Crop Advisory Chatbot

> Mandakini Organic Produce Collective · Uttarakhand Mountain Farming

A full-stack AI chatbot that gives field supervisors instant, practical crop advisory using Google Gemini AI, with all conversations stored in Supabase PostgreSQL.



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
│   │   │   ├── Navbar.jsx          # Top navigation bar with page links
│   │   │   ├── Footer.jsx          # Site footer
│   │   │   ├── Card.jsx            # Reusable feature card
│   │   │   ├── MessageBubble.jsx   # Chat message renderer
│   │   │   └── Sidebar.jsx         # Conversation history drawer
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with hero + card grid
│   │   │   ├── Chat.jsx            # Main AI chat interface
│   │   │   ├── About.jsx           # About page
│   │   │   ├── Dashboard.jsx       # Supervisor dashboard (coming soon)
│   │   │   └── Login.jsx           # Login form with validation
│   │   ├── utils/
│   │   │   └── api.js              # API helper + response parser
│   │   ├── App.jsx                 # Route definitions
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind directives + custom utilities
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env
│   └── package.json
├── .gitignore
└── README.md
```

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Hero section + feature cards grid |
| `/login` | Login | Email + password form, redirects to chat |
| `/chat` | Chat | AI advisory chat interface |
| `/about` | About | Project and mission info |
| `/dashboard` | Dashboard | Supervisor overview (in development) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Routing | React Router DOM v6 |
| Backend | Node.js + Fastify v5 |
| AI | Google Gemini 1.5 Flash API |
| Database | PostgreSQL via Supabase |

---

## Setup Instructions

### Step 1 — Frontend

```bash
cd krishi-mitra/frontend
npm install
npm run dev     # → http://localhost:5173
```

### Step 2 — Supabase Database

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Open **SQL Editor** in the Supabase dashboard
3. Copy and paste the entire contents of `backend/schema.sql`
4. Click **Run** — this creates all tables and indexes
5. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://xyz.supabase.co`)
   - **Service Role Key** (under "Project API keys")

### Step 3 — Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a new API key (free tier available)

### Step 4 — Backend

```bash
cd krishi-mitra/backend

# Copy and fill the env file
cp .env.example .env   # Windows: copy .env.example .env
# Edit .env with your keys

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

- 🏠 Multi-page app with Home, Chat, About, Dashboard, Login routes
- 🎨 Fully styled with Tailwind CSS — no CSS Modules
- 🔐 Login form with validation (Supabase auth coming soon)
- 💬 Multi-turn conversations with full history
- 🗄️ All conversations saved to Supabase PostgreSQL
- 📋 Sidebar showing past conversation history
- 👍 Thumbs up/down feedback on every AI response
- 🌿 Structured responses: Diagnosis → Action → Remedies → Escalate → Severity
- 🔴 Severity pills (Low / Medium / High)
- ⚠️ Mandatory disclaimer on every AI response
- 📱 Mobile-responsive with slide-in sidebar
- 📄 Export chat as PDF