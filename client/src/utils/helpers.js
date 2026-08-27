export function generateId(prefix = '') {
  const id = Math.random().toString(36).slice(2, 9)
  return prefix ? `${prefix}_${id}` : id
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

export function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
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

  const data = error.response?.data
  const baseMessage =
    data?.message || error.userMessage || error.message || 'An unexpected error occurred'

  // Surface field-level details behind generic backend messages
  // (e.g. "Validation failed" → which field and why).
  const fieldError = data?.errors?.[0]
  if (fieldError?.message && baseMessage === 'Validation failed') {
    const fieldPrefix = fieldError.field ? `${fieldError.field}: ` : ''
    return `Validation failed — ${fieldPrefix}${fieldError.message}`
  }

  // Network-level failures without a response body
  if (!error.response && error.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.'
  }
  if (!error.response && !data) {
    return 'Could not reach the server. Please check your connection and try again.'
  }

  return baseMessage
}
