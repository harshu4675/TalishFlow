# 🏛 Project Documentation — TalishFlow Creator Automation Suite

## 1. Vision
Content creators represent the new media economy, yet distributing high-quality vertical content (Shorts, Reels) remains an exhausting chore of manual reframing, cutting, transcribing, and formatting. Existing "AI" solutions are either fully fake mock platforms or clunky, low-grade tools with generic templates.

**TalishFlow** is engineered to bridge this gap as a high-end, premium SaaS workspace. It provides a visual timeline editor, real motion and speech peak analysis, pixel-perfect 9:16 re-cropping, elegant brand typography templates, and bulletproof official OAuth publishing channels.

---

## 2. Objectives
* **Aesthetic Excellence:** Provide a premium luxury design system inspired by Vercel and Stripe—focusing on minimalist whitespace, premium shadows, and smooth micro-animations.
* **True Automation:** Deploy genuine computational clip detection (speech peak metrics and silence cuts) instead of fake AI loading indicators.
* **Format Integrity:** Retain original bitrate and high-resolution parameters (1080P, 2K, 4K) during reframing with zero stretch.
* **Security & Compliance:** Fully respect and implement Google (YouTube) and Meta (Instagram) official developer APIs, detailing known limitations cleanly to the user.

---

## 3. Features
* **Double-Input Pipeline:** Submit public YouTube URLs or upload local source video files (MP4, MOV, MKV, AVI).
* **Automated Slicing:** Extract top 3, 5, 10, or 20 moments based on high-retention cues.
* **Smart Vertical Crop:** Visually adjust and lock horizontal offset parameters (X coordinates) on a highly-interactive 9:16 Canvas overlay.
* **Luxury Subtitle Engine:** Burn or export active-word synchronized subtitles utilizing high-end brand typography presets (Neon, Classic, Minimal, Luxury, Bold).
* **Tone-Driven Captions:** Automatically structure social descriptions tailored to funny, luxury, educational, motivational, or storytelling brand voices.
* **Social Scheduling Queue:** Post immediately or schedule release timestamps across connected profiles.
* **High-Grade Analytics:** Track weekly reach metrics and local cloud storage limits via custom SVG visualizations.

---

## 4. Architecture
TalishFlow is structured as an integrated full-stack Monorepo using a robust Node.js API service and a cutting-edge React browser client.

```
                  ┌─────────────────────────────────┐
                  │      React 19 Studio Client     │
                  │   (Vite, Tailwind v4, Motion)   │
                  └────────────────┬────────────────┘
                                   │ HTTPS Requests & Cookies
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Express.js TS API Service    │
                  │  (Helmet, Rate-Limiting, Multer)│
                  └───────┬─────────────────┬───────┘
                          │                 │
                          ▼ Read / Write    ▼ Media Algorithms
                  ┌───────────────┐ ┌──────────────────────────────┐
                  │ Generic JSON  │ │      Analysis Engines        │
                  │  Database     │ │ (Speech Peak, Whisper Sync)  │
                  └───────────────┘ └──────────────────────────────┘
```

---

## 5. Folder Structure
The workspace enforces clean separation of concerns, housing backend server configurations in `backend/` and frontend visual elements in `frontend/`.

* **`backend/src/db/`**: Houses our custom file-based generic transactional database engine which mimics Mongoose models perfectly with no native dependencies.
* **`backend/src/routes/`**: Handles REST controller separations for Auth, Settings, OAuth status, and Media timeline operations.
* **`backend/src/services/`**: Formulates algorithmic structures for syllable duration sync and audio peaks.
* **`frontend/src/components/`**: Standardizes visual dashboards, timeline studios, connected channels, and billing tiers.

---

## 6. Authentication
Authentication is enforced utilizing state-of-the-art secure practices:
1. **Password Hashing:** Implemented with `bcryptjs` utilizing 10 salt rounds.
2. **Access Tokens:** Handled via JSON Web Tokens (JWT) signed with a 256-bit cryptographically secure secret.
3. **Transmission:** Passed securely using `HttpOnly`, `SameSite: Lax` secure cookies to prevent Cross-Site Scripting (XSS) and CSRF hijack attempts.
4. **Session Handshake:** The frontend initiates a startup query to `/api/auth/me`. If valid, session profiles and user settings are restored automatically.

---

## 7. APIs
Comprehensive endpoint routing is detailed in our root `README.md` file. All controllers validate incoming parameters using explicit schemas and throw semantic HTTP error status codes.

---

## 8. Database Schema
Our generic JSON database maps explicit collections inside `/backend/data/` folders:

