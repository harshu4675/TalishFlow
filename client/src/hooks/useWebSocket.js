import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthContext } from '@/context/AuthContext'

export default function useProcessingSocket(handlers = {}) {
  const { isAuthenticated } = useAuthContext()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

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

    if (handlers.onProcessingProgress) {
      socket.on('processing:progress', handlers.onProcessingProgress)
    }

    if (handlers.onProcessingComplete) {
      socket.on('processing:complete', handlers.onProcessingComplete)
    }

    if (handlers.onProcessingError) {
      socket.on('processing:error', handlers.onProcessingError)
    }

    if (handlers.onUploadProgress) {
      socket.on('upload:progress', handlers.onUploadProgress)
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