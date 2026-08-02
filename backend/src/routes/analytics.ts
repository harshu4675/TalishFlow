import express from 'express';
import { Videos, Clips, OAuthTokens } from '../db/models.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const userVideos = await Videos.find({ userId });
    const userClips = await Clips.find({ userId });
    const userTokens = await OAuthTokens.find({ userId });

    // Compute mock metrics based on user's content and connected accounts
    const videoCount = userVideos.length;
    const clipCount = userClips.length;
    const connectedCount = userTokens.length;

    // Simulate luxury-grade statistics
    const hasYouTube = userTokens.some((t) => t.platform === 'youtube');
    const hasInstagram = userTokens.some((t) => t.platform === 'instagram');

    const youtubeViews = hasYouTube ? 452800 + (clipCount * 1250) : 0;
    const instagramReach = hasInstagram ? 218900 + (clipCount * 940) : 0;
    const totalViews = youtubeViews + instagramReach;

    const viewsGrowth = hasYouTube || hasInstagram ? 18.4 : 0;
    const activeAudience = hasYouTube || hasInstagram ? 89450 : 0;
    const audienceGrowth = hasYouTube || hasInstagram ? 12.1 : 0;

    // Daily views data over last 7 days for Charting
    const viewsChartData = [
      { day: 'Mon', YouTube: hasYouTube ? 32000 : 0, Instagram: hasInstagram ? 15000 : 0 },
      { day: 'Tue', YouTube: hasYouTube ? 38000 : 0, Instagram: hasInstagram ? 18000 : 0 },
      { day: 'Wed', YouTube: hasYouTube ? 41000 : 0, Instagram: hasInstagram ? 21000 : 0 },
      { day: 'Thu', YouTube: hasYouTube ? 49000 : 0, Instagram: hasInstagram ? 24000 : 0 },
      { day: 'Fri', YouTube: hasYouTube ? 58000 : 0, Instagram: hasInstagram ? 31000 : 0 },
      { day: 'Sat', YouTube: hasYouTube ? 71000 : 0, Instagram: hasInstagram ? 39000 : 0 },
      { day: 'Sun', YouTube: hasYouTube ? 84000 : 0, Instagram: hasInstagram ? 48000 : 0 },
    ];

    // Storage calculation (videos take up ~25MB, clips ~5MB)
    const storageUsed = (videoCount * 24.2) + (clipCount * 4.8);
    const storageCapacity = 10000; // 10GB in MB
    const storagePercentage = parseFloat(((storageUsed / storageCapacity) * 100).toFixed(1));

    return res.json({
      summary: {
        totalViews,
        viewsGrowth,
        activeAudience,
        audienceGrowth,
        totalVideosUploaded: videoCount,
        totalClipsGenerated: clipCount,
        connectedPlatforms: connectedCount,
        storageUsedMB: parseFloat(storageUsed.toFixed(1)),
        storageCapacityMB: storageCapacity,
        storagePercentage,
      },
      charts: {
        viewsHistory: viewsChartData,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve analytics metrics.' });
  }
});

export default router;
