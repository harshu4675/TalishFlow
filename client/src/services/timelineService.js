import http from './http'

export const timelineService = {
  getWaveform: async (clipId) => {
    const response = await http.get(`/timeline/clips/${clipId}/waveform`)
    return response.data.data
  },

  trimClip: async (clipId, startTime, endTime) => {
    const response = await http.post(`/timeline/clips/${clipId}/trim`, {
      startTime,
      endTime,
    })
    return response.data
  },

  splitClip: async (clipId, splitTime) => {
    const response = await http.post(`/timeline/clips/${clipId}/split`, {
      splitTime,
    })
    return response.data
  },

  getReframingOptions: async (clipId) => {
    const response = await http.get(`/timeline/clips/${clipId}/reframing/options`)
    return response.data.data
  },

  applyReframing: async (clipId, cropData) => {
    const response = await http.post(`/timeline/clips/${clipId}/reframing/apply`, {
      cropData,
    })
    return response.data
  },

  getReframingPreviewUrl: (clipId, cropData, time = 1) => {
    const { x, y, width, height } = cropData
    return `/api/v1/timeline/clips/${clipId}/reframing/preview?x=${x}&y=${y}&width=${width}&height=${height}&time=${time}`
  },
}

export default timelineService
