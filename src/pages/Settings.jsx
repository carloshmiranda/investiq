import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import PageHeader from '../components/PageHeader'

// ── Profile Section ────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, authAxios, updateUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email) }
  }, [user])

  const dirty = name !== user?.name || email !== user?.email

  async function handleSave(e) {
    e.preventDefault()
    if (!dirty) return
    setSaving(true); setMsg(null)
    try {
      const { data } = await authAxios.put('/api/user/profile', { name: name.trim(), email: email.trim() })
      updateUser({ name: data.name, email: data.email })
      setMsg({ type: 'ok', text: 'Profile updated.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Update failed.' })
    } finally { setSaving(false) }
  }

  return (
    <Card title="Profile">
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Msg msg={msg} />
        <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </Card>
  )
}

// ── Password Section ───────────────────────────────────────────────────────

function PasswordSection() {
  const { authAxios } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function validate() {
    if (!current) return 'Current password is required.'
    if (next.length < 8) return 'New password must be at least 8 characters.'
    if (next !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSave(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setMsg({ type: 'err', text: err }); return }
    setSaving(true); setMsg(null)
    try {
      await authAxios.put('/api/user/password', { currentPassword: current, newPassword: next })
      setMsg({ type: 'ok', text: 'Password changed.' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Password change failed.' })
    } finally { setSaving(false) }
  }

  return (
    <Card title="Change Password">
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <Field label="New password" type="password" value={next} onChange={setNext} autoComplete="new-password" />
        <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <Msg msg={msg} />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Changing...' : 'Change password'}
        </button>
      </form>
    </Card>
  )
}

// ── Sessions Section ───────────────────────────────────────────────────────

function SessionsSection() {
  const { authAxios, logout } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await authAxios.get('/api/user/sessions')
      setSessions(data.sessions)
    } catch {
      setMsg({ type: 'err', text: 'Failed to load sessions.' })
    } finally { setLoading(false) }
  }, [authAxios])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  async function revoke(sessionId) {
    try {
      await authAxios.delete('/api/user/sessions', { data: { sessionId } })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch {
      setMsg({ type: 'err', text: 'Failed to revoke session.' })
    }
  }

  async function logoutAll() {
    try {
      await authAxios.post('/api/user/logout-all', { keepCurrent: false })
      logout()
    } catch {
      setMsg({ type: 'err', text: 'Failed to logout all sessions.' })
    }
  }

  async function logoutOthers() {
    try {
      await authAxios.post('/api/user/logout-all', { keepCurrent: true })
      setSessions(prev => prev.filter(s => s.isCurrent))
      setMsg({ type: 'ok', text: 'Other sessions revoked.' })
    } catch {
      setMsg({ type: 'err', text: 'Failed to revoke other sessions.' })
    }
  }

  function parseUA(ua) {
    if (!ua) return 'Unknown device'
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)[/\s]?(\d+)/i)
    const os = ua.match(/(Windows|Mac OS X|Linux|Android|iOS)[/\s]?([0-9._]*)/i)
    const parts = []
    if (browser) parts.push(`${browser[1]} ${browser[2]}`)
    if (os) parts.push(os[1].replace('Mac OS X', 'macOS'))
    return parts.length ? parts.join(' on ') : ua.slice(0, 50)
  }

  return (
    <Card title="Active Sessions">
      <Msg msg={msg} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400">No active sessions.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map(s => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  {parseUA(s.userAgent)}
                  {s.isCurrent && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7C5CFC]/20 text-[#a78bfa] border border-[#7C5CFC]/30">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.ipAddress ?? 'Unknown IP'} &middot; Created {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!s.isCurrent && (
                <button onClick={() => revoke(s.id)} className="text-xs text-red-400 hover:text-red-300 font-medium ml-4 flex-shrink-0">
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3 mt-4">
        {sessions.length > 1 && (
          <button onClick={logoutOthers} className={btnSecondary}>
            Revoke other sessions
          </button>
        )}
        <button onClick={logoutAll} className={btnDanger}>
          Logout everywhere
        </button>
      </div>
    </Card>
  )
}

// ── Shared UI helpers ──────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white
          placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 focus:bg-white/8 transition-all duration-200"
      />
    </div>
  )
}

function Msg({ msg }) {
  if (!msg) return null
  const cls = msg.type === 'ok'
    ? 'bg-[#7C5CFC]/10 border-[#7C5CFC]/20 text-[#a78bfa]'
    : 'bg-red-500/10 border-red-500/20 text-red-400'
  return <div className={`px-4 py-3 rounded-lg border text-sm ${cls}`}>{msg.text}</div>
}

const btnPrimary = `px-4 py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0]
  text-white text-sm font-semibold rounded-lg transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7C5CFC]/20`

const btnSecondary = `px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10
  text-white text-sm font-medium rounded-lg transition-all duration-200`

const btnDanger = `px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20
  text-red-400 text-sm font-medium rounded-lg transition-all duration-200`

// ── Theme Section ─────────────────────────────────────────────────────────

function ThemeSection() {
  const { theme, setTheme } = useTheme()

  return (
    <Card title="Appearance">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-medium">Theme</p>
          <p className="text-xs text-gray-400 mt-0.5">Choose your preferred appearance</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {[
            { value: 'dark', label: 'Dark', icon: (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )},
            { value: 'light', label: 'Light', icon: (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )},
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${
                theme === opt.value
                  ? 'bg-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and security" />

      {/* Appearance section */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest card-reveal" style={{ animationDelay: '0.06s' }}>Appearance</p>
        <div className="card-reveal" style={{ animationDelay: '0.1s' }}>
          <ThemeSection />
        </div>
      </div>

      {/* Account section */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest card-reveal" style={{ animationDelay: '0.14s' }}>Account</p>
        <div className="card-reveal" style={{ animationDelay: '0.18s' }}>
          <ProfileSection />
        </div>
      </div>

      {/* Security section */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest card-reveal" style={{ animationDelay: '0.22s' }}>Security</p>
        <div className="space-y-4">
          <div className="card-reveal" style={{ animationDelay: '0.26s' }}>
            <PasswordSection />
          </div>
          <div className="card-reveal" style={{ animationDelay: '0.3s' }}>
            <SessionsSection />
          </div>
        </div>
      </div>
    </div>
  )
}
