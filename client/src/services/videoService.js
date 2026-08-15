import http from './http'

export const videoService = {
  listVideos: async (params = {}) => {
    const response = await http.get('/videos', { params })
    return response.data.data
  },

  getVideo: async (videoId) => {
    const response = await http.get(`/videos/${videoId}`)
    return response.data.data.video
  },

  getStreamUrl: (videoId) => `/api/v1/videos/${videoId}/stream`,
}

export default videoService
