export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Generate or retrieve a persistent supervisor ID
export function getSupervisorId() {
  let id = localStorage.getItem('krishi_supervisor_id')
  if (!id) {
    id = 'sup_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('krishi_supervisor_id', id)
  }
  return id
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
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
