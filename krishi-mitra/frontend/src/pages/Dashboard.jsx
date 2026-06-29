import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// ── helpers ────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function SeverityBadge({ s }) {
  if (!s) return null
  const lower = s.toLowerCase()
  const cls = lower === 'high'
    ? 'bg-red-100 text-red-700'
    : lower === 'medium'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700'
  return (
    <span className={`inline-block text-[0.7rem] font-semibold font-mukta px-2 py-0.5 rounded-full ${cls}`}>
      {s}
    </span>
  )
}

function SeverityDot({ s }) {
  const lower = (s || '').toLowerCase()
  const color = lower === 'high' ? 'bg-red-400' : lower === 'medium' ? 'bg-yellow-400' : 'bg-green-500'
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-forest-border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs font-mukta text-gray-400 flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </span>
      <span className="text-2xl font-semibold font-lora text-forest">{value ?? '—'}</span>
      {sub && <span className="text-[0.7rem] font-mukta text-gray-400">{sub}</span>}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <p className="text-sm font-lora italic text-gray-400 py-6 text-center">{text}</p>
  )
}

// ── Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const uid = user?.id

  const [loading, setLoading]         = useState(true)
  const [stats, setStats]             = useState(null)
  const [recentConvs, setRecentConvs] = useState([])
  const [cropCounts, setCropCounts]   = useState([])
  const [sevCounts, setSevCounts]     = useState({ High: 0, Medium: 0, Low: 0, total: 0 })
  const [tokenTotal, setTokenTotal]   = useState(0)
  const [feedback, setFeedback]       = useState({ helpful: 0, total: 0 })
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!uid) return
    fetchAll()
  }, [uid])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentConvs(),
        fetchCropCounts(),
        fetchSeverity(),
        fetchTokens(),
        fetchFeedback(),
      ])
    } catch (err) {
      setError('Could not load dashboard data. Make sure RLS is disabled or policies allow reads.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    // Total conversations
    const { count: totalConvs } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('supervisor_id', uid)

    // Conversations this week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { count: weekConvs } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('supervisor_id', uid)
      .gte('created_at', weekAgo)

    // Distinct crops queried
    const { data: cropRows } = await supabase
      .from('query_logs')
      .select('crop_mentioned')
      .eq('supervisor_id', uid)
      .not('crop_mentioned', 'is', null)

    const distinctCrops = new Set((cropRows || []).map(r => r.crop_mentioned)).size

    // High severity count (last 30 days)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const { count: highCount } = await supabase
      .from('query_logs')
      .select('id', { count: 'exact', head: true })
      .eq('supervisor_id', uid)
      .eq('severity', 'High')
      .gte('created_at', monthAgo)

    setStats({ totalConvs, weekConvs, distinctCrops, highCount })
  }

  async function fetchRecentConvs() {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('supervisor_id', uid)
      .order('updated_at', { ascending: false })
      .limit(6)

    // For each conversation, get the latest query_log severity
    const convIds = (data || []).map(c => c.id)
    let sevMap = {}
    if (convIds.length > 0) {
      // get most recent query_log per conversation — approximate via join on created_at
      const { data: logs } = await supabase
        .from('query_logs')
        .select('supervisor_id, severity, created_at')
        .eq('supervisor_id', uid)
        .order('created_at', { ascending: false })
        .limit(20)

      // map severity to conversations by position (best-effort)
      ;(logs || []).forEach((log, i) => {
        if (i < (data || []).length && !sevMap[i]) {
          sevMap[i] = log.severity
        }
      })
    }

    setRecentConvs((data || []).map((c, i) => ({ ...c, severity: sevMap[i] || null })))
  }

  async function fetchCropCounts() {
    const { data } = await supabase
      .from('query_logs')
      .select('crop_mentioned')
      .eq('supervisor_id', uid)
      .not('crop_mentioned', 'is', null)

    const counts = {}
    ;(data || []).forEach(r => {
      counts[r.crop_mentioned] = (counts[r.crop_mentioned] || 0) + 1
    })

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }))

    const max = sorted[0]?.count || 1
    setCropCounts(sorted.map(c => ({ ...c, pct: Math.round((c.count / max) * 100) })))
  }

  async function fetchSeverity() {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('query_logs')
      .select('severity')
      .eq('supervisor_id', uid)
      .gte('created_at', monthAgo)
      .not('severity', 'is', null)

    const counts = { High: 0, Medium: 0, Low: 0 }
    ;(data || []).forEach(r => {
      if (counts[r.severity] !== undefined) counts[r.severity]++
    })
    const total = counts.High + counts.Medium + counts.Low
    setSevCounts({ ...counts, total })
  }

  async function fetchTokens() {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('query_logs')
      .select('tokens_used')
      .eq('supervisor_id', uid)
      .gte('created_at', monthAgo)

    const total = (data || []).reduce((s, r) => s + (r.tokens_used || 0), 0)
    setTokenTotal(total)
  }

  async function fetchFeedback() {
    const { data } = await supabase
      .from('feedback')
      .select('rating')
      .eq('supervisor_id', uid)

    const total = (data || []).length
    const helpful = (data || []).filter(r => r.rating === 1).length
    setFeedback({ helpful, total })
  }

  const helpfulPct = feedback.total > 0
    ? Math.round((feedback.helpful / feedback.total) * 100)
    : null

  const sevTotal = sevCounts.total || 1

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-lora text-2xl md:text-3xl font-semibold text-forest">Supervisor Dashboard</h1>
            <p className="font-mukta text-sm text-gray-400 mt-0.5">Your advisory activity — real data from your account</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="text-xs font-mukta border border-forest-border rounded-lg px-3 py-1.5 text-forest hover:bg-moss transition-colors disabled:opacity-50"
          >
            {loading ? '⟳ Loading…' : '↺ Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-mukta rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon="💬"
            label="Total conversations"
            value={loading ? '…' : stats?.totalConvs ?? 0}
            sub={stats?.weekConvs ? `+${stats.weekConvs} this week` : 'No activity this week'}
          />
          <StatCard
            icon="🌿"
            label="Crops queried"
            value={loading ? '…' : stats?.distinctCrops ?? 0}
            sub="distinct crop types"
          />
          <StatCard
            icon="🚨"
            label="High severity"
            value={loading ? '…' : stats?.highCount ?? 0}
            sub="alerts last 30 days"
          />
          <StatCard
            icon="👍"
            label="Helpful responses"
            value={loading ? '…' : helpfulPct !== null ? `${helpfulPct}%` : 'No feedback yet'}
            sub={feedback.total > 0 ? `${feedback.helpful} of ${feedback.total} rated` : ''}
          />
        </div>

        {/* Two column section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Recent Conversations */}
          <div className="bg-white border border-forest-border rounded-xl p-4">
            <h2 className="font-lora text-base font-semibold text-forest mb-3">Recent conversations</h2>
            {loading ? (
              <EmptyState text="Loading…" />
            ) : recentConvs.length === 0 ? (
              <EmptyState text="No conversations yet. Start chatting!" />
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {recentConvs.map(conv => (
                  <div key={conv.id} className="flex items-center gap-2.5 py-2.5">
                    <SeverityDot s={conv.severity} />
                    <span className="flex-1 text-sm font-mukta text-forest truncate">
                      {conv.title || 'Untitled conversation'}
                    </span>
                    <span className="text-[0.68rem] font-mukta text-gray-400 whitespace-nowrap">
                      {fmtDate(conv.updated_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Crops */}
          <div className="bg-white border border-forest-border rounded-xl p-4">
            <h2 className="font-lora text-base font-semibold text-forest mb-3">Top crops queried</h2>
            {loading ? (
              <EmptyState text="Loading…" />
            ) : cropCounts.length === 0 ? (
              <EmptyState text="No crop data yet." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {cropCounts.map(({ name, count, pct }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs font-mukta text-gray-500 capitalize w-20 flex-shrink-0">{name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-forest rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mukta text-gray-400 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="bg-white border border-forest-border rounded-xl p-4">
          <h2 className="font-lora text-base font-semibold text-forest mb-1">Severity breakdown — last 30 days</h2>
          <p className="text-xs font-mukta text-gray-400 mb-4">Based on AI-assessed severity in your queries</p>

          {loading ? (
            <EmptyState text="Loading…" />
          ) : sevCounts.total === 0 ? (
            <EmptyState text="No severity data yet." />
          ) : (
            <>
              <div className="flex gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <SeverityBadge s="High" />
                  <span className="text-xs font-mukta text-gray-500">{sevCounts.High} queries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SeverityBadge s="Medium" />
                  <span className="text-xs font-mukta text-gray-500">{sevCounts.Medium} queries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SeverityBadge s="Low" />
                  <span className="text-xs font-mukta text-gray-500">{sevCounts.Low} queries</span>
                </div>
              </div>
              {/* Stacked bar */}
              <div className="h-3 rounded-full overflow-hidden flex gap-px">
                {sevCounts.High > 0 && (
                  <div
                    className="bg-red-400 h-full"
                    style={{ width: `${Math.round((sevCounts.High / sevTotal) * 100)}%` }}
                  />
                )}
                {sevCounts.Medium > 0 && (
                  <div
                    className="bg-yellow-400 h-full"
                    style={{ width: `${Math.round((sevCounts.Medium / sevTotal) * 100)}%` }}
                  />
                )}
                {sevCounts.Low > 0 && (
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${Math.round((sevCounts.Low / sevTotal) * 100)}%` }}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Token usage */}
        <div className="bg-white border border-forest-border rounded-xl p-4">
          <h2 className="font-lora text-base font-semibold text-forest mb-1">Token usage this month</h2>
          <p className="text-xs font-mukta text-gray-400 mb-4">Gemini tokens consumed across all your queries</p>

          {loading ? (
            <EmptyState text="Loading…" />
          ) : (
            <div className="flex items-end gap-4">
              <div>
                <span className="text-3xl font-semibold font-lora text-forest">
                  {tokenTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-mukta text-gray-400 ml-2">tokens</span>
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2.5 bg-forest rounded-full"
                  style={{ width: `${Math.min(Math.round((tokenTotal / 100000) * 100), 100)}%` }}
                />
              </div>
              <span className="text-xs font-mukta text-gray-400">~100k est. monthly</span>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  )
}
