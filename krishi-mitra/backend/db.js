import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// ── DB helper functions ────────────────────────────────────

export async function getOrCreateSession(supervisorId) {
  // FIX #2: use maybeSingle() instead of single()
  // single() throws PGRST116 when no row exists, so existing was always null
  const { data: existing, error: fetchErr } = await supabase
    .from('sessions')
    .select('id')
    .eq('supervisor_id', supervisorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) throw new Error(`Session lookup failed: ${fetchErr.message}`)
  if (existing) return existing.id

  // Create new session
  const { data, error } = await supabase
    .from('sessions')
    .insert({ supervisor_id: supervisorId })
    .select('id')
    .single()

  if (error) throw new Error(`Session creation failed: ${error.message}`)
  return data.id
}

export async function createConversation(sessionId, supervisorId, title) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      session_id: sessionId,
      supervisor_id: supervisorId,
      title: title?.slice(0, 100) || 'New conversation',
    })
    .select('id')
    .single()

  if (error) throw new Error(`Conversation creation failed: ${error.message}`)
  return data.id
}

export async function saveMessage(conversationId, role, content, tokensUsed = 0) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, tokens_used: tokensUsed })
    .select('id')
    .single()

  if (error) throw new Error(`Message save failed: ${error.message}`)
  return data.id
}

export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Fetch messages failed: ${error.message}`)
  return data || []
}

export async function getSupervisorConversations(supervisorId, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('supervisor_id', supervisorId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Fetch conversations failed: ${error.message}`)
  return data || []
}

export async function saveFeedback(messageId, conversationId, supervisorId, rating, comment) {
  const { error } = await supabase
    .from('feedback')
    .upsert({
      message_id: messageId,
      conversation_id: conversationId,
      supervisor_id: supervisorId,
      rating,
      comment: comment || null,
    }, { onConflict: 'message_id' })

  if (error) throw new Error(`Feedback save failed: ${error.message}`)
}

export async function logQuery(supervisorId, { cropMentioned, queryLength, responseLength, severity, tokensUsed }) {
  await supabase.from('query_logs').insert({
    supervisor_id: supervisorId,
    crop_mentioned: cropMentioned || null,
    query_length: queryLength,
    response_length: responseLength,
    severity: severity || null,
    tokens_used: tokensUsed || 0,
  })
  // fire and forget — don't throw on analytics failure
}