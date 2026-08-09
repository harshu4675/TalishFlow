import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import User from "../models/User.js";
import OAuthToken from "../models/OAuthToken.js";

const router = Router();

router.use(authenticate);

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw createError("User not found", 404);

    res.json({
      success: true,
      data: { user: new User(user).toPublicProfile() },
    });
  }),
);

router.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true },
    );

    if (!user) throw createError("User not found", 404);

    res.json({ success: true, data: { user: user.toPublicProfile() } });
  }),
);

router.get(
  "/connected-accounts",
  asyncHandler(async (req, res) => {
    const tokens = await OAuthToken.find({ userId: req.user.id }).lean();

    const accounts = {
      youtube: tokens.find((t) => t.platform === "youtube") || null,
      instagram: tokens.find((t) => t.platform === "instagram") || null,
    };

    res.json({ success: true, data: { accounts } });
  }),
);

router.delete(
  "/connected-accounts/:platform",
  asyncHandler(async (req, res) => {
    const { platform } = req.params;

    if (!["youtube", "instagram"].includes(platform)) {
      throw createError("Invalid platform", 400);
    }

    await OAuthToken.findOneAndDelete({ userId: req.user.id, platform });

    await User.findByIdAndUpdate(req.user.id, {
      [`connectedAccounts.${platform}.connected`]: false,
    });

    res.json({ success: true, message: `${platform} account disconnected` });
  }),
);

export default router;
