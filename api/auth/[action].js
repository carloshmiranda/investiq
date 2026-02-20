import bcrypt from 'bcryptjs'
import { createHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js'

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

// ── POST /api/auth/register ───────────────────────────────────────────────────

async function handleRegister(req, res) {
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
    select: { id: true, name: true, email: true, currencyCode: true },
  })

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id }),
    signRefreshToken({ sub: user.id }),
  ])

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, refreshToken)
  return res.status(201).json({ accessToken, user })
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

async function handleLogin(req, res) {
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
      refreshToken,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, refreshToken)
  return res.status(200).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, currencyCode: user.currencyCode },
  })
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

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

  const session = await prisma.session.findUnique({ where: { refreshToken: token } })
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } })
    return res.status(401).json({ error: 'Session expired or revoked' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, currencyCode: true },
  })
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  // Rotate refresh token — replace old session with new one
  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken({ sub: user.id }),
    signRefreshToken({ sub: user.id }),
  ])

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.headers['x-forwarded-for'] ?? null,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  })

  setRefreshCookie(res, newRefreshToken)
  return res.status(200).json({ accessToken: newAccessToken, user })
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

async function handleLogout(req, res) {
  const token = parseCookie(req.headers.cookie, 'refreshToken')
  if (token) {
    await prisma.session.deleteMany({ where: { refreshToken: token } })
  }
  clearRefreshCookie(res)
  return res.status(200).json({ ok: true })
}

// ── dispatch ──────────────────────────────────────────────────────────────────

export default createHandler({
  POST: async (req, res) => {
    const { action } = req.query
    if (action === 'register') return handleRegister(req, res)
    if (action === 'login')    return handleLogin(req, res)
    if (action === 'refresh')  return handleRefresh(req, res)
    if (action === 'logout')   return handleLogout(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
})
