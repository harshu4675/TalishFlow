import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Videos, Clips } from '../db/models.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { generateAutoClips } from '../services/clipService.js';

const router = express.Router();

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for demo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.mkv', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported: MP4, MOV, MKV, AVI.'));
    }
  },
});

// Upload Video File
router.post('/upload', authMiddleware, upload.single('video'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const { originalname, filename } = req.file;

    // Insert metadata
    const video = await Videos.insertOne({
      userId,
      title: originalname.replace(/\.[^/.]+$/, ""), // remove extension
      source: 'upload',
      fileName: filename,
      duration: Math.floor(Math.random() * 90) + 60, // random duration 60s - 150s
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      status: 'processing',
    });

    // Start background simulation
    triggerBackgroundClipGeneration(video.id, video.userId, 5);

    return res.status(201).json({
      message: 'Video uploaded successfully! Analyzing best moments...',
      video,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload video.' });
  }
});

// Paste YouTube URL
router.post('/youtube', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { url, clipCount } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required.' });
    }

    // Basic regex checks for Youtube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      return res.status(400).json({ error: 'Please enter a valid YouTube video URL.' });
    }

    // Try to extract an interesting title from the url or fallback
    let youtubeTitle = 'How to Build a Highly Successful Premium Brand in 2026';
    if (url.includes('tech') || url.includes('code')) {
      youtubeTitle = 'Why Artificial Intelligence is Transforming Creative Workflows';
    } else if (url.includes('funny') || url.includes('joke') || url.includes('roast')) {
      youtubeTitle = 'How Real Standup Comedians React to Uncomfortable Questions';
    } else if (url.includes('gym') || url.includes('fitness') || url.includes('grind')) {
      youtubeTitle = 'The Absolute Mindset Required to Reach the Top 1% of Athletes';
    } else if (url.includes('mystery') || url.includes('history')) {
      youtubeTitle = 'The Ancient Secrets Hidden Deep Inside Old Cartography Maps';
    }

    const duration = Math.floor(Math.random() * 300) + 120; // 2 - 7 minutes
    const video = await Videos.insertOne({
      userId,
      title: youtubeTitle,
      source: 'youtube',
      sourceUrl: url,
      duration,
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      status: 'processing',
    });

    const clipsToGen = clipCount ? parseInt(clipCount) : 5;
    triggerBackgroundClipGeneration(video.id, video.userId, clipsToGen);

    return res.status(201).json({
      message: 'YouTube video imported successfully! Analyzing best moments...',
      video,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process YouTube import.' });
  }
});

// Get User Videos
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const list = await Videos.find({ userId });
    // Sort by createdAt descending
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(sorted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// Get Single Video Details
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const video = await Videos.findOne({ id: req.params.id, userId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    const videoClips = await Clips.find({ videoId: video.id });
    return res.json({ video, clips: videoClips });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve video metadata.' });
  }
});

// Simulate background clip generation with delay
function triggerBackgroundClipGeneration(videoId: string, userId: string, count: number) {
  setTimeout(async () => {
    try {
      const video = await Videos.findOne({ id: videoId });
      if (!video) return;

      // Generate automoments
      const generated = generateAutoClips(video, count);
      for (const item of generated) {
        await Clips.insertOne(item);
      }

      // Mark video as ready
      await Videos.updateOne({ id: videoId }, { status: 'ready' });
      console.log(`Successfully generated ${count} auto clips for video ${videoId}`);
    } catch (err) {
      console.error('Error during background clip analysis:', err);
      await Videos.updateOne({ id: videoId }, { status: 'failed' });
    }
  }, 5000); // 5 seconds processing simulation
}

export default router;
