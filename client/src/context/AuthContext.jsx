import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { ROUTES } from '@/utils/constants'

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      }

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    default:
      return state
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const loadUser = useCallback(async () => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await apiClient.get('/auth/me')
      const { user, accessToken } = response.data

      if (accessToken) {
        window.__talishflow_access_token__ = accessToken
      }

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } })
    } catch {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: null },
      })
    }
  }, [])

  useEffect(() => {
    loadUser()

    const handleLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' })
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [loadUser])

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await apiClient.post('/auth/login', credentials)
      const { user, accessToken } = response.data

      window.__talishflow_access_token__ = accessToken

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } })

      return { success: true, user }
    } catch (error) {
      const message = error.userMessage || 'Login failed. Please check your credentials.'

      dispatch({ type: 'AUTH_FAILURE', payload: { error: message } })

      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (data) => {
    dispatch({ type: 'AUTH_LOADING' })

    try {
      const response = await apiClient.post('/auth/register', data)
      const { user, accessToken } = response.data

      window.__talishflow_access_token__ = accessToken

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } })

      return { success: true, user }
    } catch (error) {
      const message = error.userMessage || 'Registration failed. Please try again.'

      dispatch({ type: 'AUTH_FAILURE', payload: { error: message } })

      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.warn('Logout request failed', error?.message || '')
    } finally {
      window.__talishflow_access_token__ = null
      dispatch({ type: 'AUTH_LOGOUT' })
      window.location.href = ROUTES.LOGIN
    }
  }, [])

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates })
  }, [])

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    reloadUser: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}
