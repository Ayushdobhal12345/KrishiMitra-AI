import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { label: 'Home',      path: '/' },
    { label: 'About',     path: '/about' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Login',     path: '/login' },
  ]

  return (
    <header className="bg-forest text-white flex-shrink-0 overflow-hidden relative">
      <div className="px-6 pt-4 pb-3 flex items-center gap-4 relative z-10">
        {/* Icon */}
        <div
          className="w-12 h-12 bg-amber rounded-xl flex items-center justify-center text-2xl flex-shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          🌾
        </div>

        {/* Title block */}
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-2xl font-bold tracking-tight leading-tight font-mukta">
            Krishi <span className="text-amber-light">Mitra</span>
          </div>
          <div className="text-xs text-white/60 mt-0.5 font-light font-mukta">
            Mandakini Organic Produce Collective · Uttarakhand
          </div>
        </div>

        {/* Nav links */}
        <nav className="ml-auto hidden md:flex items-center gap-1">
          {links.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={[
                'font-mukta text-sm px-3 py-1.5 rounded-lg transition-colors duration-150 border-none cursor-pointer',
                location.pathname === path
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10 bg-transparent',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Badge */}
        <div className="hidden sm:flex md:hidden items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white/80 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot inline-block" />
          AI Advisory
        </div>
      </div>

      {/* Mountain silhouette strip */}
      <div className="h-10 relative overflow-hidden">
        <svg
          viewBox="0 0 800 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 w-full"
        >
          <polygon
            points="0,40 80,10 160,28 280,5 380,22 500,8 620,25 720,12 800,20 800,40"
            fill="#f5f2eb"
          />
        </svg>
      </div>
    </header>
  )
}
