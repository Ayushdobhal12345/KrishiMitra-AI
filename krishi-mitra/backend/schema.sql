-- ============================================================
-- Krishi Mitra – Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Sessions table ─────────────────────────────────────────
-- Each supervisor gets a session; tracked by browser-generated ID
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id TEXT        NOT NULL,        -- browser-generated fingerprint
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Conversations table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID        REFERENCES sessions(id) ON DELETE CASCADE,
  supervisor_id TEXT        NOT NULL,
  title         TEXT,                         -- first user message (truncated)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
  content         TEXT        NOT NULL,
  tokens_used     INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Feedback table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id      UUID        REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  supervisor_id   TEXT        NOT NULL,
  rating          INTEGER     CHECK (rating IN (1, -1)),   -- 1 = helpful, -1 = not helpful
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Query log table ────────────────────────────────────────
-- Lightweight analytics: track query topics without storing full content
CREATE TABLE IF NOT EXISTS query_logs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id   TEXT        NOT NULL,
  crop_mentioned  TEXT,                        -- extracted crop name if any
  query_length    INTEGER,
  response_length INTEGER,
  severity        TEXT,                        -- Low / Medium / High from AI response
  tokens_used     INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_supervisor ON conversations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_supervisor ON query_logs(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created ON query_logs(created_at DESC);

-- ── Row Level Security ─────────────────────────────────────
-- Since backend uses service role key, RLS is informational
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;

-- ── Updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Sample verification query ──────────────────────────────
-- Run this after setup to verify tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
