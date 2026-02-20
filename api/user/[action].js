import bcrypt from 'bcryptjs'
import { createProtectedHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'

// ── GET /api/user/profile ────────────────────────────────────────────────────

async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.status(200).json(user)
}

// ── PUT /api/user/profile ────────────────────────────────────────────────────

async function updateProfile(req, res) {
  const { name, email } = req.body ?? {}

  if (!name && !email) {
    return res.status(400).json({ error: 'Nothing to update' })
  }

  const data = {}
  if (name) data.name = name.trim()
  if (email) {
    const emailTrimmed = email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: emailTrimmed } })
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: 'This email is already in use' })
    }
    data.email = emailTrimmed
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: { id: true, name: true, email: true },
  })

  return res.status(200).json(user)
}

// ── PUT /api/user/password ───────────────────────────────────────────────────

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {}

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: req.userId },
    data: { passwordHash },
  })

  return res.status(200).json({ ok: true })
}

// ── GET /api/user/sessions ───────────────────────────────────────────────────

async function getSessions(req, res) {
  const sessions = await prisma.session.findMany({
    where: { userId: req.userId, expiresAt: { gt: new Date() } },
    select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // Identify current session by matching refresh token from cookie
  const currentToken = parseCookie(req.headers.cookie, 'refreshToken')
  let currentSessionId = null
  if (currentToken) {
    const currentSession = await prisma.session.findUnique({
      where: { refreshToken: currentToken },
      select: { id: true },
    })
    if (currentSession) currentSessionId = currentSession.id
  }

  return res.status(200).json({
    sessions: sessions.map(s => ({ ...s, isCurrent: s.id === currentSessionId })),
  })
}

// ── POST /api/user/logout-all ────────────────────────────────────────────────

async function logoutAll(req, res) {
  // Optionally keep current session
  const { keepCurrent } = req.body ?? {}
  const currentToken = parseCookie(req.headers.cookie, 'refreshToken')

  if (keepCurrent && currentToken) {
    await prisma.session.deleteMany({
      where: {
        userId: req.userId,
        NOT: { refreshToken: currentToken },
      },
    })
  } else {
    await prisma.session.deleteMany({ where: { userId: req.userId } })
  }

  return res.status(200).json({ ok: true })
}

// ── DELETE /api/user/sessions (revoke single session) ────────────────────────

async function revokeSession(req, res) {
  const { sessionId } = req.body ?? {}
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' })

  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== req.userId) {
    return res.status(404).json({ error: 'Session not found' })
  }

  await prisma.session.delete({ where: { id: sessionId } })
  return res.status(200).json({ ok: true })
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCookie(header, name) {
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

// ── dispatch ─────────────────────────────────────────────────────────────────

export default createProtectedHandler({
  GET: async (req, res) => {
    const { action } = req.query
    if (action === 'profile')  return getProfile(req, res)
    if (action === 'sessions') return getSessions(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  PUT: async (req, res) => {
    const { action } = req.query
    if (action === 'profile')  return updateProfile(req, res)
    if (action === 'password') return updatePassword(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  POST: async (req, res) => {
    const { action } = req.query
    if (action === 'logout-all') return logoutAll(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  DELETE: async (req, res) => {
    const { action } = req.query
    if (action === 'sessions') return revokeSession(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
})
