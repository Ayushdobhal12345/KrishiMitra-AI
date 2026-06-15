import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ── System Prompt ──────────────────────────────────────────
export const SYSTEM_PROMPT = `You are Krishi Mitra, an agricultural advisory assistant specifically trained for field supervisors working with Mandakini Organic Produce Collective in the Uttarakhand mountain region of India.

Your scope is strictly limited to:
- Crop diseases, pest identification, and management for Uttarakhand mountain crops (beans, rajma, mandua/finger millet, jhangora/barnyard millet, amaranth, potato, garlic, ginger, apple, pear, stone fruits, leafy vegetables, herbs)
- Organic and integrated pest management approaches suitable for mountain terrain
- Post-harvest handling, storage, and grading for mountain produce
- Soil health, composting, and organic inputs relevant to hill farming
- Irrigation and water management for terraced farms
- Season-specific guidance for Uttarakhand's climate zones (lower hills 700–1500m, mid hills 1500–2200m, upper hills 2200m+)
- Weather-related crop stress identification and response

You must NOT answer questions outside agriculture (politics, general knowledge, coding, personal advice, etc.). If asked, politely redirect to agricultural topics.

Format your responses with clear sections:
1. DIAGNOSIS or ANSWER (brief, practical)
2. IMMEDIATE ACTION (numbered steps, max 5)
3. ORGANIC REMEDIES (prefer locally available inputs — neem, cow urine, wood ash, buttermilk, etc.)
4. WHEN TO ESCALATE (signs that need a licensed extension officer)
5. SEVERITY: one word — Low / Medium / High

Always use simple, practical language. Use crop names in both English and Hindi/Garhwali names where known.

End every response with: "⚠️ Always verify recommendations with your nearest KVK (Krishi Vigyan Kendra) or licensed agricultural extension officer before large-scale application."`

// ── Extract severity from response ────────────────────────
export function extractSeverity(text) {
  const match = text.match(/SEVERITY[:\s]+(\w+)/i)
  if (!match) return null
  const s = match[1].toLowerCase()
  if (s.includes('low')) return 'Low'
  if (s.includes('high')) return 'High'
  return 'Medium'
}

// ── Extract crop name from query ──────────────────────────
export function extractCrop(text) {
  const crops = ['rajma', 'bean', 'potato', 'aloo', 'mandua', 'jhangora', 'amaranth', 'garlic', 'lahsun', 'ginger', 'adrak', 'apple', 'seb', 'pear', 'tomato', 'tamatar', 'wheat', 'gehu', 'maize', 'makka', 'rice', 'chawal', 'mustard', 'sarson']
  const lower = text.toLowerCase()
  return crops.find(c => lower.includes(c)) || null
}

// ── Supported image MIME types for Gemini inline data ─────
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

// ── Supported document MIME types for Gemini file data ────
const SUPPORTED_DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv']

// ── Generate chat response ─────────────────────────────────
// FIX #1: accept attachments param and build multipart message
export async function generateResponse(userMessage, history = [], attachments = []) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    }
  })

  // Build history for multi-turn chat
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))
  })

  // FIX #1: Build multipart message parts array
  // Start with the text message
  const parts = [{ text: userMessage }]

  // Add each attachment as the appropriate Gemini part type
  for (const att of attachments) {
    if (!att?.base64 || !att?.mediaType) continue

    if (SUPPORTED_IMAGE_TYPES.includes(att.mediaType)) {
      // Images: send as inline base64 data — Gemini can visually analyse these
      parts.push({
        inlineData: {
          mimeType: att.mediaType,
          data: att.base64,
        }
      })
    } else if (SUPPORTED_DOC_TYPES.includes(att.mediaType)) {
      // PDFs / plain text / CSV: send as inline data too
      // Gemini 2.5 Flash supports PDF and plain text natively
      parts.push({
        inlineData: {
          mimeType: att.mediaType,
          data: att.base64,
        }
      })
    } else {
      // Unsupported file type: decode base64 and inject as plain text context
      // This handles .doc, .docx, .csv edge cases where content is readable
      try {
        const decoded = Buffer.from(att.base64, 'base64').toString('utf-8').slice(0, 4000)
        parts.push({
          text: `\n[Attached file: ${att.name || 'file'}]\n${decoded}\n`
        })
      } catch {
        // If decode fails (binary file), just mention the filename
        parts.push({
          text: `\n[Attached file: ${att.name || 'unknown'} — content could not be read]\n`
        })
      }
    }
  }

  const result = await chat.sendMessage(parts)
  const response = result.response
  const text = response.text()
  const tokensUsed = response.usageMetadata?.totalTokenCount || 0

  return { text, tokensUsed }
}