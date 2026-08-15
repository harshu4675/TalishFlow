import http from './http'

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await http.get('/analytics/dashboard-stats')
    return response.data.data
  },

  getCharts: async (period) => {
    const response = await http.get(`/analytics/charts?period=${period}`)
    return response.data.data
  },

  getOverview: async (period) => {
    const response = await http.get(`/analytics/overview?period=${period}`)
    return response.data.data
  },

  getTopContent: async (limit = 8) => {
    const response = await http.get(`/analytics/top-content?limit=${limit}`)
    return response.data.data.content
  },

  getPlatforms: async (period) => {
    const response = await http.get(`/analytics/platforms?period=${period}`)
    return response.data.data
  },

  getStorage: async () => {
    const response = await http.get('/analytics/storage')
    return response.data.data
  },
}

export default analyticsService
