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

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-2xl font-display font-bold gradient-text">Accrue</span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-xl font-display font-semibold text-white mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Start tracking your portfolio</p>

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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#7C5CFC]/50 focus:bg-white/8
                  transition-colors"
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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#7C5CFC]/50 focus:bg-white/8
                  transition-colors"
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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#7C5CFC]/50 focus:bg-white/8
                  transition-colors"
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
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#7C5CFC]/50 focus:bg-white/8
                  transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0]
                text-white text-sm font-semibold rounded-lg transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7C5CFC]/20 hover:shadow-[#7C5CFC]/30"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#a78bfa] hover:text-[#7C5CFC] font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
