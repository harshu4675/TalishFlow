import { apiClient } from '@/services/api'

const clipService = {
  listClips: async (params = {}) => {
    const response = await apiClient.get('/clips', { params })
    return response.data.data
  },

  getClip: async (clipId) => {
    const response = await apiClient.get(`/clips/${clipId}`)
    return response.data.data.clip
  },

  updateClip: async (clipId, data) => {
    const response = await apiClient.patch(`/clips/${clipId}`, data)
    return response.data.data.clip
  },

  deleteClip: async (clipId) => {
    const response = await apiClient.delete(`/clips/${clipId}`)
    return response.data
  },

  generateCaption: async (clipId, options = {}) => {
    const response = await apiClient.post(`/clips/${clipId}/captions/generate`, options)
    return response.data.data
  },

  regenerateCaption: async (clipId, options = {}) => {
    const response = await apiClient.post(`/clips/${clipId}/captions/regenerate`, options)
    return response.data.data
  },

  generateTitles: async (clipId) => {
    const response = await apiClient.post(`/clips/${clipId}/titles/generate`)
    return response.data.data
  },

  generateHashtags: async (clipId, options = {}) => {
    const response = await apiClient.post(`/clips/${clipId}/hashtags/generate`, options)
    return response.data.data
  },

  exportClip: async (clipId, options = {}) => {
    const response = await apiClient.post(`/clips/${clipId}/export`, options)
    return response.data.data
  },

  burnSubtitles: async (clipId, style = {}) => {
    const response = await apiClient.post(`/clips/${clipId}/subtitles/burn`, { style })
    return response.data
  },

  getDownloadUrl: (clipId, filename) => `/api/v1/clips/${clipId}/download/${filename}`,
}

export default clipService