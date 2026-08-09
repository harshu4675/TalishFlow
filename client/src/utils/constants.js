export const APP_NAME = 'TalishFlow'
export const APP_TAGLINE = 'Turn Long Videos Into Viral Shorts Automatically.'
export const APP_VERSION = '1.0.0'

export const API_BASE_URL = '/api/v1'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  OAUTH_CALLBACK: '/auth/callback',

  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  EDITOR: '/editor/:videoId',
  CLIPS: '/clips',
  CLIP_DETAIL: '/clips/:clipId',
  PUBLISHING: '/publishing',
  ANALYTICS: '/analytics',

  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ACCOUNTS: '/settings/accounts',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_BILLING: '/settings/billing',
}

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'],
    SESSION: ['auth', 'session'],
  },
  DASHBOARD: {
    STATS: ['dashboard', 'stats'],
    RECENT_UPLOADS: ['dashboard', 'recent-uploads'],
    RECENT_CLIPS: ['dashboard', 'recent-clips'],
    SCHEDULED: ['dashboard', 'scheduled'],
  },
  VIDEOS: {
    LIST: ['videos'],
    DETAIL: (id) => ['videos', id],
    PROCESSING_STATUS: (id) => ['videos', id, 'status'],
  },
  CLIPS: {
    LIST: ['clips'],
    DETAIL: (id) => ['clips', id],
    BY_VIDEO: (videoId) => ['clips', 'video', videoId],
    WAVEFORM: (id) => ['clips', id, 'waveform'],
    SUBTITLES: (id) => ['clips', id, 'subtitles'],
  },
  PUBLISHING: {
    JOBS: ['publishing', 'jobs'],
    SCHEDULED: ['publishing', 'scheduled'],
    YOUTUBE_DATA: ['publishing', 'youtube', 'data'],
    INSTAGRAM_DATA: ['publishing', 'instagram', 'data'],
  },
  ANALYTICS: {
    OVERVIEW: (period) => ['analytics', 'overview', period],
    CHARTS: (period) => ['analytics', 'charts', period],
    TOP_CONTENT: ['analytics', 'top-content'],
    STORAGE: ['analytics', 'storage'],
    PLATFORMS: (period) => ['analytics', 'platforms', period],
  },
  SETTINGS: {
    PROFILE: ['settings', 'profile'],
    CONNECTED_ACCOUNTS: ['settings', 'connected-accounts'],
  },
  REFRAMING: {
    OPTIONS: (id) => ['reframing', 'options', id],
  },
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

export const PUBLISHING_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const CLIP_COUNT_OPTIONS = [
  { value: 5, label: 'Top 5 Clips' },
  { value: 10, label: 'Top 10 Clips' },
  { value: 20, label: 'Top 20 Clips' },
]

export const EXPORT_QUALITY = {
  HD: '1080p',
  QHD: '2k',
  UHD: '4k',
}

export const EXPORT_CODEC = {
  H264: 'h264',
  H265: 'h265',
  AV1: 'av1',
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

export const PLATFORMS = {
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
}

export const YOUTUBE_VISIBILITY = {
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private',
}

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: Infinity,
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}

export const WS_EVENTS = {
  PROCESSING_START: 'processing:start',
  PROCESSING_PROGRESS: 'processing:progress',
  PROCESSING_COMPLETE: 'processing:complete',
  PROCESSING_ERROR: 'processing:error',
  UPLOAD_PROGRESS: 'upload:progress',
  UPLOAD_COMPLETE: 'upload:complete',
  PUBLISH_START: 'publish:start',
  PUBLISH_PROGRESS: 'publish:progress',
  PUBLISH_COMPLETE: 'publish:complete',
  PUBLISH_ERROR: 'publish:error',
  EXPORT_START: 'export:start',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETE: 'export:complete',
  EXPORT_ERROR: 'export:error',
  TIMELINE_TRIM_START: 'timeline:trim:start',
  TIMELINE_TRIM_COMPLETE: 'timeline:trim:complete',
  TIMELINE_TRIM_ERROR: 'timeline:trim:error',
  TIMELINE_SPLIT_START: 'timeline:split:start',
  TIMELINE_SPLIT_COMPLETE: 'timeline:split:complete',
  TIMELINE_SPLIT_ERROR: 'timeline:split:error',
  TIMELINE_REFRAME_START: 'timeline:reframe:start',
  TIMELINE_REFRAME_COMPLETE: 'timeline:reframe:complete',
  TIMELINE_REFRAME_ERROR: 'timeline:reframe:error',
  SUBTITLES_START: 'subtitles:start',
  SUBTITLES_COMPLETE: 'subtitles:complete',
  SUBTITLES_ERROR: 'subtitles:error',
}

export const PAGE_TITLES = {
  ['/dashboard']: 'Dashboard',
  ['/analytics']: 'Analytics',
  ['/publishing']: 'Publishing',
  ['/settings']: 'Settings',
  ['/settings/profile']: 'Profile',
  ['/settings/accounts']: 'Connected Accounts',
  ['/settings/notifications']: 'Notifications',
  ['/settings/security']: 'Security',
}

export const SUBTITLE_FONTS = [
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Poppins', value: 'Poppins' },
]

export const SUBTITLE_POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
]

export const ANALYTICS_PERIODS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

export const MAX_UPLOAD_RETRIES = 3

export const POLLING_INTERVALS = {
  PROCESSING_QUEUE: 15000,
  PUBLISHING_JOBS: 15000,
  DASHBOARD_STATS: 120000,
}