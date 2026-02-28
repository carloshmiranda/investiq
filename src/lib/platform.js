import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

// In native builds, relative /api/* calls hit capacitor://localhost — prefix with the real API URL.
// Set VITE_API_URL to the production Vercel URL when building for Capacitor.
export const API_BASE_URL = isNative
  ? (import.meta.env.VITE_API_URL ?? '')
  : ''
