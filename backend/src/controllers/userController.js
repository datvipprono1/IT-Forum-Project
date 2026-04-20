const {
  getUserProfileWithStats,
  listPostsByAuthor,
  listSavedPosts,
  updateUserProfile,
} = require("../services/storeService");

exports.getProfile = async (req, res) => {
  try {
    const user = getUserProfileWithStats(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const savedPosts = listSavedPosts(req.user.id);
    const authoredPosts = listPostsByAuthor(req.user.id);

    return res.json({
      ...user,
      savedPosts,
      authoredPosts,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = updateUserProfile(req.user.id, req.body);
    return res.json({
      message: "Cập nhật hồ sơ thành công.",
      user: updatedUser,
    });
  } catch (error) {
    const status = error.message === "USER_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const savedPosts = listSavedPosts(req.user.id);
    return res.json(savedPosts);
  } catch (error) {
    const status = error.message === "USER_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};
