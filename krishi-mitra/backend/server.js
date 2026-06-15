import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
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

const fastify = Fastify({ logger: true })

// ── CORS ───────────────────────────────────────────────────
await fastify.register(cors, {
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})

// ── Empty body parser (Fastify v5) ─────────────────────────
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  if (!body || body === '') return done(null, {})
  try { done(null, JSON.parse(body)) } catch (e) { done(e) }
})

// ── Routes ─────────────────────────────────────────────────

// Health check
fastify.get('/health', async () => ({
  status: 'ok',
  service: 'Krishi Mitra API',
  timestamp: new Date().toISOString(),
}))

// POST /chat – send a message and get AI response
fastify.post('/chat', async (request, reply) => {
  // FIX #1: also destructure attachments from body
  const { message, supervisorId, conversationId, attachments } = request.body

  if (!message?.trim()) return reply.status(400).send({ error: 'message is required' })
  if (!supervisorId?.trim()) return reply.status(400).send({ error: 'supervisorId is required' })

  try {
    // Get or create session
    const sessionId = await getOrCreateSession(supervisorId)

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      convId = await createConversation(sessionId, supervisorId, message.trim())
    }

    // Fetch conversation history for context
    const history = await getConversationMessages(convId)

    // Save user message
    await saveMessage(convId, 'user', message.trim())

    // FIX #1: pass attachments through to generateResponse
    const { text, tokensUsed } = await generateResponse(message.trim(), history, attachments || [])

    // Save AI response
    const messageId = await saveMessage(convId, 'assistant', text, tokensUsed)

    // Log query analytics (fire and forget)
    logQuery(supervisorId, {
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

// GET /conversations/:supervisorId – get past conversations
fastify.get('/conversations/:supervisorId', async (request, reply) => {
  const { supervisorId } = request.params
  if (!supervisorId) return reply.status(400).send({ error: 'supervisorId is required' })

  try {
    const conversations = await getSupervisorConversations(supervisorId)
    return reply.send({ conversations })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// GET /conversations/:supervisorId/:conversationId – get messages for a conversation
fastify.get('/conversations/:supervisorId/:conversationId', async (request, reply) => {
  const { conversationId } = request.params
  try {
    const messages = await getConversationMessages(conversationId)
    return reply.send({ messages })
  } catch (err) {
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// POST /feedback – submit feedback on a response
fastify.post('/feedback', async (request, reply) => {
  const { messageId, conversationId, supervisorId, rating, comment } = request.body

  if (!messageId || !supervisorId || !rating) {
    return reply.status(400).send({ error: 'messageId, supervisorId, and rating are required' })
  }
  if (rating !== 1 && rating !== -1) {
    return reply.status(400).send({ error: 'rating must be 1 (helpful) or -1 (not helpful)' })
  }

  try {
    await saveFeedback(messageId, conversationId, supervisorId, rating, comment)
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