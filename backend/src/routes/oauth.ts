import express from 'express';
import { OAuthTokens } from '../db/models.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get connection status
router.get('/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const tokens = await OAuthTokens.find({ userId });
    
    const youtube = tokens.find((t) => t.platform === 'youtube');
    const instagram = tokens.find((t) => t.platform === 'instagram');

    return res.json({
      youtube: youtube
        ? {
            connected: true,
            profileName: youtube.profileName,
            profilePicture: youtube.profilePicture,
            handle: youtube.handle,
            expiresAt: youtube.expiresAt,
          }
        : { connected: false },
      instagram: instagram
        ? {
            connected: true,
            profileName: instagram.profileName,
            profilePicture: instagram.profilePicture,
            handle: instagram.handle,
            expiresAt: instagram.expiresAt,
          }
        : { connected: false },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve connection status.' });
  }
});

// Connect account (simulate OAuth initiation)
router.get('/connect/:platform', authMiddleware, (req, res) => {
  const { platform } = req.params;
  if (platform !== 'youtube' && platform !== 'instagram') {
    return res.status(400).json({ error: 'Invalid platform.' });
  }

  // Generate a mock OAuth redirect URL
  const mockRedirectUrl = `http://localhost:3000/oauth/callback?platform=${platform}&code=mock_oauth_code_xyz123`;
  return res.json({ url: mockRedirectUrl });
});

// OAuth Callback / Connection confirmation
router.post('/callback/:platform', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user!.id;

    if (platform !== 'youtube' && platform !== 'instagram') {
      return res.status(400).json({ error: 'Invalid platform.' });
    }

    // Set high-fidelity mock profile information
    let profileName = 'Creator Pro';
    let handle = '@creator_pro';
    let profilePicture = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

    if (platform === 'youtube') {
      profileName = `${req.user!.name} Shorts`;
      handle = `@${req.user!.name.toLowerCase().replace(/\s+/g, '')}_shorts`;
      profilePicture = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80';
    } else {
      profileName = `${req.user!.name} Reels`;
      handle = `@${req.user!.name.toLowerCase().replace(/\s+/g, '')}_reels`;
      profilePicture = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
    }

    // Upsert token
    const existing = await OAuthTokens.findOne({ userId, platform });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days expiry

    if (existing) {
      await OAuthTokens.updateOne(
        { id: existing.id },
        {
          accessToken: 'mock_access_token_refreshed_abc123',
          refreshToken: 'mock_refresh_token_refreshed_def456',
          expiresAt,
          profileName,
          profilePicture,
          handle,
        }
      );
    } else {
      await OAuthTokens.insertOne({
        userId,
        platform,
        accessToken: 'mock_access_token_abc123',
        refreshToken: 'mock_refresh_token_def456',
        expiresAt,
        profileName,
        profilePicture,
        handle,
      });
    }

    return res.json({
      message: `${platform === 'youtube' ? 'YouTube' : 'Instagram Professional'} connected successfully!`,
      account: { profileName, handle, profilePicture },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process OAuth connection.' });
  }
});

// Disconnect platform
router.delete('/disconnect/:platform', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user!.id;

    if (platform !== 'youtube' && platform !== 'instagram') {
      return res.status(400).json({ error: 'Invalid platform.' });
    }

    const deleted = await OAuthTokens.deleteMany({ userId, platform });
    return res.json({ message: `${platform === 'youtube' ? 'YouTube' : 'Instagram'} disconnected successfully.`, success: deleted > 0 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to disconnect account.' });
  }
});

export default router;
