import { useState, useRef, useEffect } from 'react'
import { apiFetch, getSupervisorId } from '../utils/api.js'
import MessageBubble from '../components/MessageBubble.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'

const QUICK_PROMPTS = [
  'My rajma leaves have yellow spots',
  'Potato crop showing black rot',
  'How to store mandua after harvest?',
  'Aphids on my garlic crop',
  'Late blight symptoms on tomato',
  'Best organic fertilizer for apple orchard',
]

const MAX_AUTO_RETRIES = 1
const ACCEPTED_TYPES   = '.pdf,.txt,.csv,.doc,.docx,.jpg,.jpeg,.png'

export default function Chat() {
  const [messages, setMessages]             = useState([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isOnline, setIsOnline]             = useState(navigator.onLine)
  const [exportingPdf, setExportingPdf]     = useState(false)
  const [attachedFiles, setAttachedFiles]   = useState([])

  const chatEndRef   = useRef(null)
  const textareaRef  = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const up   = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const base64 = ev.target.result.split(',')[1]
        setAttachedFiles(prev => [...prev, { name: file.name, base64, mediaType: file.type, size: file.size }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeFile(name) {
    setAttachedFiles(prev => prev.filter(f => f.name !== name))
  }

  async function loadConversation(convId) {
    setLoadingHistory(true)
    setMessages([])
    setConversationId(convId)
    try {
      const data = await apiFetch(`/conversations/${getSupervisorId()}/${convId}`)
      setMessages((data.messages || []).map(m => ({
        role: m.role, content: m.content, messageId: m.id, conversationId: convId,
      })))
    } catch {
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  function newChat() { setMessages([]); setConversationId(null); setAttachedFiles([]) }

  async function _doSend(query, files = [], skipAddUserMsg = false, attempt = 0) {
    if (!query || loading) return

    if (!skipAddUserMsg) {
      setMessages(prev => [...prev, {
        role: 'user', content: query, sending: true,
        attachments: files.map(f => f.name),
      }])
    } else {
      setMessages(prev => prev.map((m, i) =>
        i === [...prev].map(x => x.role).lastIndexOf('user') ? { ...m, sending: true } : m
      ))
    }
    setLoading(true)

    try {
      let fullMessage = query
      if (files.length > 0) {
        const fileContext = files.map(f => {
          if (f.mediaType.startsWith('image/')) return null
          return `[Attached file: ${f.name}]\n(Contents available for analysis)`
        }).filter(Boolean).join('\n\n')
        if (fileContext) fullMessage = `${query}\n\n${fileContext}`
      }

      const contentParts = []
      files.forEach(f => {
        if (f.mediaType.startsWith('image/')) {
          contentParts.push({ type: 'image', mediaType: f.mediaType, base64: f.base64, name: f.name })
        } else {
          contentParts.push({ type: 'file', mediaType: f.mediaType, base64: f.base64, name: f.name })
        }
      })

      const data = await apiFetch('/chat', {
        method: 'POST',
        body: {
          message: fullMessage,
          supervisorId: getSupervisorId(),
          conversationId: conversationId || undefined,
          attachments: contentParts.length > 0 ? contentParts : undefined,
        },
      })

      if (!conversationId) setConversationId(data.conversationId)

      setMessages(prev => {
        const confirmed = prev.map(m => m.sending ? { ...m, sending: false } : m)
        return [
          ...confirmed.filter(m => m.role !== 'failed'),
          { role: 'assistant', content: data.response, messageId: data.messageId, conversationId: data.conversationId },
        ]
      })
    } catch {
      if (attempt < MAX_AUTO_RETRIES) {
        setLoading(false)
        await new Promise(r => setTimeout(r, 1200))
        return _doSend(query, files, true, attempt + 1)
      }
      setMessages(prev => {
        const updated = prev.map(m => m.sending ? { ...m, sending: false } : m)
        return [...updated.filter(m => m.role !== 'failed'), { role: 'failed', retryQuery: query, retryFiles: files }]
      })
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(text) {
    const query = (text || input).trim()
    if (!query || loading) return
    const files = [...attachedFiles]
    setInput('')
    setAttachedFiles([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await _doSend(query, files, false)
  }

  async function retryLast() {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    const failed   = messages.find(m => m.role === 'failed')
    if (!lastUser) return
    setMessages(prev => prev.filter(m => m.role !== 'failed'))
    await _doSend(lastUser.content, failed?.retryFiles || [], true)
  }

  async function retryQuery(query) {
    setMessages(prev => prev.filter(m => m.role !== 'failed'))
    await _doSend(query, [], true)
  }

  function exportPdf() {
    if (!hasChatContent || exportingPdf) return
    setExportingPdf(true)
    const rows = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => {
        const who  = m.role === 'user' ? '👤 Field Supervisor' : '🌱 Krishi Mitra'
        const bg   = m.role === 'user' ? '#1a3a2a' : '#ffffff'
        const clr  = m.role === 'user' ? '#ffffff' : '#1a3a2a'
        const body = m.content.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')
        return `<div style="margin:10px 0;padding:12px 16px;background:${bg};color:${clr};border-radius:12px;font-size:13px;line-height:1.6;border:1px solid #d1d5db;">
          <div style="font-weight:700;font-size:11px;margin-bottom:5px;opacity:.7;">${who}</div>
          <div>${body}</div></div>`
      }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Krishi Mitra — Chat Export</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:32px 24px;color:#1a3a2a}
      h1{font-size:22px;margin-bottom:4px}.sub{font-size:12px;color:#6b7280;margin-bottom:24px}
      .disc{font-size:11px;color:#b45309;border-top:1px solid #fde68a;padding-top:12px;margin-top:24px}
      @media print{body{padding:16px}}</style></head>
      <body><h1>🌱 Krishi Mitra</h1>
      <div class="sub">Mandakini Organic Produce Collective · Uttarakhand &nbsp;|&nbsp; ${new Date().toLocaleString('en-IN')}</div>
      ${rows}<div class="disc">⚠️ AI-generated guidance only. Always verify with a licensed Agricultural Extension Officer or nearest KVK before applying at scale.</div>
      </body></html>`
    const w = window.open('', '_blank')
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => { w.print(); setExportingPdf(false) }, 400)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }
  function handleInputChange(e) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const hasFailedMarker  = messages.some(m => m.role === 'failed')
  const lastUserMsg      = [...messages].reverse().find(m => m.role === 'user')
  const lastUserIdx      = messages.map(m => m.role).lastIndexOf('user')
  const hasReplyAfter    = messages.slice(lastUserIdx + 1).some(m => m.role === 'assistant')
  const showHistoryRetry = !loading && messages.length > 0 && lastUserMsg && !hasReplyAfter && !hasFailedMarker
  const hasChatContent   = messages.some(m => m.role === 'user' || m.role === 'assistant')

  return (
    <div className="h-screen flex flex-col bg-parchment">
      <Navbar />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-gray-800 text-gray-100 py-1.5 px-4 text-xs font-mukta flex items-center justify-center gap-2">
          <span>📶</span> You're offline — messages will retry when your connection returns.
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-b-2 border-yellow-200 px-6 py-2 flex items-start gap-2 text-xs text-yellow-800 leading-snug flex-shrink-0">
        <span>⚠️</span>
        <span><strong>Advisory Disclaimer:</strong> AI-generated guidance only. Always verify with a licensed Agricultural Extension Officer or nearest KVK before applying at scale.</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentConvId={conversationId}
          onSelectConversation={loadConversation}
          onNewChat={newChat}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden items-center">

          {/* Toolbar */}
          <div className="w-full max-w-[800px] flex items-center gap-2 px-4 pt-1.5">
            <button
              className="md:hidden bg-transparent border-none font-mukta text-sm text-forest cursor-pointer py-2"
              onClick={() => setSidebarOpen(true)}
            >
              ☰ History
            </button>
            {hasChatContent && (
              <button
                onClick={exportPdf}
                disabled={exportingPdf}
                className="ml-auto border border-gray-300 rounded-lg px-3 py-1 text-xs font-mukta text-gray-600 cursor-pointer flex items-center gap-1 disabled:opacity-60 hover:bg-gray-50 transition-colors"
              >
                📄 {exportingPdf ? 'Preparing…' : 'Export PDF'}
              </button>
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto w-full py-6 flex flex-col items-center gap-0 scroll-smooth">
            {loadingHistory && (
              <p className="text-center py-8 text-gray-400 text-sm font-lora italic">Loading conversation…</p>
            )}

            {messages.length === 0 && !loadingHistory && (
              <div className="w-full max-w-[800px] px-4">
                <div className="bg-white border-2 border-forest-border rounded-2xl p-7 animate-fade-in">
                  <div className="text-xl font-bold text-forest mb-2 font-mukta">🙏 Namaste, Field Supervisor</div>
                  <p className="text-base text-gray-500 leading-relaxed font-lora">
                    I'm Krishi Mitra, your crop advisory assistant for Uttarakhand's mountain farms.
                    Ask me about crop diseases, pests, post-harvest handling, organic inputs, or
                    seasonal guidance for rajma, mandua, jhangora, potato, apple, and other hill crops.
                    You can also attach photos or documents for analysis.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p)}
                        className="bg-moss border border-green-200 rounded-full px-3.5 py-1.5 text-sm text-forest-mid font-mukta font-medium cursor-pointer hover:bg-forest-light hover:text-white hover:border-forest-light transition-all duration-150"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.role === 'failed' ? (
                <div key={`failed-${i}`} className="w-full max-w-[800px] px-4">
                  <RetryBanner onRetry={retryLast} loading={loading} />
                </div>
              ) : (
                <div key={i} className="w-full max-w-[800px] px-4">
                  <MessageBubble msg={msg} />
                </div>
              )
            )}

            {showHistoryRetry && (
              <div className="w-full max-w-[800px] px-4">
                <RetryBanner onRetry={() => retryQuery(lastUserMsg.content)} loading={loading} isHistory />
              </div>
            )}

            {loading && (
              <div className="w-full max-w-[800px] px-4 flex gap-2.5 items-end pb-2">
                <div className="w-[34px] h-[34px] rounded-full bg-forest flex items-center justify-center text-base flex-shrink-0">🌱</div>
                <div className="bg-white border border-forest-border rounded-[18px] rounded-tl-[4px] px-4 py-3 flex items-center gap-1.5 shadow-card">
                  <span className="w-2 h-2 rounded-full bg-forest-light inline-block dot-bounce" />
                  <span className="w-2 h-2 rounded-full bg-forest-light inline-block dot-bounce-2" />
                  <span className="w-2 h-2 rounded-full bg-forest-light inline-block dot-bounce-3" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="w-full bg-parchment px-4 pt-3 pb-4 flex-shrink-0 flex flex-col items-center">
            <div className="w-full max-w-[800px]">

              {/* File previews */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {attachedFiles.map(f => (
                    <div key={f.name} className="flex items-center gap-1.5 bg-moss border border-green-200 rounded-lg px-2.5 py-1 text-xs font-mukta text-forest-mid max-w-[220px]">
                      <span>📎</span>
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => removeFile(f.name)} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-red-500 text-sm leading-none p-0 flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input box */}
              <div className="w-full bg-white border-2 border-green-200 focus-within:border-forest-light rounded-2xl px-3.5 py-3 flex items-end gap-2 shadow-card transition-colors duration-150">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title="Attach file"
                  className="bg-transparent border-none cursor-pointer text-xl text-gray-400 hover:text-forest-mid transition-colors p-0.5 flex-shrink-0 leading-none disabled:opacity-50"
                >
                  📎
                </button>
                <textarea
                  ref={textareaRef}
                  placeholder="Describe your crop issue or attach a file…"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none font-mukta text-base text-forest resize-none min-h-6 max-h-40 leading-snug placeholder:text-gray-400 disabled:opacity-60"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                  title="Send (Enter)"
                  className="w-10 h-10 bg-forest hover:bg-forest-light text-amber-light rounded-xl flex items-center justify-center text-base cursor-pointer transition-all duration-150 hover:scale-105 disabled:opacity-45 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0"
                >
                  ➤
                </button>
              </div>

              <p className="text-[0.75rem] text-gray-400 text-center mt-1.5 font-mukta">
                Press Enter to send · Shift+Enter for new line · 📎 attach PDF, image, or CSV
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function RetryBanner({ onRetry, loading, isHistory }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 my-1 rounded-xl bg-yellow-50 border border-yellow-200 max-w-[480px] text-sm font-mukta text-yellow-800">
      <span>🔄</span>
      <span className="flex-1">
        {isHistory ? "This query didn't get a response. Tap to try again." : "Couldn't reach the server right now."}
      </span>
      <button
        onClick={onRetry}
        disabled={loading}
        className="bg-yellow-400 text-white border-none rounded-lg px-3.5 py-1.5 font-semibold text-xs cursor-pointer disabled:opacity-60 disabled:cursor-default hover:bg-yellow-500 transition-colors"
      >
        {loading ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  )
}
