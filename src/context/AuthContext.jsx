import { createContext, useContext, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // accessToken lives in memory only — never localStorage
  const [user, setUser] = useState(null)         // { id, name, email }
  const [accessToken, setAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
