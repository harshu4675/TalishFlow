import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { parseErrorMessage } from '@/utils/helpers'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  withCredentials: true, // Required for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = window.__talishflow_access_token__

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const csrfToken = getCsrfToken()
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => {
    if (response.data?.accessToken) {
      window.__talishflow_access_token__ = response.data.accessToken
    }
    return response
  },

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data

        window.__talishflow_access_token__ = accessToken
        isRefreshing = false

        onTokenRefreshed(accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []

        window.__talishflow_access_token__ = null

        window.dispatchEvent(new CustomEvent('auth:logout'))

        return Promise.reject(refreshError)
      }
    }

    const message = parseErrorMessage(error)
    error.userMessage = message

    return Promise.reject(error)
  }
)

function getCsrfToken() {
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  return metaTag?.content || null
}

export const apiClient = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  upload: (url, formData, onProgress) => {
    return api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // No timeout for uploads
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent, progressEvent)
        }
      },
    })
  },
}

export default api
