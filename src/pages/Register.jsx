import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!name.trim()) return 'Name is required.'
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const STATS = [
    { value: '4', label: 'Brokers supported' },
    { value: 'AI', label: 'Portfolio advisor' },
    { value: '∞', label: 'Holdings tracked' },
  ]

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

        {/* Headline + stats */}
        <div className="relative z-10 space-y-10">
          <div className="landing-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
              Your passive income,<br />all in one place.
            </h2>
            <p className="text-gray-400 mt-4 text-[15px] leading-relaxed max-w-sm">
              Connect brokers and exchanges in minutes. Your dividends, yields, and staking rewards — unified and forecasted.
            </p>
          </div>
          <div className="flex gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="landing-fade-up" style={{ animationDelay: `${0.18 + i * 0.09}s` }}>
                <div className="text-3xl font-display font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
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
            <h1 className="text-2xl font-display font-bold text-white mb-1">Create account</h1>
            <p className="text-sm text-gray-400 mb-6">Start tracking your portfolio</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-white
                    placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8
                    transition-all duration-200"
                />
              </div>

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
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-white
                    placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8
                    transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
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
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-5 card-reveal" style={{ animationDelay: '0.16s' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-[#a78bfa] hover:text-[#7C5CFC] font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
