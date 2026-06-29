import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, user } = useAuth()

  const [tab, setTab]         = useState('login')       // 'login' | 'signup'
  const [form, setForm]       = useState({ email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Already logged in — bounce to chat (must be in useEffect, not render body)
  useEffect(() => {
    if (user) navigate('/chat', { replace: true })
  }, [user, navigate])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }

    if (tab === 'signup') {
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(form.email, form.password)
        navigate('/chat', { replace: true })
      } else {
        await signUp(form.email, form.password)
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setTab('login')
        setForm({ email: form.email, password: '', confirm: '' })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md bg-white border border-forest-border rounded-2xl shadow-card p-8 flex flex-col gap-6">

          {/* Heading */}
          <div>
            <h1 className="font-lora text-2xl font-semibold text-forest">Field Supervisor Portal</h1>
            <p className="font-mukta text-sm text-gray-400 mt-1">
              Mandakini Organic Produce Collective · Uttarakhand
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-forest-border">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={[
                  'flex-1 py-2.5 text-sm font-semibold font-mukta border-none cursor-pointer transition-colors duration-150',
                  tab === t
                    ? 'bg-forest text-white'
                    : 'bg-white text-gray-400 hover:bg-moss',
                ].join(' ')}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Success banner */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-mukta rounded-lg px-4 py-2.5">
              ✅ {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-mukta rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="font-mukta text-sm font-medium text-forest" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="supervisor@mandakini.org"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full border border-forest-border rounded-xl px-4 py-2.5 font-mukta text-sm text-forest placeholder:text-gray-300 outline-none focus:border-forest-light transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mukta text-sm font-medium text-forest" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full border border-forest-border rounded-xl px-4 py-2.5 font-mukta text-sm text-forest placeholder:text-gray-300 outline-none focus:border-forest-light transition-colors"
              />
            </div>

            {tab === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mukta text-sm font-medium text-forest" htmlFor="confirm">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full border border-forest-border rounded-xl px-4 py-2.5 font-mukta text-sm text-forest placeholder:text-gray-300 outline-none focus:border-forest-light transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-forest hover:bg-forest-light text-white font-mukta font-semibold text-base py-3 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center font-mukta text-xs text-gray-400">
            {tab === 'login'
              ? "Don't have an account? Click 'Create Account' above."
              : 'Already have an account? Click \'Sign In\' above.'}
          </p>

        </div>
      </main>

      <Footer />
    </div>
  )
}
