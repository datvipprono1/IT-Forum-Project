const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-password/validate", authController.validateResetPasswordToken);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;
