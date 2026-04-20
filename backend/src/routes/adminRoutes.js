const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.get("/posts/pending", adminController.getPendingPosts);
router.put("/approve-post/:id", adminController.approvePost);
router.delete("/reject-post/:id", adminController.rejectPost);
router.get("/reports", adminController.getReports);
router.put("/reports/:id/status", adminController.updateReportStatus);
router.put("/users/:id/status", adminController.toggleUserStatus);
router.get("/statistics", adminController.getStatistics);
router.post("/categories", adminController.createCategory);

module.exports = router;
