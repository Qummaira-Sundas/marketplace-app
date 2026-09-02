const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

const toIdList = (ids = []) =>
  (ids || []).map((id) => String(id)).filter(Boolean);

const getUploadedImagePaths = (req) => {
  if (Array.isArray(req.files) && req.files.length) {
    return req.files.map((file) => `/uploads/${file.filename}`);
  }

  if (Array.isArray(req.files?.images) && req.files.images.length) {
    return req.files.images.map((file) => `/uploads/${file.filename}`);
  }

  if (Array.isArray(req.files?.image) && req.files.image.length) {
    return req.files.image.map((file) => `/uploads/${file.filename}`);
  }

  if (req.file) {
    return [`/uploads/${req.file.filename}`];
  }

  return [];
};

const postUpload = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
]);

const handlePostUpload = (req, res, next) => {
  postUpload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Each image must be 5 MB or smaller",
        });
      }

      return res.status(400).json({
        message: err.message || "Image upload failed",
      });
    }
    next();
  });
};

const getPostImageList = (post) => {
  const images = Array.isArray(post?.images)
    ? post.images.filter(Boolean)
    : [];

  if (images.length) {
    return images;
  }

  if (post?.image) {
    return [post.image];
  }

  return [];
};

const formatPost = (post) => {
  if (!post) return post;

  const data = post.toObject ? post.toObject() : { ...post };
  const images = getPostImageList(data);

  if (images.length) {
    data.images = images;
    data.image = images[0];
  } else {
    data.images = [];
    data.image = data.image || "";
  }

  return data;
};

const applyImageOrder = (post, orderedImages) => {
  const currentImages = getPostImageList(post);

  if (
    !Array.isArray(orderedImages) ||
    orderedImages.length < 1 ||
    orderedImages.length > 10 ||
    orderedImages.length > currentImages.length ||
    new Set(orderedImages).size !== orderedImages.length ||
    !orderedImages.every((path) => currentImages.includes(path))
  ) {
    return false;
  }

  post.images = orderedImages;
  post.image = orderedImages[0];
  post.markModified("images");

  return true;
};

