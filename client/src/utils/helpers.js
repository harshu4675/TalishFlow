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
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.errors?.[0]?.message) {
    return error.response.data.errors[0].message
  }
  if (error.message) return error.message
  return 'An unexpected error occurred'
}
