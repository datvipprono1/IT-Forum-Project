const {
  getPublicUserProfile,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getUserProfileWithStats,
  listPostsByAuthor,
  listSavedPosts,
  searchUsers,
  updateUserProfile,
} = require("../services/storeService");

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

exports.getNotifications = async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 12);
    return res.json(listNotifications(req.user.id, { limit }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    return res.json(markNotificationRead(req.user.id, req.params.id));
  } catch (error) {
    const status = error.message === "NOTIFICATION_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    return res.json(markAllNotificationsRead(req.user.id));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query || "";
    return res.json(searchUsers(query));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const user = getPublicUserProfile(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
