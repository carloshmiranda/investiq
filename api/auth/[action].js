import bcrypt from 'bcryptjs'
import { createHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function setRefreshCookie(res, token) {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
  res.setHeader(
    'Set-Cookie',
    `refreshToken=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/api/auth; Max-Age=${maxAge}`
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
    select: { id: true, name: true, email: true },
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  setRefreshCookie(res, refreshToken)
  return res.status(201).json({ accessToken, user })
}

// ── dispatch ──────────────────────────────────────────────────────────────────

export default createHandler({
  POST: async (req, res) => {
    const { action } = req.query
    if (action === 'register') return handleRegister(req, res)
    // login, refresh, logout — item 1.2
    return res.status(501).json({ error: `Not implemented yet: ${action}` })
  },
})
