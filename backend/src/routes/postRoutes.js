const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/categories", postController.getCategories);
router.get("/manage/:id", authMiddleware, postController.getManagedPost);
router.get("/", postController.getPosts);
router.get("/:id", postController.getPostDetail);
router.post("/", authMiddleware, postController.createPost);
router.put("/:id", authMiddleware, postController.updatePost);
router.delete("/:id", authMiddleware, postController.deletePost);
router.put("/:id/like", authMiddleware, postController.likePost);
router.put("/:id/save", authMiddleware, postController.savePost);
router.post("/:id/comments", authMiddleware, postController.commentPost);
router.delete("/comments/:id", authMiddleware, postController.deleteComment);
router.post("/:id/report", authMiddleware, postController.reportPost);
router.post("/comments/:id/report", authMiddleware, postController.reportComment);

module.exports = router;
