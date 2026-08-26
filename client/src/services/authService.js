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

  /**
   * Google LOGIN — the backend builds the authorization URL and redirects
   * (proxy keeps this same-origin). Google then redirects to the backend
   * callback which lands the user on /auth/callback.
   */
  initiateGoogleOAuth: () => {
    window.location.assign('/api/v1/auth/google')
  },

  /**
   * Platform CONNECT (YouTube / Instagram) — must be initiated by an
   * authenticated user. The backend returns the fully-built provider
   * authorization URL (with signed state) and we navigate to it.
   * Do NOT use <a href="/api/v1/auth/…"> for these: initiation requires
   * the Authorization header.
   *
   * @param {'youtube'|'instagram'} platform
   */
  connectPlatform: async (platform) => {
    const response = await http.post(`/auth/oauth/${platform}/initiate`)
    const url = response.data?.data?.url

    if (!url) {
      throw new Error('The server did not return an authorization URL')
    }

    window.location.assign(url)
  },
}

export default authService
