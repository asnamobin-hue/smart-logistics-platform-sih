import { useEffect } from 'react'
import { connectSocket, disconnectSocket } from '../services/socket.js'

// Subscribe to a socket event for the lifetime of a component.
// Usage: useSocket('alert:new', (alert) => setAlerts(prev => [alert, ...prev]))
export function useSocket(eventName, handler) {
  useEffect(() => {
    const socket = connectSocket()
    socket.on(eventName, handler)

    return () => {
      socket.off(eventName, handler)
      disconnectSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName])
}