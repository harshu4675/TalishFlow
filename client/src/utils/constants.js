export const APP_NAME = 'TalishFlow'

export const API_BASE_URL = '/api/v1'

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',

  DASHBOARD: '/dashboard',
  EDITOR: '/editor/:videoId',
  PUBLISHING: '/publishing',
  ANALYTICS: '/analytics',

  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ACCOUNTS: '/settings/accounts',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_SECURITY: '/settings/security',
}

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024,
  CHUNK_SIZE: 5 * 1024 * 1024,
  MAX_CONCURRENT_UPLOADS: 3,
  ACCEPTED_TYPES: {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/x-matroska': ['.mkv'],
    'video/x-msvideo': ['.avi'],
    'video/webm': ['.webm'],
  },
}

export const PROCESSING_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  ANALYZING: 'analyzing',
  DETECTING_SCENES: 'detecting_scenes',
  DETECTING_SPEECH: 'detecting_speech',
  DETECTING_FACES: 'detecting_faces',
  GENERATING_CLIPS: 'generating_clips',
  TRANSCRIBING: 'transcribing',
  CONVERTING: 'converting',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const PROCESSING_STATUS_LABELS = {
  [PROCESSING_STATUS.PENDING]: 'Pending',
  [PROCESSING_STATUS.QUEUED]: 'In Queue',
  [PROCESSING_STATUS.DOWNLOADING]: 'Downloading',
  [PROCESSING_STATUS.ANALYZING]: 'Analyzing Video',
  [PROCESSING_STATUS.DETECTING_SCENES]: 'Detecting Scenes',
  [PROCESSING_STATUS.DETECTING_SPEECH]: 'Detecting Speech',
  [PROCESSING_STATUS.DETECTING_FACES]: 'Detecting Faces',
  [PROCESSING_STATUS.GENERATING_CLIPS]: 'Generating Clips',
  [PROCESSING_STATUS.TRANSCRIBING]: 'Transcribing Audio',
  [PROCESSING_STATUS.CONVERTING]: 'Converting to Vertical',
  [PROCESSING_STATUS.COMPLETED]: 'Completed',
  [PROCESSING_STATUS.FAILED]: 'Failed',
}

export const CAPTION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hinglish', label: 'Hinglish' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
]

export const CAPTION_STYLES = [
  { value: 'professional', label: 'Professional' },
  { value: 'educational', label: 'Educational' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'funny', label: 'Funny' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'minimal', label: 'Minimal' },
]
