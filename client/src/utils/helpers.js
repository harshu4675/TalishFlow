export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const isBrowser = typeof window !== 'undefined'

export function generateId(prefix = '') {
  const id = Math.random().toString(36).slice(2, 9)
  return prefix ? `${prefix}_${id}` : id
}

export function debounce(fn, delay) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function throttle(fn, limit) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      return fn.apply(this, args)
    }
  }
}

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = typeof key === 'function' ? key(item) : item[key]
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {})
}

export function flatten(array, depth = 1) {
  return array.flat(depth)
}

export function unique(array, key) {
  if (key) {
    const seen = new Set()
    return array.filter((item) => {
      const val = typeof key === 'function' ? key(item) : item[key]
      if (seen.has(val)) return false
      seen.add(val)
      return true
    })
  }
  return [...new Set(array)]
}

export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const valA = typeof key === 'function' ? key(a) : a[key]
    const valB = typeof key === 'function' ? key(b) : b[key]
    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

export function omit(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)))
}

export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export async function retry(fn, options = {}) {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options
  let lastError
  let currentDelay = delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await sleep(currentDelay)
        currentDelay *= backoff
      }
    }
  }

  throw lastError
}

export function getFileExtension(filename) {
  if (!filename) return ''
  return filename.split('.').pop().toLowerCase()
}

export function isVideoFile(file) {
  const videoTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-matroska',
    'video/x-msvideo',
    'video/webm',
  ]
  return videoTypes.includes(file.type)
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

export function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
    return true
  } finally {
    document.body.removeChild(textArea)
  }
}

export function parseErrorMessage(error) {
  if (!error) return 'An unexpected error occurred'
  if (typeof error === 'string') return error
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.errors?.[0]?.message) {
    return error.response.data.errors[0].message
  }
  if (error.message) return error.message
  return 'An unexpected error occurred'
}

export function buildQueryString(params) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return new URLSearchParams(filtered).toString()
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

export function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export function truncateMiddle(str, maxLength = 30) {
  if (!str || str.length <= maxLength) return str
  const half = Math.floor(maxLength / 2)
  return `${str.slice(0, half)}...${str.slice(-half)}`
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function toTitleCase(str) {
  if (!str) return ''
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function truncate(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function snakeToTitle(str) {
  if (!str) return ''
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ')
}

export function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
