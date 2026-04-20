const { ensurePasswordUser } = require("../services/firebaseAuthService");
const { isValidPostDeletionReason } = require("../constants/postDeletionReasons");
const {
  approvePost,
  createCategory,
  createManagedUserProfile,
  getStatistics,
  listPendingPosts,
  listReports,
  listUsers,
  rejectPost,
  toggleUserStatus,
  updateReportStatus,
} = require("../services/storeService");

function buildManagedEmail({ email, studentId }) {
  if (email) {
    return email.trim().toLowerCase();
  }

  if (studentId) {
    return `${studentId.trim()}@dntu.edu.vn`;
  }

  return "";
}

exports.createUser = async (req, res) => {
  try {
    const { fullName, role = "student", studentId = "", email, faculty = "Khoa Công nghệ", bio = "" } = req.body;
    const password = req.body.password || process.env.FIREBASE_DEFAULT_PASSWORD || "123456";
    const normalizedEmail = buildManagedEmail({ email, studentId });

    if (!fullName || !normalizedEmail) {
      return res.status(400).json({ message: "Thiếu họ tên hoặc email/MSSV." });
    }

    const authUser = await ensurePasswordUser({
      email: normalizedEmail,
      password,
      displayName: fullName,
    });

    const user = createManagedUserProfile({
      firebaseUid: authUser.uid,
      email: normalizedEmail,
      fullName,
      role,
      status: "active",
      studentId,
      faculty,
      bio,
    });

    return res.status(201).json({
      message:
        authUser.status === "created"
          ? "Tạo tài khoản thành công."
          : "Tài khoản đã tồn tại, đã đồng bộ hồ sơ.",
      user,
      defaultPassword: password,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.code === "EMAIL_EXISTS" ? "Email đã tồn tại." : error.message,
      code: error.code || "CREATE_USER_FAILED",
    });
  }
};

exports.getUsers = async (_req, res) => {
  try {
    return res.json(listUsers());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const post = approvePost(req.params.id);
    return res.json({
      message: "Đã phê duyệt bài viết.",
      post,
    });
  } catch (error) {
    const status = error.message === "POST_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.rejectPost = async (req, res) => {
  try {
    const deletionReason = req.body?.deletionReason?.trim() || "";
    const violationTerms = req.body?.violationTerms || "";

    if (!deletionReason) {
      return res.status(400).json({ message: "Admin phải chọn lý do xóa bài viết." });
    }

    if (!isValidPostDeletionReason(deletionReason)) {
      return res.status(400).json({ message: "Lý do xóa bài viết không hợp lệ." });
    }

    rejectPost(req.params.id, req.user, deletionReason, violationTerms);
    return res.json({ message: "Đã từ chối và xóa bài viết." });
  } catch (error) {
    const status = error.message === "POST_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.getPendingPosts = async (_req, res) => {
  try {
    return res.json(listPendingPosts());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getReports = async (_req, res) => {
  try {
    return res.json(listReports());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const report = updateReportStatus(req.params.id, req.body.status || "reviewed");
    return res.json({
      message: "Đã cập nhật trạng thái report.",
      report,
    });
  } catch (error) {
    const status = error.message === "REPORT_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = toggleUserStatus(req.params.id);
    return res.json({
      message: user.status === "locked" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.",
      user,
    });
  } catch (error) {
    const status = error.message === "USER_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.getStatistics = async (_req, res) => {
  try {
    return res.json(getStatistics());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: "Tên chủ đề là bắt buộc." });
    }

    const category = createCategory(req.body.name);
    return res.status(201).json({
      message: "Tạo chủ đề thành công.",
      category,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
