import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getEmergencyStatus, activateEmergencyMode, deactivateEmergencyMode } from '../services/api.js'

const EmergencyModeContext = createContext(null)

export function EmergencyModeProvider({ children }) {
  const [status, setStatus] = useState({ active: false, activatedBy: null, role: null, activatedAt: null })
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    getEmergencyStatus().then((res) => setStatus(res.data)).finally(() => setLoaded(true))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const activate = useCallback((payload) => activateEmergencyMode(payload).then((res) => { setStatus(res.data); return res.data }), [])
  const deactivate = useCallback(() => deactivateEmergencyMode().then((res) => { setStatus(res.data); return res.data }), [])

  return (
    <EmergencyModeContext.Provider value={{ ...status, loaded, activate, deactivate, refresh }}>
      {children}
    </EmergencyModeContext.Provider>
  )
}

export function useEmergencyMode() {
  const ctx = useContext(EmergencyModeContext)
  if (!ctx) throw new Error('useEmergencyMode must be used within an EmergencyModeProvider')
  return ctx
}
