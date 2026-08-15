import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { parseErrorMessage } from '@/utils/helpers'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = window.__talishflow_access_token__
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

http.interceptors.response.use(
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
            resolve(http(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await http.post('/auth/refresh')
        const { accessToken } = response.data

        window.__talishflow_access_token__ = accessToken
        isRefreshing = false

        onTokenRefreshed(accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return http(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []

        window.__talishflow_access_token__ = null

        window.dispatchEvent(new CustomEvent('auth:logout'))

        return Promise.reject(refreshError)
      }
    }

    error.userMessage = parseErrorMessage(error)

    return Promise.reject(error)
  }
)

export const httpUpload = (url, formData, onProgress, config = {}) =>
  http.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(
          Math.round((progressEvent.loaded * 100) / progressEvent.total),
          progressEvent
        )
      }
    },
    ...config,
  })

export default http
