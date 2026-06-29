import { useState } from 'react'
import { parseResponse, apiFetch, getSupervisorId } from '../utils/api.js'

function SeverityPill({ severity }) {
  if (!severity) return null
  const lower = severity.toLowerCase()
  const cls = lower.includes('low')
    ? 'bg-green-100 text-green-700'
    : lower.includes('high')
    ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700'
  return (
    <span className={`inline-block font-mukta text-[0.72rem] font-bold px-3 py-0.5 rounded-full mb-2 ${cls}`}>
      Severity: {severity}
    </span>
  )
}

function StructuredResponse({ text }) {
  const parsed = parseResponse(text)
  if (parsed.raw) {
    return (
      <div>
        {parsed.severity && <SeverityPill severity={parsed.severity} />}
        <p className="whitespace-pre-wrap text-[0.975rem] leading-[1.75]">{parsed.raw}</p>
        <div className="mt-3 text-[0.76rem] text-yellow-700 italic font-mukta border-t border-yellow-200 pt-2 leading-snug">
          ⚠️ Always verify with your nearest KVK or licensed agricultural extension officer before large-scale application.
        </div>
      </div>
    )
  }
  return (
    <div>
      {parsed.severity && <SeverityPill severity={parsed.severity} />}
      {parsed.sections.map(({ key, label, content }) => (
        <div key={key} className="mt-3">
          <div className="font-mukta text-[0.75rem] font-bold uppercase tracking-widest text-forest-light mb-1">{label}</div>
          <div className="text-[0.975rem] whitespace-pre-wrap leading-[1.75]">{content}</div>
        </div>
      ))}
      <div className="mt-3 text-[0.76rem] text-yellow-700 italic font-mukta border-t border-yellow-200 pt-2 leading-snug">
        ⚠️ Always verify with your nearest KVK or licensed agricultural extension officer before large-scale application.
      </div>
    </div>
  )
}

export default function MessageBubble({ msg }) {
  const [feedback, setFeedback]     = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (msg.role === 'error' || msg.role === 'failed') return null

  async function handleFeedback(rating) {
    if (feedback || submitting || !msg.messageId) return
    setSubmitting(true)
    try {
      const supId = await getSupervisorId()
      await apiFetch('/feedback', {
        method: 'POST',
        body: { messageId: msg.messageId, conversationId: msg.conversationId, supervisorId: supId, rating },
      })
      setFeedback(rating)
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  const isUser    = msg.role === 'user'
  const isSending = isUser && msg.sending

  return (
    <div className={`flex gap-3 animate-msg-in mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5 ${isUser ? 'bg-amber' : 'bg-forest'}`}>
        {isUser ? '👤' : '🌱'}
      </div>

      {/* Bubble */}
      <div
        className={[
          'max-w-[min(78%,620px)] px-4 py-3.5 rounded-[18px] text-base leading-[1.75] font-lora',
          isUser
            ? 'bg-forest text-white rounded-tr-[4px] font-mukta'
            : 'bg-white border border-forest-border rounded-tl-[4px] text-forest shadow-card',
          isSending ? 'opacity-55' : '',
        ].join(' ')}
      >
        {isUser ? (
          <>
            <span>{msg.content}</span>
            {msg.attachments?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {msg.attachments.map(name => (
                  <span key={name} className="text-[0.72rem] bg-white/15 rounded-md px-2 py-0.5 font-mukta">
                    📎 {name}
                  </span>
                ))}
              </div>
            )}
            {isSending && (
              <span className="block mt-1 text-[0.7rem] opacity-75 italic font-mukta">sending…</span>
            )}
          </>
        ) : (
          <StructuredResponse text={msg.content} />
        )}

        {/* Feedback */}
        {!isUser && msg.messageId && (
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-forest-border">
            <span className="font-mukta text-[0.76rem] text-gray-400">Helpful?</span>
            <button
              onClick={() => handleFeedback(1)}
              disabled={!!feedback || submitting}
              className={`border border-forest-border rounded-md px-2.5 py-0.5 text-sm cursor-pointer transition-colors hover:bg-moss disabled:opacity-50 disabled:cursor-default ${feedback === 1 ? 'bg-green-100 border-green-300' : ''}`}
            >👍</button>
            <button
              onClick={() => handleFeedback(-1)}
              disabled={!!feedback || submitting}
              className={`border border-forest-border rounded-md px-2.5 py-0.5 text-sm cursor-pointer transition-colors hover:bg-moss disabled:opacity-50 disabled:cursor-default ${feedback === -1 ? 'bg-red-100 border-red-300' : ''}`}
            >👎</button>
            {feedback && (
              <span className="text-[0.76rem] text-gray-400 font-mukta">
                {feedback === 1 ? 'Thanks!' : 'Feedback recorded'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
