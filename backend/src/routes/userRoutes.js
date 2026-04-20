const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.get("/saved-posts", authMiddleware, userController.getSavedPosts);
router.get("/notifications", authMiddleware, userController.getNotifications);
router.put("/notifications/read-all", authMiddleware, userController.markAllNotificationsRead);
router.put("/notifications/:id/read", authMiddleware, userController.markNotificationRead);
router.get("/directory", authMiddleware, userController.searchUsers);
router.get("/public/:id", authMiddleware, userController.getPublicProfile);

module.exports = router;
