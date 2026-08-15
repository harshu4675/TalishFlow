import http from './http'

export const clipService = {
  listClips: async (params = {}) => {
    const response = await http.get('/clips', { params })
    return response.data.data
  },

  getClip: async (clipId) => {
    const response = await http.get(`/clips/${clipId}`)
    return response.data.data.clip
  },

  updateClip: async (clipId, data) => {
    const response = await http.patch(`/clips/${clipId}`, data)
    return response.data.data.clip
  },

  deleteClip: async (clipId) => {
    const response = await http.delete(`/clips/${clipId}`)
    return response.data
  },

  generateCaption: async (clipId, options = {}) => {
    const response = await http.post(`/clips/${clipId}/captions/generate`, options)
    return response.data.data
  },

  regenerateCaption: async (clipId, options = {}) => {
    const response = await http.post(`/clips/${clipId}/captions/regenerate`, options)
    return response.data.data
  },

  generateTitles: async (clipId) => {
    const response = await http.post(`/clips/${clipId}/titles/generate`)
    return response.data.data
  },

  generateHashtags: async (clipId, options = {}) => {
    const response = await http.post(`/clips/${clipId}/hashtags/generate`, options)
    return response.data.data
  },

  exportClip: async (clipId, options = {}) => {
    const response = await http.post(`/clips/${clipId}/export`, options)
    return response.data.data
  },

  getDownloadUrl: (clipId, filename) => `/api/v1/clips/${clipId}/download/${filename}`,

  getThumbnailUrl: (clipId) => `/api/v1/clips/${clipId}/thumbnail`,

  getStreamUrl: (clipId) => `/api/v1/clips/${clipId}/stream`,
}

export default clipService