// ======================================
// 1. Get favorite posts (must be before /:id)
// ======================================
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "favorites",
      populate: {
        path: "createdBy",
        select: "name email",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favorites = (user.favorites || [])
      .filter((post) => post && post._id)
      .reverse();

    res.json(favorites.map((post) => formatPost(post)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 2. Toggle favorite
// ======================================
router.post("/:id/favorite", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId).select("_id");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    const alreadyFavorited = user.favorites.some(
      (id) => String(id) === String(postId)
    );

    let favorited;

    if (alreadyFavorited) {
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { favorites: postId },
      });
      favorited = false;
    } else {
      await User.findByIdAndUpdate(req.user.userId, {
        $addToSet: { favorites: postId },
      });
      favorited = true;
    }

    const updated = await User.findById(req.user.userId).select("favorites");

    res.json({
      favorited,
      favorites: toIdList(updated?.favorites),
      message: favorited
        ? "Added to favorites"
        : "Removed from favorites",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 3. Create New Post
// ======================================
router.post("/", authMiddleware, handlePostUpload, async (req, res) => {
  try {
    const { productName, price, location, description } = req.body;

    if (!productName || !productName.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({ message: "Price is required" });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Please enter a valid price" });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const imagePaths = getUploadedImagePaths(req);

    if (!imagePaths.length) {
      return res.status(400).json({ message: "Please select at least one image" });
    }

    const post = await Post.create({
      productName: productName.trim(),
      price: Number(price),
      location: location.trim(),
      description: description.trim(),
      image: imagePaths[0],
      images: imagePaths,
      createdBy: req.user.userId,
    });

    const populated = await Post.findById(post._id).populate(
      "createdBy",
      "name email"
    );

    res.status(201).json(formatPost(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 4. Get posts (paginated)
// ======================================
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const sort = req.query.sort || "newest";
    const search = (req.query.q || "").trim();

    const filter = {};

    const hiddenParam = req.query.hidden;
    if (hiddenParam) {
      const hiddenIds = hiddenParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (hiddenIds.length) {
        filter._id = { $nin: hiddenIds };
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const matchingUsers = await User.find({ name: searchRegex }).select(
        "_id"
      );
      const matchingUserIds = matchingUsers.map((user) => user._id);

      filter.$or = [
        { productName: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { createdBy: { $in: matchingUserIds } },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    }

    const total = await Post.countDocuments(filter);

    const posts = await Post.find(filter)
      .populate("createdBy", "name email")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const hasMore = page * limit < total;

    res.json({
      posts: posts.map((post) => formatPost(post)),
      page,
      limit,
      total,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 5. Get my posts
// ======================================
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ createdBy: req.user.userId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(posts.map((post) => formatPost(post)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 5b. Update image order (JSON — reliable reorder without multipart)
// ======================================
router.patch("/:id/image-order", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user.userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const { imageOrder } = req.body;

    if (!applyImageOrder(post, imageOrder)) {
      return res.status(400).json({
        message: "Could not update image order. Please try again.",
      });
    }

    await post.save();

    const populated = await Post.findById(post._id).populate(
      "createdBy",
      "name email"
    );

    res.json(formatPost(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 6. Update post
// ======================================
router.put("/:id", authMiddleware, handlePostUpload, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user.userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const { productName, price, location, description } = req.body;

    if (productName !== undefined) {
      if (!productName.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }
      post.productName = productName.trim();
    }

    if (price !== undefined && price !== "") {
      if (Number(price) <= 0) {
        return res.status(400).json({ message: "Please enter a valid price" });
      }
      post.price = Number(price);
    }

    if (location !== undefined) {
      if (!location.trim()) {
        return res.status(400).json({ message: "Location is required" });
      }
      post.location = location.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ message: "Description is required" });
      }
      post.description = description.trim();
    }

    const imagePaths = getUploadedImagePaths(req);

    if (req.body.imageSequence) {
      let sequence;

      try {
        sequence = JSON.parse(req.body.imageSequence);
      } catch {
        sequence = null;
      }

      const currentImages = getPostImageList(post);
      const newPaths = imagePaths;
      let newIndex = 0;
      const mergedImages = [];

      if (Array.isArray(sequence) && sequence.length >= 1) {
        let isValid = true;

        for (const slot of sequence) {
          if (slot?.type === "existing" && slot.path) {
            if (!currentImages.includes(slot.path)) {
              isValid = false;
              break;
            }
            mergedImages.push(slot.path);
          } else if (slot?.type === "new") {
            if (!newPaths[newIndex]) {
              isValid = false;
              break;
            }
            mergedImages.push(newPaths[newIndex]);
            newIndex += 1;
          } else {
            isValid = false;
            break;
          }
        }

        if (
          isValid &&
          newIndex === newPaths.length &&
          mergedImages.length >= 1 &&
          mergedImages.length <= 10
        ) {
          post.images = mergedImages;
          post.image = mergedImages[0];
          post.markModified("images");
        } else {
          return res.status(400).json({ message: "Could not update images" });
        }
      } else {
        return res.status(400).json({ message: "Invalid image sequence" });
      }
    } else if (imagePaths.length) {
      post.image = imagePaths[0];
      post.images = imagePaths;
      post.markModified("images");
    } else if (req.body.imageOrder) {
      let orderedImages;

      try {
        orderedImages = JSON.parse(req.body.imageOrder);
      } catch {
        return res.status(400).json({ message: "Invalid image order data" });
      }

      if (!applyImageOrder(post, orderedImages)) {
        return res.status(400).json({
          message: "Could not update image order. Please try again.",
        });
      }
    }

    await post.save();

    const populated = await Post.findById(post._id).populate(
      "createdBy",
      "name email"
    );

    res.json(formatPost(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 7. Get single post
// ======================================
router.get("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId).populate(
      "createdBy",
      "name email"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================
// 8. Delete post
// ======================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.createdBy) !== String(req.user.userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
