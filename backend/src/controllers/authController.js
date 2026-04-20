const { createHash, randomBytes } = require("crypto");
const jwt = require("jsonwebtoken");

const {
  signInWithPassword,
  updatePasswordWithCurrentCredentials,
} = require("../services/firebaseAuthService");
const {
  getAuthUserByEmail,
  resetPasswordByEmail,
} = require("../services/firebaseAdminService");
const { sendPasswordResetLinkEmail } = require("../services/emailService");
const {
  createPasswordResetToken,
  markPasswordResetTokenConsumed,
  revokePasswordResetToken,
  upsertUserFromAuth,
  validatePasswordResetToken,
} = require("../services/storeService");

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

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

function hashResetToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function buildResetUrl(resetToken) {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
}

function normalizeLoginError(error) {
  if (error.code === "INVALID_LOGIN_CREDENTIALS" || error.code === "INVALID_PASSWORD") {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (error.code === "USER_DISABLED") {
    return "Tài khoản đang bị vô hiệu hóa.";
  }

  return error.message || "Đăng nhập thất bại.";
}

function normalizeRequestResetError(error) {
  if (error.code === "auth/user-not-found") {
    return "Không tìm thấy tài khoản với email này.";
  }

  if (
    error.code === "FIREBASE_ADMIN_NOT_CONFIGURED" ||
    error.code === "FIREBASE_ADMIN_CONFIG_INVALID" ||
    error.code === "SMTP_NOT_CONFIGURED"
  ) {
    return error.message;
  }

  if (
    error.code === "EMESSAGE" ||
    error.code === "EAUTH" ||
    error.code === "ESOCKET" ||
    error.code === "ECONNECTION"
  ) {
    return "Hệ thống gửi email chưa sẵn sàng. Link đặt lại mật khẩu chưa được tạo.";
  }

  return error.message || "Không thể gửi link đặt lại mật khẩu lúc này.";
}

function normalizeResetPasswordError(error) {
  if (error.message === "RESET_TOKEN_INVALID") {
    return "Link đặt lại mật khẩu không đúng hoặc đã bị hủy.";
  }

  if (error.message === "RESET_TOKEN_EXPIRED") {
    return "Link đặt lại mật khẩu đã hết hạn. Hãy yêu cầu link mới.";
  }

  if (error.code === "auth/user-not-found") {
    return "Không tìm thấy tài khoản với email này.";
  }

  if (error.code === "FIREBASE_ADMIN_NOT_CONFIGURED" || error.code === "FIREBASE_ADMIN_CONFIG_INVALID") {
    return error.message;
  }

  return error.message || "Không thể đặt lại mật khẩu lúc này.";
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
    const message = normalizeLoginError(error);
    return res.status(401).json({ message, code: error.code || "AUTH_LOGIN_FAILED" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Bạn cần nhập email đã được admin cấp." });
    }

    const authUser = await getAuthUserByEmail(email);
    const userProfile = upsertUserFromAuth({
      firebaseUid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
    });

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
    const storedResetToken = createPasswordResetToken({
      userId: userProfile.id,
      email,
      tokenHash: hashResetToken(resetToken),
      expiresAt,
    });

    try {
      await sendPasswordResetLinkEmail({
        to: email,
        recipientName: userProfile.fullName || authUser.displayName || "",
        resetUrl: buildResetUrl(resetToken),
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
      });
    } catch (error) {
      revokePasswordResetToken(storedResetToken.id);
      throw error;
    }

    return res.json({
      message: `Link đặt lại mật khẩu đã được gửi về email của bạn. Link có hiệu lực trong ${PASSWORD_RESET_TOKEN_TTL_MINUTES} phút.`,
    });
  } catch (error) {
    const message = normalizeRequestResetError(error);
    const statusCode =
      error.code === "auth/user-not-found"
        ? 404
        : error.code === "FIREBASE_ADMIN_NOT_CONFIGURED" ||
            error.code === "FIREBASE_ADMIN_CONFIG_INVALID" ||
            error.code === "SMTP_NOT_CONFIGURED"
          ? 500
          : error.code === "EMESSAGE" ||
              error.code === "EAUTH" ||
              error.code === "ESOCKET" ||
              error.code === "ECONNECTION"
            ? 503
            : 400;

    return res.status(statusCode).json({
      message,
      code: error.code || "REQUEST_PASSWORD_RESET_FAILED",
    });
  }
};

exports.validateResetPasswordToken = async (req, res) => {
  try {
    const rawToken = typeof req.query?.token === "string" ? req.query.token : "";
    const token = rawToken.trim();

    if (!token) {
      return res.status(400).json({ message: "Thiếu token đặt lại mật khẩu." });
    }

    const validatedResetToken = validatePasswordResetToken({
      tokenHash: hashResetToken(token),
    });

    return res.json({
      message: "Token hợp lệ.",
      expiresAt: validatedResetToken.expiresAt,
    });
  } catch (error) {
    const message = normalizeResetPasswordError(error);
    return res.status(400).json({
      message,
      code: error.code || error.message || "VALIDATE_RESET_PASSWORD_TOKEN_FAILED",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
    const rawNewPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    const token = rawToken.trim();
    const newPassword = rawNewPassword.trim();

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Bạn cần nhập token đặt lại mật khẩu và mật khẩu mới.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    const validatedResetToken = validatePasswordResetToken({
      tokenHash: hashResetToken(token),
    });

    const updatedAuthUser = await resetPasswordByEmail(validatedResetToken.email, newPassword);

    markPasswordResetTokenConsumed(validatedResetToken.id);
    upsertUserFromAuth({
      firebaseUid: updatedAuthUser.uid,
      email: updatedAuthUser.email,
      displayName: updatedAuthUser.displayName,
    });

    return res.json({
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    const message = normalizeResetPasswordError(error);
    const statusCode =
      error.message === "RESET_TOKEN_INVALID" || error.message === "RESET_TOKEN_EXPIRED"
        ? 400
        : error.code === "auth/user-not-found"
          ? 404
          : error.code === "FIREBASE_ADMIN_NOT_CONFIGURED" ||
              error.code === "FIREBASE_ADMIN_CONFIG_INVALID"
            ? 500
            : 400;

    return res.status(statusCode).json({
      message,
      code: error.code || error.message || "RESET_PASSWORD_FAILED",
    });
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
