export const queryKeys = {
  auth: {
    session: ['auth', 'session'],
  },
  dashboard: {
    stats: ['dashboard', 'stats'],
    recentUploads: ['dashboard', 'recent-uploads'],
    recentClips: ['dashboard', 'recent-clips'],
    scheduled: ['dashboard', 'scheduled'],
    processingQueue: ['dashboard', 'processing-queue'],
    storage: ['dashboard', 'storage'],
    charts: (period) => ['dashboard', 'charts', period],
  },
  videos: {
    list: (params) => ['videos', params],
    detail: (id) => ['videos', id],
  },
  clips: {
    list: (params) => ['clips', params],
    byVideo: (videoId) => ['clips', 'video', videoId],
    detail: (id) => ['clips', id],
    waveform: (id) => ['clips', id, 'waveform'],
    reframeOptions: (id) => ['clips', id, 'reframe-options'],
  },
  publishing: {
    jobs: (params) => ['publishing', 'jobs', params],
    youTubeData: ['publishing', 'youtube-data'],
    instagramData: ['publishing', 'instagram-data'],
  },
  analytics: {
    overview: (period) => ['analytics', 'overview', period],
    topContent: ['analytics', 'top-content'],
    platforms: (period) => ['analytics', 'platforms', period],
  },
  settings: {
    profile: ['settings', 'profile'],
    connectedAccounts: ['settings', 'connected-accounts'],
  },
}
