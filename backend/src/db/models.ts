import { Collection, BaseDocument } from './JsonDB.js';

// --- Interfaces ---

export interface User extends BaseDocument {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserSetting extends BaseDocument {
  userId: string;
  theme: 'light' | 'dark';
  defaultExportQuality: '1080p' | '2k' | '4k';
  autoSubtitles: boolean;
  defaultCaptionTone: 'professional' | 'funny' | 'luxury' | 'storytelling' | 'educational' | 'minimal' | 'motivational';
  defaultLanguage: 'English' | 'Hindi' | 'Hinglish' | 'Spanish' | 'French' | 'German';
}

export interface OAuthToken extends BaseDocument {
  userId: string;
  platform: 'youtube' | 'instagram';
  accessToken: string;
  refreshToken?: string;
  expiresAt: string; // ISO String
  profileName: string;
  profilePicture?: string;
  handle?: string;
}

export interface VideoMetadata extends BaseDocument {
  userId: string;
  title: string;
  source: 'upload' | 'youtube';
  sourceUrl?: string;
  fileName?: string;
  duration: number; // in seconds
  thumbnail?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
}

export interface WordTranscript {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SubtitleStyle {
  theme: 'neon' | 'classic' | 'minimal' | 'luxury' | 'bold';
  font: 'Manrope' | 'Inter' | 'Montserrat' | 'Impact' | 'Playfair Display';
  color: string; // hex
  highlightColor: string; // hex
  position: 'top' | 'middle' | 'bottom';
  burnedIn: boolean;
  fontSize: number; // in px
}

export interface CropCoords {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage
  height: number; // percentage
}

export interface ClipMetadata extends BaseDocument {
  videoId: string;
  userId: string;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  duration: number; // seconds
  videoUrl: string; // path to temporary static preview
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
  scheduleTime?: string; // ISO string
}

// --- Collections ---

export const Users = new Collection<User>('users');
export const Settings = new Collection<UserSetting>('settings');
export const OAuthTokens = new Collection<OAuthToken>('oauth_tokens');
export const Videos = new Collection<VideoMetadata>('videos');
export const Clips = new Collection<ClipMetadata>('clips');
