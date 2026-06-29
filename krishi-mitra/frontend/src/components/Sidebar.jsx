import { useEffect, useState } from 'react'
import { apiFetch, getSupervisorId } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const PAGE_SIZE = 10

export default function Sidebar({ currentConvId, onSelectConversation, onNewChat, open, onClose }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading]             = useState(true)
  const [page, setPage]                   = useState(0)
  const [hasMore, setHasMore]             = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setPage(0)
    setConversations([])
    loadPage(0, true)
  }, [currentConvId, user])

  async function loadPage(pageNum, reset = false) {
    setLoading(true)
    try {
      const supId = await getSupervisorId()
      // fetch one extra to know if there's a next page
      const d = await apiFetch(`/conversations/${supId}?limit=${PAGE_SIZE + 1}&offset=${pageNum * PAGE_SIZE}`)
      const rows = d.conversations || []
      const hasNext = rows.length > PAGE_SIZE
      const slice = rows.slice(0, PAGE_SIZE)

      setConversations(reset ? slice : prev => [...prev, ...slice])
      setHasMore(hasNext)
      setPage(pageNum)
    } catch {
      setConversations(prev => reset ? [] : prev)
    } finally {
      setLoading(false)
    }
  }





  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-[99] md:hidden" onClick={onClose} />
      )}

      <aside
        className={[
          'w-[280px] bg-white border-r border-forest-border flex flex-col flex-shrink-0 h-full overflow-hidden',
          'fixed left-0 top-0 bottom-0 z-[100] transition-transform duration-[250ms] ease-in-out shadow-xl',
          'md:static md:translate-x-0 md:shadow-none md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-forest-border">
          <span className="text-xs font-semibold text-forest tracking-wide font-mukta">💬 Past Chats</span>
          <button
            className="bg-forest text-amber-light border-none rounded-lg px-3 py-1 text-xs font-semibold font-mukta cursor-pointer hover:bg-forest-light transition-colors"
            onClick={() => { onNewChat(); onClose(); }}
          >
            + New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && conversations.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-5 text-center font-lora italic">Loading…</p>
          )}
          {!loading && conversations.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-5 text-center font-lora italic">No past conversations yet.</p>
          )}

          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { onSelectConversation(conv.id); onClose(); }}
              className={[
                'w-full bg-transparent border-none px-4 py-2.5 text-left cursor-pointer flex flex-col gap-0.5',
                'border-l-[3px] transition-colors duration-100 font-mukta',
                conv.id === currentConvId
                  ? 'bg-moss border-l-forest-light'
                  : 'border-l-transparent hover:bg-moss',
              ].join(' ')}
            >
              <span className="text-xs font-medium text-forest truncate block">{conv.title || 'Untitled'}</span>
              <span className="text-[0.68rem] text-gray-400">
                {new Date(conv.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </button>
          ))}

          {/* Load more */}
          {hasMore && !loading && (
            <button
              onClick={() => loadPage(page + 1)}
              className="w-full text-xs font-mukta text-forest/60 hover:text-forest py-3 border-none bg-transparent cursor-pointer hover:bg-moss transition-colors"
            >
              Load more ↓
            </button>
          )}

          {loading && conversations.length > 0 && (
            <p className="text-xs text-gray-400 px-4 py-2 text-center font-lora italic">Loading…</p>
          )}
        </div>

        {/* Pagination footer — shows count */}
        {conversations.length > 0 && (
          <div className="px-4 py-2 border-t border-forest-border flex items-center justify-between">
            <span className="text-[0.65rem] font-mukta text-gray-400">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </span>
            {hasMore && (
              <span className="text-[0.65rem] font-mukta text-gray-400">more available ↓</span>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
