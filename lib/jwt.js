// lib/jwt.js
// JWT sign/verify using jose (Web Crypto compatible, works in Vercel serverless)
// Implemented in item 1.1
import { SignJWT, jwtVerify } from 'jose'
import { createHash } from 'crypto'

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET)

export async function signAccessToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET)
}

export async function signRefreshToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET)
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET)
  return payload
}

export async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET)
  return payload
}

/**
 * Hash a refresh token with SHA-256 for secure DB storage.
 * The raw token is sent to the client; only the hash is stored.
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
