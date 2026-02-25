import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#7C5CFC]/[0.07] blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#a78bfa]/[0.04] blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo with glow */}
        <div className="flex items-center justify-center gap-3 mb-8 card-reveal">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[#7C5CFC] blur-xl opacity-30" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <span className="text-2xl font-display font-bold gradient-text">Accrue</span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-xl p-8 card-reveal" style={{ animationDelay: '0.08s' }}>
          <h1 className="text-xl font-display font-semibold text-white mb-1">Welcome back</h1>
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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8
                  transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0]
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
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
