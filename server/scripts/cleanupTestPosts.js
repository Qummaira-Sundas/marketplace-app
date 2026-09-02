require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");

async function cleanupTestPosts() {
  const uri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/MarketplaceDB";

  await mongoose.connect(uri);

  const testUsers = await User.find({
    $or: [
      { name: { $in: ["Put Test", "Gallery Test"] } },
      { email: { $regex: /@test\.com$/i } },
    ],
  }).select("_id name email");

  if (!testUsers.length) {
    console.log("No test users found.");
    await mongoose.disconnect();
    return;
  }

  console.log(
    "Test users:",
    testUsers.map((user) => `${user.name} <${user.email}>`).join(", ")
  );

  const userIds = testUsers.map((user) => user._id);
  const result = await Post.deleteMany({ createdBy: { $in: userIds } });

  console.log(`Deleted ${result.deletedCount} test post(s).`);

  await mongoose.disconnect();
}

cleanupTestPosts().catch((error) => {
  console.error(error);
  process.exit(1);
});
