import express from 'express';
import { Clips, OAuthTokens } from '../db/models.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get single clip metadata
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const clip = await Clips.findOne({ id: req.params.id, userId });
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found.' });
    }
    return res.json(clip);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch clip details.' });
  }
});

// Update clip (custom crop, captions, subtitles style)
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, caption, hashtags, subtitleStyle, cropCoordinates, trackingType } = req.body;

    const clip = await Clips.findOne({ id: req.params.id, userId });
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found or unauthorized.' });
    }

    const updated = await Clips.updateOne(
      { id: clip.id },
      {
        title: title || clip.title,
        caption: caption !== undefined ? caption : clip.caption,
        hashtags: hashtags !== undefined ? hashtags : clip.hashtags,
        subtitleStyle: subtitleStyle ? { ...clip.subtitleStyle, ...subtitleStyle } : clip.subtitleStyle,
        cropCoordinates: cropCoordinates ? { ...clip.cropCoordinates, ...cropCoordinates } : clip.cropCoordinates,
        trackingType: trackingType || clip.trackingType,
      }
    );

    return res.json({
      message: 'Clip updated successfully',
      clip: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update clip parameters.' });
  }
});

// Export clip (Simulate rendering)
router.post('/:id/export', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { resolution } = req.body; // '1080p' | '2k' | '4k'
    
    const clip = await Clips.findOne({ id: req.params.id, userId });
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    const resSelected = resolution || '1080p';
    
    // Generate static preview asset url simulating high quality render
    const exportUrl = `https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-smartphone-with-a-vertical-screen-41716-large.mp4`;

    return res.json({
      message: 'Export completed successfully!',
      downloadUrl: exportUrl,
      fileName: `TalishFlow_${clip.title.replace(/\s+/g, '_')}_${resSelected}.mp4`,
      resolution: resSelected,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to compile and export vertical clip.' });
  }
});

// Publish or Schedule Clip to Connected Platforms
router.post('/:id/publish', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { platforms, scheduleTime } = req.body; // platforms: ['youtube', 'instagram'], scheduleTime?: ISOString

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'Please select at least one social platform to publish.' });
    }

    const clip = await Clips.findOne({ id: req.params.id, userId });
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    // Check if selected platforms are connected in OAuth
    const connectedTokens = await OAuthTokens.find({ userId });
    for (const p of platforms) {
      const isConnected = connectedTokens.some((t) => t.platform === p);
      if (!isConnected) {
        return res.status(400).json({
          error: `The account for ${p === 'youtube' ? 'YouTube' : 'Instagram'} is not connected. Please connect it in account settings first!`,
        });
      }
    }

    if (scheduleTime) {
      // Schedule post
      const updated = await Clips.updateOne(
        { id: clip.id },
        {
          publishStatus: 'scheduled',
          publishPlatform: platforms as ('youtube' | 'instagram')[],
          scheduleTime,
        }
      );
      return res.json({
        message: `Clip scheduled successfully for ${new Date(scheduleTime).toLocaleString()}`,
        clip: updated,
      });
    } else {
      // Direct publishing simulation
      await Clips.updateOne({ id: clip.id }, { publishStatus: 'publishing' });

      // Simulate network delay for API calls
      setTimeout(async () => {
        await Clips.updateOne(
          { id: clip.id },
          {
            publishStatus: 'published',
            publishPlatform: platforms as ('youtube' | 'instagram')[],
          }
        );
      }, 4000);

      return res.json({
        message: 'Publishing process started in the background. Check status on dashboard.',
        status: 'publishing',
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to initiate publish process.' });
  }
});

export default router;
