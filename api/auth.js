// api/auth.js — consolidated handler for /api/auth/* and /api/user/* routes
// Auth routes (register, login, refresh, logout) are public.
// User routes (profile, password, sessions, currency) require authentication.
// Routing via vercel.json rewrites: scope=auth|user, action=<endpoint>
import bcrypt from 'bcryptjs'
import { createHandler } from '../lib/apiHandler.js'
import { requireAuth } from '../lib/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../lib/jwt.js'
import { checkRateLimit, getClientIp } from '../lib/rateLimit.js'
import { SUPPORTED } from '../lib/exchangeRates.js'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const SEVEN_DAYS_S  = 7 * 24 * 60 * 60

// ── helpers ───────────────────────────────────────────────────────────────────

function parseCookie(header, name) {
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setRefreshCookie(res, token) {
  const secure = process.env.VERCEL_ENV === 'production' ? 'Secure; ' : ''
  res.setHeader(
    'Set-Cookie',
    `refreshToken=${token}; HttpOnly; ${secure}SameSite=Strict; Path=/api/auth; Max-Age=${SEVEN_DAYS_S}`
  )
}

function clearRefreshCookie(res) {
  const secure = process.env.VERCEL_ENV === 'production' ? 'Secure; ' : ''
  res.setHeader(
    'Set-Cookie',
    `refreshToken=; HttpOnly; ${secure}SameSite=Strict; Path=/api/auth; Max-Age=0`
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH HANDLERS (no authentication required)
// ═══════════════════════════════════════════════════════════════════════════════

async function handleRegister(req, res) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`register:${ip}`, { maxAttempts: 3, windowMs: 60_000 })
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Try again later.', retryAfter: rl.retryAfter })
  }

  const { name, email, password } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, currencyCode: true, plan: true },
  })

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id }),
    signRefreshToken({ sub: user.id }),
  ])

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, refreshToken)
  return res.status(201).json({ accessToken, user })
}

async function handleLogin(req, res) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`login:${ip}`, { maxAttempts: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many login attempts. Try again later.', retryAfter: rl.retryAfter })
  }

  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id }),
    signRefreshToken({ sub: user.id }),
  ])

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, refreshToken)
  return res.status(200).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, currencyCode: user.currencyCode, plan: user.plan },
  })
}

async function handleRefresh(req, res) {
  const token = parseCookie(req.headers.cookie, 'refreshToken')
  if (!token) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  let payload
  try {
    payload = await verifyRefreshToken(token)
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({ where: { refreshToken: tokenHash } })
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } })
    return res.status(401).json({ error: 'Session expired or revoked' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, currencyCode: true, plan: true },
  })
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken({ sub: user.id }),
    signRefreshToken({ sub: user.id }),
  ])

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: hashToken(newRefreshToken),
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, newRefreshToken)
  return res.status(200).json({ accessToken: newAccessToken, user })
}

async function handleLogout(req, res) {
  const token = parseCookie(req.headers.cookie, 'refreshToken')
  if (token) {
    await prisma.session.deleteMany({ where: { refreshToken: hashToken(token) } })
  }
  clearRefreshCookie(res)
  return res.status(200).json({ ok: true })
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER HANDLERS (authentication required — requireAuth called in dispatch)
// ═══════════════════════════════════════════════════════════════════════════════

async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, currencyCode: true, plan: true, createdAt: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.status(200).json(user)
}

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
    select: { id: true, name: true, email: true, currencyCode: true, plan: true },
  })

  return res.status(200).json(user)
}

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

async function getSessions(req, res) {
  const sessions = await prisma.session.findMany({
    where: { userId: req.userId, expiresAt: { gt: new Date() } },
    select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const currentToken = parseCookie(req.headers.cookie, 'refreshToken')
  let currentSessionId = null
  if (currentToken) {
    const currentSession = await prisma.session.findUnique({
      where: { refreshToken: hashToken(currentToken) },
      select: { id: true },
    })
    if (currentSession) currentSessionId = currentSession.id
  }

  return res.status(200).json({
    sessions: sessions.map(s => ({ ...s, isCurrent: s.id === currentSessionId })),
  })
}

async function logoutAll(req, res) {
  const { keepCurrent } = req.body ?? {}
  const currentToken = parseCookie(req.headers.cookie, 'refreshToken')

  if (keepCurrent && currentToken) {
    await prisma.session.deleteMany({
      where: {
        userId: req.userId,
        NOT: { refreshToken: hashToken(currentToken) },
      },
    })
  } else {
    await prisma.session.deleteMany({ where: { userId: req.userId } })
  }

  return res.status(200).json({ ok: true })
}

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

async function updateCurrency(req, res) {
  const { currencyCode } = req.body ?? {}

  if (!currencyCode || !SUPPORTED.includes(currencyCode)) {
    return res.status(400).json({ error: `currencyCode must be one of: ${SUPPORTED.join(', ')}` })
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { currencyCode },
    select: { id: true, name: true, email: true, currencyCode: true, plan: true },
  })

  return res.status(200).json(user)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH — routes by scope (auth vs user) and action
// ═══════════════════════════════════════════════════════════════════════════════

export default createHandler({
  GET: async (req, res) => {
    // Only user scope has GET routes — requires auth
    if (!(await requireAuth(req, res))) return
    const { action } = req.query
    if (action === 'profile')  return getProfile(req, res)
    if (action === 'sessions') return getSessions(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  POST: async (req, res) => {
    const { scope, action } = req.query
    // Auth routes — no authentication required
    if (scope !== 'user') {
      if (action === 'register') return handleRegister(req, res)
      if (action === 'login')    return handleLogin(req, res)
      if (action === 'refresh')  return handleRefresh(req, res)
      if (action === 'logout')   return handleLogout(req, res)
      return res.status(404).json({ error: `Unknown action: ${action}` })
    }
    // User routes — authentication required
    if (!(await requireAuth(req, res))) return
    if (action === 'logout-all') return logoutAll(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  PUT: async (req, res) => {
    if (!(await requireAuth(req, res))) return
    const { action } = req.query
    if (action === 'profile')  return updateProfile(req, res)
    if (action === 'password') return updatePassword(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  PATCH: async (req, res) => {
    if (!(await requireAuth(req, res))) return
    if (req.query.action === 'currency') return updateCurrency(req, res)
    return res.status(404).json({ error: `Unknown action: ${req.query.action}` })
  },
  DELETE: async (req, res) => {
    if (!(await requireAuth(req, res))) return
    if (req.query.action === 'sessions') return revokeSession(req, res)
    return res.status(404).json({ error: `Unknown action: ${req.query.action}` })
  },
})
