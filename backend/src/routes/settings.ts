import express from 'express';
import { Settings } from '../db/models.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      settings = await Settings.insertOne({
        userId,
        theme: 'light',
        defaultExportQuality: '1080p',
        autoSubtitles: true,
        defaultCaptionTone: 'luxury',
        defaultLanguage: 'English',
      });
    }

    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { theme, defaultExportQuality, autoSubtitles, defaultCaptionTone, defaultLanguage } = req.body;

    const existing = await Settings.findOne({ userId });
    if (!existing) {
      const created = await Settings.insertOne({
        userId,
        theme: theme || 'light',
        defaultExportQuality: defaultExportQuality || '1080p',
        autoSubtitles: autoSubtitles !== undefined ? autoSubtitles : true,
        defaultCaptionTone: defaultCaptionTone || 'luxury',
        defaultLanguage: defaultLanguage || 'English',
      });
      return res.json(created);
    }

    const updated = await Settings.updateOne(
      { userId },
      {
        theme: theme !== undefined ? theme : existing.theme,
        defaultExportQuality: defaultExportQuality !== undefined ? defaultExportQuality : existing.defaultExportQuality,
        autoSubtitles: autoSubtitles !== undefined ? autoSubtitles : existing.autoSubtitles,
        defaultCaptionTone: defaultCaptionTone !== undefined ? defaultCaptionTone : existing.defaultCaptionTone,
        defaultLanguage: defaultLanguage !== undefined ? defaultLanguage : existing.defaultLanguage,
      }
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;
