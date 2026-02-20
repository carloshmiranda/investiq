import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

const CurrencyContext = createContext(null)

const SUPPORTED = ['USD', 'EUR', 'GBP']
const LOCALE_MAP = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' }
const REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour

export function CurrencyProvider({ children }) {
  const { user, authAxios } = useAuth()

  const [rates, setRates] = useState({ USD: 1, EUR: 1, GBP: 1 })
  const [activeCurrency, setActiveCurrencyState] = useState(() => {
    return localStorage.getItem('investiq_currency') || 'USD'
  })
  const [ratesLoaded, setRatesLoaded] = useState(false)

  const intervalRef = useRef(null)

  // Sync currency from user preference on login
  useEffect(() => {
    if (user?.currencyCode && SUPPORTED.includes(user.currencyCode)) {
      setActiveCurrencyState(user.currencyCode)
      localStorage.setItem('investiq_currency', user.currencyCode)
    }
  }, [user?.currencyCode])

  // Fetch rates from API
  const fetchRates = useCallback(async () => {
    try {
      const { data } = await authAxios.get('/api/rates')
      setRates({ USD: data.USD, EUR: data.EUR, GBP: data.GBP })
      setRatesLoaded(true)
    } catch {
      // keep previous rates on error
    }
  }, [authAxios])

  // Load rates on mount and refresh every hour
  useEffect(() => {
    fetchRates()
    intervalRef.current = setInterval(fetchRates, REFRESH_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchRates])

  // Switch currency: update state, localStorage, and persist to DB
  const setActiveCurrency = useCallback(async (code) => {
    if (!SUPPORTED.includes(code)) return
    setActiveCurrencyState(code)
    localStorage.setItem('investiq_currency', code)
    try {
      await authAxios.patch('/api/user/currency', { currencyCode: code })
    } catch {
      // UI already updated — DB sync is best-effort
    }
  }, [authAxios])

  // Convert a USD amount to the active currency
  const convert = useCallback((amountUSD) => {
    if (activeCurrency === 'USD') return amountUSD
    return amountUSD * (rates[activeCurrency] || 1)
  }, [activeCurrency, rates])

  // Format a USD amount as a localized currency string
  const formatMoney = useCallback((amountUSD) => {
    const converted = convert(amountUSD)
    return new Intl.NumberFormat(LOCALE_MAP[activeCurrency], {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)
  }, [activeCurrency, convert])

  return (
    <CurrencyContext.Provider value={{
      activeCurrency,
      setActiveCurrency,
      convert,
      formatMoney,
      rates,
      ratesLoaded,
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>')
  return ctx
}
