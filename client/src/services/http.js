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

/** Access token lives only in memory — never localStorage (XSS-safe). */
http.interceptors.request.use((config) => {
  const token = window.__talishflow_access_token__
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

function rejectRefreshSubscribers() {
  refreshSubscribers = []
}

/** Retry policy: only safe, idempotent reads, never on a client abort. */
const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options'])
const MAX_RETRIES = 2
const RETRY_DELAY_MS = [400, 1200]

function shouldRetry(error) {
  const config = error.config || {}
  if (!IDEMPOTENT_METHODS.has(config.method)) return false
  if ((config.__retryCount || 0) >= MAX_RETRIES) return false
  if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') return false

  const status = error.response?.status
  // Retriable: network failure / timeout, rate limit, or transient 5xx.
  return !status || status === 408 || status === 429 || status >= 500
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

http.interceptors.response.use(
  (response) => {
    if (response.data?.accessToken) {
      window.__talishflow_access_token__ = response.data.accessToken
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config || {}

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue the request until the refresh completes.
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
              reject(error)
              return
            }
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
        rejectRefreshSubscribers()
        window.__talishflow_access_token__ = null
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    // Transient failure on an idempotent read → silent retry with backoff.
    if (shouldRetry(error)) {
      originalRequest.__retryCount = (originalRequest.__retryCount || 0) + 1
      await sleep(RETRY_DELAY_MS[originalRequest.__retryCount - 1] ?? 1500)
      return http(originalRequest)
    }

    error.userMessage = parseErrorMessage(error)
    error.code = error.response?.data?.error?.code || error.code

    return Promise.reject(error)
  }
)

export const httpUpload = (url, formData, onProgress, config = {}) =>
  http.post(url, formData, {
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
