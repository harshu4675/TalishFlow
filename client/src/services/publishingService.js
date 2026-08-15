import http from './http'

export const publishingService = {
  createJob: async (data) => {
    const response = await http.post('/publishing/jobs', data)
    return response.data.data
  },

  listJobs: async (params = {}) => {
    const response = await http.get('/publishing/jobs', { params })
    return response.data.data
  },

  getJob: async (jobId) => {
    const response = await http.get(`/publishing/jobs/${jobId}`)
    return response.data.data.job
  },

  cancelJob: async (jobId) => {
    const response = await http.post(`/publishing/jobs/${jobId}/cancel`)
    return response.data
  },

  retryJob: async (jobId) => {
    const response = await http.post(`/publishing/jobs/${jobId}/retry`)
    return response.data.data
  },

  getScheduledPosts: async (params = {}) => {
    const response = await http.get('/publishing/scheduled', { params })
    return response.data.data
  },

  getYouTubeData: async () => {
    const response = await http.get('/publishing/youtube/data')
    return response.data.data
  },

  getInstagramData: async () => {
    const response = await http.get('/publishing/instagram/data')
    return response.data.data
  },
}

export default publishingService
