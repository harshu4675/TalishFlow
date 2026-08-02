# 🌊 TalishFlow — Premium Creator Automation Studio

TalishFlow is a production-grade, premium luxury SaaS platform designed to transform long-form video assets into high-converting 9:16 vertical clips (Shorts, Reels). 

Featuring a modern Soft UI design reminiscent of high-end tools like Linear, Stripe, and Vercel, TalishFlow uses **real computational audio peak, silence, and scene change detection** combined with word-level Whisper transcription and luxury styling templates.

---

## 🚀 Quick Start Commands

```bash
# Install dependencies for root, frontend, and backend
npm run install:all

# Build both React frontend and Express backend
npm run build:all

# Run the complete application (Runs unified on port 5000)
npm run start
```

For developer watch mode with hot reloading:
```bash
# Runs frontend on port 3000 and backend on port 5000 concurrently
npm run dev
```

---

## 📂 Repository Folder Structure

```
TalishFlow/
├── backend/                  # TypeScript & Express.js API Services
│   ├── src/
│   │   ├── db/               # Local JSON Mongoose-like Repository Engine
│   │   │   ├── JsonDB.ts     # Generic Collection File Management
│   │   │   └── models.ts     # Collection Declarations and TypeScript Schemas
│   │   ├── middleware/       # JWT and Secure Cookie Handlers
│   │   │   └── auth.ts
│   │   ├── routes/           # REST Endpoints
│   │   │   ├── auth.ts       # Secure Registration, Logins & Resets
│   │   │   ├── settings.ts   # Platform Preferences & Defaults
│   │   │   ├── oauth.ts      # Google & Meta Secure Connection Pipelines
│   │   │   ├── videos.ts     # Media Import/Upload Controllers
│   │   │   ├── clips.ts      # Crop, Subtitle Style, Export & Publishing
│   │   │   └── analytics.ts  # Aggregate social performance metrics
│   │   ├── services/         # Real Speech & Subtitling Algorithms
│   │   │   ├── clipService.ts
│   │   │   └── transcriptionService.ts
│   │   └── index.ts          # Main Express Entry (Serves production build)
│   ├── tsconfig.json
│   └── package.json
├── frontend/                 # React 19, TypeScript & Tailwind CSS v4 Studio Client
│   ├── src/
│   │   ├── components/       # Visual Elements
│   │   │   ├── LandingPage.tsx  # Luxury intro page with Interactive Crop Simulator
│   │   │   ├── Auth.tsx         # Account Credentials Portal
│   │   │   ├── Dashboard.tsx    # Workspace analytics, counters, and project tables
│   │   │   ├── Studio.tsx       # Timeline segmenter, reframe preview, subtitle engine
│   │   │   ├── ConnectedAccounts.tsx # OAuth manager showing platform limitations
│   │   │   └── Settings.tsx     # Default render and password reset managers
│   │   ├── App.tsx           # Global state orchestrator and toast notifications
│   │   ├── types.ts          # Global interfaces
│   │   └── index.css         # Tailwind v4 variables and custom Soft UI keyframes
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
└── package.json              # Monorepo workspaces coordinator
```

---

## 🔧 Environment Variables

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=talishflow-luxury-saas-secret-key-2026
```

---

## 🛠 Development Workflow

### Requirements
- **Node.js**: v18+ (tested on v22)
- **NPM**: v9+ (tested on v10)

### Run in Development
To run in concurrent hot-reload mode:
1. Run `npm run install:all` in the root folder.
2. Run `npm run dev` in the root folder.
3. Open `http://localhost:3000` in your web browser. Any API requests are proxied directly to the backend running on `http://localhost:5000`.

---

## 📦 Production Build & Deployment

To deploy TalishFlow to a single-instance VPS, Heroku, or Render:

1. Compile all TypeScript and build optimized production chunks:
   ```bash
   npm run build:all
   ```
2. Start the backend:
   ```bash
   npm run start
   ```
The backend automatically detects the built assets in `frontend/dist` and serves them statically.

---

## 📡 API Documentation

### 🔐 Authentication
* `POST /api/auth/register` — Create a secure user account.
* `POST /api/auth/login` — Sign in and issue HttpOnly secure cookie tokens.
* `POST /api/auth/logout` — Revoke and clean cookies.
* `GET /api/auth/me` — Securely retrieve active user profile and preferences.
* `POST /api/auth/reset-password` — Change password.

### ⚙ Settings
* `GET /api/settings` — Get default workspace rendering configurations.
* `PUT /api/settings` — Update preferences (language, default tone, quality).

### 🔗 OAuth Platform Connection
* `GET /api/oauth/status` — Get connection status of YouTube and Instagram.
* `GET /api/oauth/connect/:platform` — Start OAuth redirection flow.
* `POST /api/oauth/callback/:platform` — Accept callback tokens and connect accounts.
* `DELETE /api/oauth/disconnect/:platform` — Remove connected platform credentials.

### 📁 Video Project Pipelines
* `POST /api/videos/upload` — Multi-part file uploader (MP4, MOV, MKV, AVI).
* `POST /api/videos/youtube` — Import public YouTube link.
* `GET /api/videos` — Retrieve project logs.
* `GET /api/videos/:id` — Get single project status, transcript, and auto-moment clips.

### ✂ Clip Timelines & Publishing
* `GET /api/clips/:id` — Get crop metadata, subtitle styling, and transcript.
* `PUT /api/clips/:id` — Save custom crop X coordinates, edit subtitle styles, captions, or tags.
* `POST /api/clips/:id/export` — Trigger progressive render simulation.
* `POST /api/clips/:id/publish` — Dispatch to YouTube Shorts/Instagram Reels or schedule it.

### 📊 Analytics
* `GET /api/analytics` — Aggregate weekly views growth and cloud storage capacity metrics.

---

## ❓ Troubleshooting

### 1. Port 5000 or 3000 is occupied
You can modify the default port in `backend/src/index.ts` or set the `PORT` environment variable.

### 2. Upstream dependency conflicts on NPM install
Use `--legacy-peer-deps` or use our configured script `npm run install:all` which installs folders with safe peer resolution.

---

## 🛡 Security & Optimization
- **HTTP Security Headers**: Powered by `helmet` to block clickjacking and mime-sniffing.
- **Input Sanitization**: Handled with `zod` schema validations on critical routers.
- **Rate Limiting**: Enforced on `/api` namespace to restrict abuse.
- **Lazy Loading**: Code splitting used across chunk renders for a flawless LightHouse score.
