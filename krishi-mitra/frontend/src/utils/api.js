import { supabase } from '../lib/supabase.js'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Returns the logged-in user's UUID as supervisorId
export async function getSupervisorId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user.id

  // Fallback for unauthenticated contexts (shouldn't happen in protected routes)
  let id = localStorage.getItem('krishi_supervisor_id')
  if (!id) {
    id = 'sup_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('krishi_supervisor_id', id)
  }
  return id
}

// Get the current session JWT — uses getUser() for a fresh verified token
async function getAuthToken() {
  // getUser() hits the Supabase server and always returns a fresh valid token
  // getSession() can return a stale cached token that the backend rejects
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function apiFetch(path, options = {}) {
  const token = await getAuthToken()

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  // If 401, the session may have expired — try refreshing once
  if (res.status === 401) {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (session?.access_token) {
      const retryRes = await fetch(`${API}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      const retryData = await retryRes.json()
      if (!retryRes.ok) throw new Error(retryData.error || 'Request failed')
      return retryData
    }
    throw new Error('Session expired — please log in again')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Parse the structured AI response into sections
export function parseResponse(text) {
  const severityMatch = text.match(/SEVERITY[:\s]+(\w+)/i)
  const severity = severityMatch ? severityMatch[1] : null

  const sectionDefs = [
    { key: 'diagnosis', label: 'Diagnosis / Answer',  pattern: /(?:DIAGNOSIS|ANSWER)[:\s]+([\s\S]*?)(?=IMMEDIATE ACTION|ORGANIC REMEDIES|WHEN TO ESCALATE|SEVERITY|⚠️|$)/i },
    { key: 'action',    label: 'Immediate Action',    pattern: /IMMEDIATE ACTION[:\s]+([\s\S]*?)(?=ORGANIC REMEDIES|WHEN TO ESCALATE|SEVERITY|⚠️|$)/i },
    { key: 'organic',   label: 'Organic Remedies',    pattern: /ORGANIC REMEDIES[:\s]+([\s\S]*?)(?=WHEN TO ESCALATE|SEVERITY|⚠️|$)/i },
    { key: 'escalate',  label: 'When to Escalate',    pattern: /WHEN TO ESCALATE[:\s]+([\s\S]*?)(?=SEVERITY|⚠️|$)/i },
  ]

  const sections = sectionDefs
    .map(({ key, label, pattern }) => {
      const m = text.match(pattern)
      return m ? { key, label, content: m[1].trim() } : null
    })
    .filter(Boolean)

  if (sections.length === 0) {
    return { raw: text.replace(/⚠️.*$/s, '').trim(), severity }
  }

  return { sections, severity }
}
