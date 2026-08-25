import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Realtime updates from the server.
 *
 * The server authenticates sockets with the in-memory access token passed as
 * `auth.token` in the socket.io handshake. The `auth` callback form is used so
 * every (re)connection picks up the latest rotated token — never a stale one.
 *
 * All handler invocation happens through a ref so callers can attach
 * closures over changing React state without tearing down the connection.
 */
const DELEGATED_EVENTS = [
  // processing pipeline
  ['processing:progress', 'onProcessingProgress'],
  ['processing:complete', 'onProcessingComplete'],
  ['processing:error', 'onProcessingError'],
  // uploads
  ['upload:progress', 'onUploadProgress'],
  // clip export and subtitle jobs
  ['export:start', 'onExportStart'],
  ['export:progress', 'onExportProgress'],
  ['export:complete', 'onExportComplete'],
  ['export:error', 'onExportError'],
  ['subtitles:start', 'onSubtitlesStart'],
  ['subtitles:progress', 'onSubtitlesProgress'],
  ['subtitles:complete', 'onSubtitlesComplete'],
  ['subtitles:error', 'onSubtitlesError'],
]

export default function useWebSocket(handlers = {}) {
  const { isAuthenticated } = useAuthContext()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Fresh token on every connection attempt, including reconnects.
      auth: (cb) => cb({ token: window.__talishflow_access_token__ || null }),
    })

    socketRef.current = socket

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    DELEGATED_EVENTS.forEach(([event, handlerKey]) => {
      socket.on(event, (payload) => handlersRef.current[handlerKey]?.(payload))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { isConnected, emit }
}
