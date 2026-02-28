import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    text: 'Unified dashboard across all brokers',
  },
  {
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    text: 'AI-powered portfolio insights',
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    text: 'Dividend calendar & payment tracking',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    text: 'Multi-broker, multi-currency tracking',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!email.trim()) return 'Email is required.'
    if (!password) return 'Password is required.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] xl:w-[520px] flex-shrink-0 relative p-12 border-r border-white/[0.04]">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#7C5CFC]/[0.09] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#a78bfa]/[0.05] blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 landing-fade-up">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#7C5CFC] blur-xl opacity-40" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-display font-bold gradient-text">Flolio</span>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-10">
          <div className="landing-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
              Watch your passive<br />income grow.
            </h2>
            <p className="text-gray-400 mt-4 text-[15px] leading-relaxed max-w-sm">
              Connect all your brokers and exchanges. Track dividends, yields, and staking rewards — unified.
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 landing-fade-up" style={{ animationDelay: `${0.18 + i * 0.09}s` }}>
                <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <span className="text-sm text-gray-300">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-gray-600 landing-fade-up" style={{ animationDelay: '0.6s' }}>
          Free to start · No credit card required
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 relative">
        <div className="lg:hidden absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#7C5CFC]/[0.07] blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 card-reveal">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#7C5CFC] blur-xl opacity-30" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-display font-bold gradient-text">Flolio</span>
          </div>

          {/* Form card */}
          <div className="glass-card rounded-2xl p-8 card-reveal" style={{ animationDelay: '0.08s' }}>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-6">Sign in to your portfolio</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-white
                    placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8
                    transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-white
                    placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8
                    transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-1 bg-[#7C5CFC] hover:bg-[#6B4FE0]
                  text-white text-sm font-semibold rounded-lg transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7C5CFC]/25 hover:shadow-[#7C5CFC]/40 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-5 card-reveal" style={{ animationDelay: '0.16s' }}>
            No account?{' '}
            <Link to="/register" className="text-[#a78bfa] hover:text-[#7C5CFC] font-medium transition-colors">
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
