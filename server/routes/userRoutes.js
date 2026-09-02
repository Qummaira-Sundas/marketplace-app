const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const toIdList = (ids = []) =>
  (ids || []).map((id) => String(id)).filter(Boolean);

// =============================
// Get current user prefs
// =============================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email favorites hiddenPosts profileImage"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || "",
      favorites: toIdList(user.favorites),
      hiddenPosts: toIdList(user.hiddenPosts),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================
// Update profile image
// =============================
router.patch(
  "/me/profile-image",
  authMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Profile image is required" });
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.profileImage = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        message: "Profile image updated",
        profileImage: user.profileImage,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// =============================
// Hide post from feed
// =============================
router.post("/hidden/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { hiddenPosts: postId },
    });

    const updated = await User.findById(req.user.userId).select("hiddenPosts");

    res.json({
      hidden: true,
      hiddenPosts: toIdList(updated.hiddenPosts),
      message: "Post hidden from your feed",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================
// Unhide post
// =============================
router.delete("/hidden/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { hiddenPosts: postId },
    });

    const updated = await User.findById(req.user.userId).select("hiddenPosts");

    res.json({
      hidden: false,
      hiddenPosts: toIdList(updated.hiddenPosts),
      message: "Post restored to your feed",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
