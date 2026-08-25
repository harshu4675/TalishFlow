import http from './http'

export const settingsService = {
  updateProfile: async (data) => {
    const response = await http.patch('/settings/profile', data)
    return response.data.data.user
  },

  getConnectedAccounts: async () => {
    const response = await http.get('/settings/connected-accounts')
    return response.data.data.accounts
  },

  disconnectAccount: async (platform) => {
    const response = await http.delete(`/settings/connected-accounts/${platform}`)
    return response.data
  },

  getIntegrations: async () => {
    const response = await http.get('/settings/integrations')
    return response.data.data
  },
}

export default settingsService
