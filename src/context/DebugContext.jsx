import { createContext, useContext } from 'react'
import { useDebug } from '../hooks/useDebug'

const DebugContext = createContext(null)

export function DebugProvider({ children }) {
  const debug = useDebug()
  return (
    <DebugContext.Provider value={debug}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebugContext() {
  return useContext(DebugContext)
}
