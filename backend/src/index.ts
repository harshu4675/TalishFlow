import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Import routers
import authRouter from './routes/auth.js';
import settingsRouter from './routes/settings.js';
import oauthRouter from './routes/oauth.js';
import videosRouter from './routes/videos.js';
import clipsRouter from './routes/clips.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off for custom multi-media streaming/source references
  })
);

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

// Serve static uploaded videos/previews
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routers
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/videos', videosRouter);
app.use('/api/clips', clipsRouter);
app.use('/api/analytics', analyticsRouter);

// Serve built frontend assets in production mode
const FRONTEND_DIST = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'TalishFlow API Service',
      status: 'Active',
      environment: 'Development',
    });
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.',
  });
});

app.listen(PORT, () => {
  console.log(`[TalishFlow] Premium Backend running on port ${PORT}`);
});
