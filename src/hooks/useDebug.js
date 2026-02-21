import { useState, useCallback, useRef } from 'react'

const LOG_LIMIT = 50

export function useDebug() {
  const [logs, setLogs] = useState([])
  const [visible, setVisible] = useState(false)
  const idRef = useRef(0)

  const log = useCallback((provider, action, { status, latency, error, data } = {}) => {
    setLogs((prev) => {
      const entry = {
        id: ++idRef.current,
        ts: new Date().toISOString(),
        provider,
        action,
        status: status || (error ? 'error' : 'ok'),
        latency,
        error: error || null,
        data: data || null,
      }
      const next = [entry, ...prev]
      return next.length > LOG_LIMIT ? next.slice(0, LOG_LIMIT) : next
    })
  }, [])

  const clear = useCallback(() => setLogs([]), [])
  const toggle = useCallback(() => setVisible((v) => !v), [])

  return { logs, log, clear, visible, toggle }
}
