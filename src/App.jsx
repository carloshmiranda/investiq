import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { isNative } from './lib/platform'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { DebugProvider, useDebugContext } from './context/DebugContext'
import { DegiroProvider } from './context/DegiroContext'
import { Trading212Provider } from './context/Trading212Context'
import { BinanceProvider } from './context/BinanceContext'
import { CryptocomProvider } from './context/CryptocomContext'
import DebugPanel from './components/DebugPanel'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Holdings from './pages/Holdings'
import Calendar from './pages/Calendar'
import Connections from './pages/Connections'
import AIInsights from './pages/AIInsights'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

function DebugOverlay() {
  const debug = useDebugContext()
  if (!debug) return null
  return <DebugPanel logs={debug.logs} onClear={debug.clear} visible={debug.visible} onToggle={debug.toggle} />
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <CurrencyProvider>
        <DebugProvider>
        <DegiroProvider>
        <Trading212Provider>
        <BinanceProvider>
        <CryptocomProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes — redirect to dashboard if already logged in */}
            <Route element={<PublicRoute />}>
              <Route index element={<Landing />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Protected routes — redirect to login if not authenticated */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="income" element={<Income />} />
                <Route path="holdings" element={<Holdings />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="connections" element={<Connections />} />
                <Route path="ai-insights" element={<AIInsights />} />
                <Route path="settings" element={<Settings />} />
                <Route path="billing" element={<Billing />} />
              </Route>
            </Route>

            {/* Blog routes — open to everyone, no auth gate */}
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <DebugOverlay />
          {!isNative && <Analytics />}
        </BrowserRouter>
        </CryptocomProvider>
        </BinanceProvider>
        </Trading212Provider>
        </DegiroProvider>
        </DebugProvider>
      </CurrencyProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
