import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // accessToken lives in memory only — never localStorage
  const [user, setUser] = useState(null)         // { id, name, email }
  const [accessToken, setAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // true until mount refresh attempt settles

  // Ref so interceptor closure always reads the latest token without re-registering
  const tokenRef = useRef(null)
  useEffect(() => { tokenRef.current = accessToken }, [accessToken])

  // On mount: try to restore session from httpOnly refresh cookie
  useEffect(() => {
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        setUser(data.user)
        setAccessToken(data.accessToken)
        tokenRef.current = data.accessToken
      })
      .catch(() => {
        // no valid refresh cookie — stay logged out, that's fine
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Axios instance for all authenticated API calls.
  // - Attaches Bearer token on every request via request interceptor
  // - On 401: silently refreshes token and retries the original request once
  // - On refresh failure: clears auth state (session fully expired)
  const authAxios = useMemo(() => {
    const instance = axios.create({ withCredentials: true })

    instance.interceptors.request.use(config => {
      if (tokenRef.current) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${tokenRef.current}`
      }
      return config
    })

    instance.interceptors.response.use(
      res => res,
      async err => {
        const original = err.config
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true
          try {
            const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
            setUser(data.user)
            setAccessToken(data.accessToken)
            tokenRef.current = data.accessToken
            original.headers = original.headers ?? {}
            original.headers.Authorization = `Bearer ${data.accessToken}`
            return instance(original)
          } catch {
            // Refresh failed — session fully expired, force logout
            setUser(null)
            setAccessToken(null)
            tokenRef.current = null
          }
        }
        return Promise.reject(err)
      }
    )

    return instance
  }, []) // create once

  async function register(name, email, password) {
    setIsLoading(true)
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password }, { withCredentials: true })
      setUser(data.user)
      setAccessToken(data.accessToken)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email, password) {
    setIsLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { email, password }, { withCredentials: true })
      setUser(data.user)
      setAccessToken(data.accessToken)
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true })
    } catch {
      // clear state regardless
    }
    setUser(null)
    setAccessToken(null)
    tokenRef.current = null
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, authAxios, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
