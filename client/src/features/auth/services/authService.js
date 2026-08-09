import { apiClient } from '@/services/api'

const authService = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  refresh: async () => {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  logoutAll: async () => {
    const response = await apiClient.post('/auth/logout-all')
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', data)
    return response.data
  },

  changePassword: async (data) => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },

  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`)
    return response.data
  },

  initiateGoogleOAuth: () => {
    window.location.href = '/api/v1/auth/google'
  },

  initiateInstagramOAuth: () => {
    window.location.href = '/api/v1/auth/instagram'
  },
}

export default authService
