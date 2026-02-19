// api/db-check.js — temporary, delete after 0.2 is verified
import { prisma } from '../lib/prisma.js'

export default async function handler(req, res) {
  try {
    const userCount = await prisma.user.count()
    res.status(200).json({
      ok: true,
      message: 'Neon DB connected via Prisma',
      userCount,
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}
