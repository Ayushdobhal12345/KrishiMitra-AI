import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// Sun icon
function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4"/>
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
}

// Moon icon
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, signOut } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef  = useRef(null)
  const hamburgerRef = useRef(null)

  const links = [
    { label: 'Home',      path: '/' },
    { label: 'About',     path: '/about' },
    { label: 'Dashboard', path: '/dashboard' },
    ...(user ? [{ label: 'Chat', path: '/chat' }] : [{ label: 'Login', path: '/login' }]),
  ]

  async function handleLogout() {
    try { await signOut() } catch (err) { console.error(err) }
    setMenuOpen(false)
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!menuOpen) return
    function onOutside(e) {
      const clickedDropdown  = dropdownRef.current?.contains(e.target)
      const clickedHamburger = hamburgerRef.current?.contains(e.target)
      if (!clickedDropdown && !clickedHamburger) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <>
      {/* ── HEADER ── */}
      <header className="bg-forest text-white flex-shrink-0 z-[150] relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 md:px-8 h-16 md:h-28 flex items-center gap-3">

          {/* Logo */}
          <div
            className="w-9 h-9 md:w-14 md:h-14 bg-amber rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0 cursor-pointer"
            onClick={() => navigate('/')}
          >
            🌾
          </div>

          {/* Brand */}
          <div className="cursor-pointer min-w-0 flex flex-col" onClick={() => navigate('/')}>
            <span className="text-lg md:text-3xl font-bold tracking-tight leading-tight font-mukta">
              Krishi <span className="text-amber-light">Mitra</span>
            </span>
            <span className="hidden md:block text-[11px] text-white/50 font-mukta leading-tight">
              Mandakini Organic Produce Collective · Uttarakhand
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {links.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={[
                  'font-mukta text-xl px-4 py-2 rounded-lg transition-colors duration-150 border-none cursor-pointer',
                  location.pathname === path
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/10 bg-transparent',
                ].join(' ')}
              >
                {label}
              </button>
            ))}

            {/* ── Dark / Light toggle (desktop) ── */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="ml-1 w-9 h-9 flex items-center justify-center rounded-lg border border-white/25 text-white/80 hover:text-white hover:bg-white/10 bg-transparent cursor-pointer transition-colors duration-150"
              aria-label="Toggle dark mode"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {user && (
              <div className="flex items-center gap-2 ml-3 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="text-xs text-white/55 font-mukta truncate max-w-[160px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="font-mukta text-sm px-3 py-1.5 rounded-lg border border-white/25 text-white/80 hover:text-white hover:bg-red-500/25 hover:border-red-400/40 bg-transparent cursor-pointer transition-colors duration-150"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden ml-auto flex items-center gap-2">
            {/* Dark/Light toggle (mobile) */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="bg-transparent border border-white/30 rounded-lg p-1.5 cursor-pointer text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Toggle dark mode"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Hamburger */}
            <button
              ref={hamburgerRef}
              className="bg-transparent border border-white/30 rounded-lg p-1.5 cursor-pointer text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DROPDOWN ── */}
      {menuOpen && (
        <div
          ref={dropdownRef}
          className="md:hidden fixed left-0 right-0 bg-forest shadow-2xl z-[149] border-b border-white/10"
          style={{ top: '64px' }}
        >
          <nav className="flex flex-col px-3 py-2">
            {links.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setMenuOpen(false) }}
                className={[
                  'font-mukta text-sm px-4 py-2.5 rounded-lg text-left border-none cursor-pointer w-full transition-colors',
                  location.pathname === path
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/80 hover:text-white hover:bg-white/10 bg-transparent',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
            {user && (
              <>
                <div className="border-t border-white/10 my-1.5 mx-1" />
                <span className="text-[0.7rem] text-white/40 font-mukta px-4 py-1 truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="font-mukta text-sm px-4 py-2.5 rounded-lg text-left border border-red-400/30 text-red-300 hover:bg-red-500/20 bg-transparent cursor-pointer transition-colors w-full mt-1 mb-1"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
