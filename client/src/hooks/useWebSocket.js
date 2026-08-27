import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthContext } from '@/contexts/AuthContext'

export default function useProcessingSocket(handlers = {}) {
  const { isAuthenticated } = useAuthContext()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!isAuthenticated) return

    // The server authenticates the socket via the handshake auth token
    // (the access token lives in JS memory, not a cookie). Note: the
    // socket.io client's function-form auth MUST invoke its callback —
    // returning a value alone leaves the handshake pending forever.
    // The function form re-reads the token on every (re)connection, so
    // token refreshes are picked up automatically.
    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: (callback) => {
        callback({ token: window.__talishflow_access_token__ || null })
      },
    })

    socketRef.current = socket

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    const currentHandlers = handlersRef.current

    if (currentHandlers.onProcessingProgress) {
      socket.on('processing:progress', currentHandlers.onProcessingProgress)
    }
    if (currentHandlers.onProcessingComplete) {
      socket.on('processing:complete', currentHandlers.onProcessingComplete)
    }
    if (currentHandlers.onProcessingError) {
      socket.on('processing:error', currentHandlers.onProcessingError)
    }
    if (currentHandlers.onUploadProgress) {
      socket.on('upload:progress', currentHandlers.onUploadProgress)
    }

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { isConnected, emit }
}
