import http from './http'

export const processingService = {
  getQueue: async () => {
    const response = await http.get('/processing/queue')
    return response.data.data
  },
}

export default processingService
