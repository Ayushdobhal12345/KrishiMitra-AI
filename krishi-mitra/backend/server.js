import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createClient } from '@supabase/supabase-js'
import {
  getOrCreateSession,
  createConversation,
  saveMessage,
  getConversationMessages,
  getSupervisorConversations,
  saveFeedback,
  logQuery,
} from './db.js'
import { generateResponse, extractSeverity, extractCrop } from './gemini.js'

// ── BUG FIX: raise bodyLimit to 20MB for base64 image/PDF uploads ──
const fastify = Fastify({ logger: true, bodyLimit: 20 * 1024 * 1024 })

// Supabase client for JWT verification (uses anon key — verifies user JWTs)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

// ── CORS ───────────────────────────────────────────────────
await fastify.register(cors, {
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})

// ── Body parser (Fastify v5) ────────────────────────────────
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  if (!body || body === '') return done(null, {})
  try { done(null, JSON.parse(body)) } catch (e) { done(e) }
})

// ── Auth middleware ─────────────────────────────────────────
async function verifyToken(request) {
  const authHeader = request.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return null
  return user
}

async function requireAuth(request, reply) {
  const user = await verifyToken(request)
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized — please log in' })
  }
  request.user = user
  return user
}

// ── Routes ─────────────────────────────────────────────────

// Health check (public)
fastify.get('/health', async () => ({
  status: 'ok',
  service: 'Krishi Mitra API',
  timestamp: new Date().toISOString(),
}))

// POST /chat – send a message and get AI response (protected)
fastify.post('/chat', async (request, reply) => {
  const user = await requireAuth(request, reply)
  if (!user) return

  const { message, supervisorId, conversationId, attachments } = request.body

  if (!message?.trim()) return reply.status(400).send({ error: 'message is required' })

  const resolvedSupervisorId = user.id

  try {
    const sessionId = await getOrCreateSession(resolvedSupervisorId)

    let convId = conversationId
    if (!convId) {
      convId = await createConversation(sessionId, resolvedSupervisorId, message.trim())
    }

    const history = await getConversationMessages(convId)
    await saveMessage(convId, 'user', message.trim())

    // ── BUG FIX: log attachment count so you can confirm they arrive ──
    if (attachments?.length) {
      fastify.log.info(`📎 Received ${attachments.length} attachment(s) with types: ${attachments.map(a => a.mediaType).join(', ')}`)
    }

    const { text, tokensUsed } = await generateResponse(message.trim(), history, attachments || [])
    const messageId = await saveMessage(convId, 'assistant', text, tokensUsed)

    logQuery(resolvedSupervisorId, {
      cropMentioned: extractCrop(message),
      queryLength: message.length,
      responseLength: text.length,
      severity: extractSeverity(text),
      tokensUsed,
    })

    return reply.send({
      conversationId: convId,
      messageId,
      response: text,
      tokensUsed,
    })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message || 'Internal server error' })
  }
})

// GET /conversations/:supervisorId – get past conversations (protected)
fastify.get('/conversations/:supervisorId', async (request, reply) => {
  const user = await requireAuth(request, reply)
  if (!user) return

  const requestedId = request.params.supervisorId
  if (requestedId !== user.id) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  try {
    const limit  = Math.min(parseInt(request.query.limit  || '20'), 50)
    const offset = parseInt(request.query.offset || '0')
    const conversations = await getSupervisorConversations(user.id, limit, offset)
    return reply.send({ conversations })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// GET /conversations/:supervisorId/:conversationId – get messages (protected)
fastify.get('/conversations/:supervisorId/:conversationId', async (request, reply) => {
  const user = await requireAuth(request, reply)
  if (!user) return

  const requestedId = request.params.supervisorId
  if (requestedId !== user.id) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { conversationId } = request.params
  try {
    const messages = await getConversationMessages(conversationId)
    return reply.send({ messages })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// POST /feedback – submit feedback (protected)
fastify.post('/feedback', async (request, reply) => {
  const user = await requireAuth(request, reply)
  if (!user) return

  const { messageId, conversationId, rating, comment } = request.body

  if (!messageId || !rating) {
    return reply.status(400).send({ error: 'messageId and rating are required' })
  }
  if (rating !== 1 && rating !== -1) {
    return reply.status(400).send({ error: 'rating must be 1 or -1' })
  }

  try {
    await saveFeedback(messageId, conversationId, user.id, rating, comment)
    return reply.send({ success: true })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// ── Start ──────────────────────────────────────────────────
try {
  const port = parseInt(process.env.PORT || '3001')
  await fastify.listen({ port, host: '0.0.0.0' })
  console.log(`🌾 Krishi Mitra API running on http://localhost:${port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
