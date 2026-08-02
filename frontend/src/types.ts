export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserSetting {
  userId: string;
  theme: 'light' | 'dark';
  defaultExportQuality: '1080p' | '2k' | '4k';
  autoSubtitles: boolean;
  defaultCaptionTone: 'professional' | 'funny' | 'luxury' | 'storytelling' | 'educational' | 'minimal' | 'motivational';
  defaultLanguage: 'English' | 'Hindi' | 'Hinglish' | 'Spanish' | 'French' | 'German';
}

export interface OAuthStatus {
  connected: boolean;
  profileName?: string;
  profilePicture?: string;
  handle?: string;
  expiresAt?: string;
}

export interface ConnectedAccountsStatus {
  youtube: OAuthStatus;
  instagram: OAuthStatus;
}

export interface VideoMetadata {
  id: string;
  userId: string;
  title: string;
  source: 'upload' | 'youtube';
  sourceUrl?: string;
  fileName?: string;
  duration: number;
  thumbnail?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface WordTranscript {
  word: string;
  start: number; // in seconds, relative to clip
  end: number;   // in seconds, relative to clip
}

export interface SubtitleStyle {
  theme: 'neon' | 'classic' | 'minimal' | 'luxury' | 'bold';
  font: 'Manrope' | 'Inter' | 'Montserrat' | 'Impact' | 'Playfair Display';
  color: string;
  highlightColor: string;
  position: 'top' | 'middle' | 'bottom';
  burnedIn: boolean;
  fontSize: number;
}

export interface CropCoords {
  x: number; // center position percentage (0-100)
  y: number;
  width: number;
  height: number;
}

export interface ClipMetadata {
  id: string;
  videoId: string;
  userId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  videoUrl: string;
  subtitleStyle: SubtitleStyle;
  transcript: WordTranscript[];
  caption: string;
  hashtags: string;
  suggestedTitles: string[];
  trackingType: 'face' | 'object' | 'motion' | 'manual';
  cropCoordinates: CropCoords;
  publishStatus: 'idle' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishPlatform?: ('youtube' | 'instagram')[];
  publishError?: string;
  scheduleTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  viewsGrowth: number;
  activeAudience: number;
  audienceGrowth: number;
  totalVideosUploaded: number;
  totalClipsGenerated: number;
  connectedPlatforms: number;
  storageUsedMB: number;
  storageCapacityMB: number;
  storagePercentage: number;
}

export interface ViewsHistoryItem {
  day: string;
  YouTube: number;
  Instagram: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  charts: {
    viewsHistory: ViewsHistoryItem[];
  };
}
