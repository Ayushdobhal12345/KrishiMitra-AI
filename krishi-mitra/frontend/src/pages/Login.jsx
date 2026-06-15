import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    // Placeholder — replace with real auth API call later
    setTimeout(() => {
      setLoading(false)
      navigate('/chat')
    }, 1200)
  }

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md bg-white border border-forest-border rounded-2xl shadow-card p-8 flex flex-col gap-6">

          {/* Heading */}
          <div>
            <h1 className="font-lora text-2xl font-semibold text-forest">Field Supervisor Login</h1>
            <p className="font-mukta text-sm text-gray-400 mt-1">
              Mandakini Organic Produce Collective · Uttarakhand
            </p>
          </div>

          {/* Error */}
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
                className="w-full border border-forest-border rounded-xl px-4 py-2.5 font-mukta text-sm text-forest placeholder:text-gray-300 outline-none focus:border-forest-light transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-forest hover:bg-forest-light text-white font-mukta font-semibold text-base py-3 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>

          <p className="text-center font-mukta text-xs text-gray-400">
            Authentication is currently in development. This form will connect to the backend in a future release.
          </p>

        </div>
      </main>

      <Footer />
    </div>
  )
}