### Users (`users.json`)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}
```

### Settings (`settings.json`)
```typescript
interface UserSetting {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  defaultExportQuality: '1080p' | '2k' | '4k';
  autoSubtitles: boolean;
  defaultCaptionTone: string;
  defaultLanguage: string;
  createdAt: string;
  updatedAt: string;
}
```

### Videos (`videos.json`)
```typescript
interface VideoMetadata {
  id: string;
  userId: string;
  title: string;
  source: 'upload' | 'youtube';
  sourceUrl?: string;
  fileName?: string;
  duration: number;
  thumbnail: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}
```

### Clips (`clips.json`)
```typescript
interface ClipMetadata {
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
  trackingType: 'face' | 'motion' | 'manual';
  cropCoordinates: CropCoords;
  publishStatus: 'idle' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishPlatform?: string[];
  scheduleTime?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Video Processing Pipeline
1. **Ingestion:** Videos are saved inside temporary system buffer paths (`/backend/uploads/`) or parsed from YouTube links.
2. **Analysis:** The platform scans the audio track to isolate moments where speech frequency spikes or silent gaps break.
3. **Re-cropping (9:16):** Calculates face and motion boundaries. The center viewport parameters are rendered as real-time relative CSS translation offsets inside the browser, allowing responsive manual micro-adjustments with no video stutter.
4. **Encoding & Export:** Trims are compiled using original bitrates in H.264 formats across selected vertical standard outputs.

---

## 10. Clip Detection Logic
Rather than random segmentation, TalishFlow uses an algorithmic evaluation flow:
```
[Video Audio Track] ──► [Frequency Analysis] ──► [Filter Low-pass Silence] 
                                                        │
                                                        ▼
[Top Moment Triggers] ◄── [Score Peaks / High CTR] ◄── [Cluster Speech Spikes]
```
By mapping the duration of consecutive speech clusters, the engine isolates high-impact clips between 15 and 30 seconds—the gold standard of Shorts retention.

---

## 11. Subtitle Engine
Unlike primitive subtitle renderers, our **Whisper Sync Subtitle Engine** calculates word-level duration matrices. Each word is mapped to relative starting and ending milliseconds inside the clip.

When the video timeline changes, the React studio compares `video.currentTime` to current word boundaries:
```typescript
const isActive = currentTime >= word.start && currentTime <= word.end;
```
If active, a `.subtitle-word-active` CSS scale-pulse transform is triggered, drawing immediate focus.

---

## 12. Publishing Workflow
Social publishing strictly complies with official developer network guidelines:
* **YouTube Pipeline:** Dispatched as standard video payloads to Google accounts via YouTube Data API v3. Videos under 60s with vertical aspects are automatically indexed as Shorts.
* **Instagram Pipeline:** Shipped to Meta Business accounts via Meta Graph APIs.
* **Scheduling:** Queued in-memory on the backend and released using cron schedules.

---

## 13. Security
* **Helmet.js Headers:** Active on Express to enforce strict transport security rules.
* **Rate Limits:** Restricts malicious automated scrapers to 200 API calls per 15 minutes.
* **CSRF Mitigation:** Secure cookie configurations with strict CORS origin verification bounds.
* **Environment Sandboxing:** Critical configuration secrets are managed through isolated system variables.

---

## 14. Scalability
* **Stateless API:** Node services are easily clusterable inside containerized environments (Kubernetes/Docker).
* **Client-Side Rendering:** Media preview translation and subtitle alignments are delegated to the browser canvas, drastically decreasing server CPU workloads.
* **Temporary Cache:** Video buffers and render artifacts are scheduled for deletion after 24 hours.

---

## 15. Deployment
* **Static Assets:** React build compiles down to minified CSS and JS chunks served statically by Express.
* **Instance Requirements:** Standard Single-Instance Cloud Servers (e.g. AWS EC2, DigitalOcean, Heroku) can easily run the application on port 5000.

---

## 16. Maintenance
* Check database records regularly for dangling video IDs.
* Purge `/uploads` files older than 24 hours via daily automation cron jobs.

---

## 17. Known Limitations
* **Instagram OAuth:** Direct automated publishing requires Business profiles; personal accounts are restricted by Meta Graph permissions.
* **Browser Video Formats:** Standard HTML5 players only support native playback of H.264/AAC MP4, WebM, and Ogg. MKV or AVI uploads can be reframed but require conversion on export.

---

## 18. Future Roadmap
* **Audio Sentiment Analysis:** Expand the clip detection logic to integrate semantic humor, applause, or laughter mapping.
* **Interactive Timeline Trim Bars:** Enable tactile drag handlers to shorten or lengthen clip durations manually.
* **Collaborative Shared Links:** Share vertical reframes directly with social team managers for approval feedback comments.
