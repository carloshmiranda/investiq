import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { DegiroProvider } from './context/DegiroContext'
import { Trading212Provider } from './context/Trading212Context'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Holdings from './pages/Holdings'
import Calendar from './pages/Calendar'
import Connections from './pages/Connections'
import AIInsights from './pages/AIInsights'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <DegiroProvider>
        <Trading212Provider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="income" element={<Income />} />
                <Route path="holdings" element={<Holdings />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="connections" element={<Connections />} />
                <Route path="ai-insights" element={<AIInsights />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </Trading212Provider>
        </DegiroProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
