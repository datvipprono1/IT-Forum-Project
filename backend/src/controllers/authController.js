const jwt = require("jsonwebtoken");

const {
  signInWithPassword,
  updatePasswordWithCurrentCredentials,
} = require("../services/firebaseAuthService");
const { upsertUserFromAuth } = require("../services/storeService");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeAuthError(error) {
  if (error.code === "INVALID_LOGIN_CREDENTIALS" || error.code === "INVALID_PASSWORD") {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (error.code === "USER_DISABLED") {
    return "Tài khoản đang bị vô hiệu hóa.";
  }

  return error.message || "Đăng nhập thất bại.";
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    }

    const authUser = await signInWithPassword(email.trim(), password);
    const userProfile = upsertUserFromAuth({
      firebaseUid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
    });

    if (userProfile.status === "locked") {
      return res.status(403).json({ message: "Tài khoản của bạn hiện đang bị khóa." });
    }

    return res.json({
      message: "Đăng nhập thành công.",
      token: createToken(userProfile),
      user: userProfile,
    });
  } catch (error) {
    const message = normalizeAuthError(error);
    return res.status(401).json({ message, code: error.code || "AUTH_LOGIN_FAILED" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Bạn cần nhập mật khẩu hiện tại và mật khẩu mới." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    await updatePasswordWithCurrentCredentials({
      email: req.user.email,
      currentPassword,
      newPassword,
    });

    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    const message =
      error.code === "INVALID_LOGIN_CREDENTIALS" || error.code === "INVALID_PASSWORD"
        ? "Mật khẩu hiện tại không đúng."
        : error.message || "Không thể đổi mật khẩu.";

    return res.status(400).json({ message, code: error.code || "CHANGE_PASSWORD_FAILED" });
  }
};
