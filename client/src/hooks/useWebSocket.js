import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthContext } from '@/context/AuthContext'

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

    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
