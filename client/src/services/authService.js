import http from './http'

export const authService = {
  getMe: async () => {
    const response = await http.get('/auth/me')
    return response.data
  },

  login: async (credentials) => {
    const response = await http.post('/auth/login', credentials)
    return response.data
  },

  register: async (data) => {
    const response = await http.post('/auth/register', data)
    return response.data
  },

  logout: async () => {
    const response = await http.post('/auth/logout')
    return response.data
  },

  logoutAll: async () => {
    const response = await http.post('/auth/logout-all')
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await http.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data) => {
    const response = await http.post('/auth/reset-password', data)
    return response.data
  },

  changePassword: async (data) => {
    const response = await http.post('/auth/change-password', data)
    return response.data
  },

  verifyEmail: async (token) => {
    const response = await http.get(`/auth/verify-email?token=${token}`)
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
