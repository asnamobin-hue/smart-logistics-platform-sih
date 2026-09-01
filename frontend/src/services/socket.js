import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001'

// Allow Socket.IO to fall back to HTTP long-polling. For local Vite setups,
// forcing websocket-only can produce repeated connection errors even though
// the Socket.IO server itself is healthy.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 5000
})

export const connectSocket = () => {
  if (!socket.connected && !socket.active) socket.connect()
  return socket
}

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect()
}

socket.on('connect_error', (error) => {
  console.warn('Socket.IO unavailable:', error.message)
})

export default socket
