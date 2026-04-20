const {
  createComment,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  getCategories,
  getManagedPost,
  getPostDetail,
  getPosts,
  toggleLike,
  toggleSave,
  updatePost,
} = require("../services/storeService");
const { isValidPostDeletionReason } = require("../constants/postDeletionReasons");
const { deleteUploadedImage, savePostImage } = require("../services/imageStorageService");

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPostMessage(post, action = "create") {
  if (post.status === "approved") {
    return action === "update"
      ? "Cập nhật bài viết thành công. Bài đã được đăng ngay."
      : "Tạo bài viết thành công. Bài đã được đăng ngay.";
  }

  const reasons = post.moderationReasons?.length ? ` Lý do: ${post.moderationReasons.join(", ")}.` : "";

  return action === "update"
    ? `Cập nhật bài viết thành công. Bài có dấu hiệu nhạy cảm nên đã chuyển cho admin kiểm duyệt.${reasons}`
    : `Tạo bài viết thành công. Bài có dấu hiệu nhạy cảm nên đã chuyển cho admin kiểm duyệt.${reasons}`;
}

exports.getPosts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);

    return res.json(getPosts({ page, limit }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPostDetail = async (req, res) => {
  try {
    const post = getPostDetail(req.params.id);

    if (!post || post.status !== "approved") {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getManagedPost = async (req, res) => {
  try {
    const post = getManagedPost(req.params.id, req.user);
    return res.json(post);
  } catch (error) {
    const statusMap = {
      POST_NOT_FOUND: 404,
      FORBIDDEN: 403,
    };

    return res.status(statusMap[error.message] || 500).json({ message: error.message });
  }
};

exports.getCategories = async (_req, res) => {
  try {
    return res.json(getCategories());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  let savedImageUrl = "";

  try {
    const { title, summary, categoryId, imageBase64, imageName } = req.body;

    if (!title?.trim() || !summary?.trim() || !categoryId?.trim()) {
      return res.status(400).json({ message: "Thiếu tiêu đề, mô tả hoặc chủ đề." });
    }

    if (imageBase64) {
      savedImageUrl = savePostImage({
        imageBase64,
        originalName: imageName,
      });
    }

    const post = createPost({
      title,
      summary,
      categoryId,
      imageUrl: savedImageUrl,
      imageOriginalName: imageName,
      authorId: req.user.id,
    });

    return res.status(201).json({
      message: buildPostMessage(post, "create"),
      post,
    });
  } catch (error) {
    if (savedImageUrl) {
      deleteUploadedImage(savedImageUrl);
    }

    const statusMap = {
      IMAGE_TOO_LARGE: 400,
      UNSUPPORTED_IMAGE_FORMAT: 400,
      INVALID_IMAGE_DATA: 400,
    };

    const fallbackMessage =
      error.message === "IMAGE_TOO_LARGE"
        ? "Ảnh quá lớn. Vui lòng chọn ảnh tối đa 5MB."
        : error.message === "UNSUPPORTED_IMAGE_FORMAT"
          ? "Chỉ hỗ trợ ảnh PNG, JPG, WEBP hoặc GIF."
          : error.message === "INVALID_IMAGE_DATA"
            ? "Dữ liệu ảnh không hợp lệ."
            : error.message;

    return res.status(statusMap[error.code || error.message] || 500).json({ message: fallbackMessage });
  }
};

exports.updatePost = async (req, res) => {
  let savedImageUrl = "";

  try {
    const existingPost = getManagedPost(req.params.id, req.user);
    const { imageBase64, imageName, removeImage, ...editablePayload } = req.body;

    if (typeof editablePayload.title === "string" && !editablePayload.title.trim()) {
      return res.status(400).json({ message: "Tiêu đề bài viết là bắt buộc." });
    }

    if (typeof editablePayload.summary === "string" && !editablePayload.summary.trim()) {
      return res.status(400).json({ message: "Mô tả bài viết là bắt buộc." });
    }

    if (typeof editablePayload.categoryId === "string" && !editablePayload.categoryId.trim()) {
      return res.status(400).json({ message: "Chủ đề bài viết là bắt buộc." });
    }

    let nextImageUrl = existingPost.imageUrl || "";

    if (imageBase64) {
      savedImageUrl = savePostImage({
        imageBase64,
        originalName: imageName,
      });
      nextImageUrl = savedImageUrl;
    } else if (removeImage) {
      nextImageUrl = "";
    }

    const post = updatePost(req.params.id, req.user, {
      ...editablePayload,
      imageUrl: nextImageUrl,
      imageOriginalName: imageName,
    });

    if (existingPost.imageUrl && existingPost.imageUrl !== post.imageUrl) {
      deleteUploadedImage(existingPost.imageUrl);
    }

    return res.json({
      message: buildPostMessage(post, "update"),
      post,
    });
  } catch (error) {
    if (savedImageUrl) {
      deleteUploadedImage(savedImageUrl);
    }

    const statusMap = {
      POST_NOT_FOUND: 404,
      FORBIDDEN: 403,
      IMAGE_TOO_LARGE: 400,
      UNSUPPORTED_IMAGE_FORMAT: 400,
      INVALID_IMAGE_DATA: 400,
    };

    const message =
      error.message === "IMAGE_TOO_LARGE"
        ? "Ảnh quá lớn. Vui lòng chọn ảnh tối đa 5MB."
        : error.message === "UNSUPPORTED_IMAGE_FORMAT"
          ? "Chỉ hỗ trợ ảnh PNG, JPG, WEBP hoặc GIF."
          : error.message === "INVALID_IMAGE_DATA"
            ? "Dữ liệu ảnh không hợp lệ."
            : error.message;

    return res.status(statusMap[error.message] || 500).json({ message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const deletionReason = req.body?.deletionReason?.trim() || "";
    const violationTerms = req.body?.violationTerms || "";

    if (req.user.role === "admin") {
      if (!deletionReason) {
        return res.status(400).json({ message: "Admin phải chọn lý do xóa bài viết." });
      }

      if (!isValidPostDeletionReason(deletionReason)) {
        return res.status(400).json({ message: "Lý do xóa bài viết không hợp lệ." });
      }
    }

    deletePost(req.params.id, req.user, deletionReason, violationTerms);
    return res.json({ message: "Đã xóa bài viết." });
  } catch (error) {
    const statusMap = {
      POST_NOT_FOUND: 404,
      FORBIDDEN: 403,
    };

    return res.status(statusMap[error.message] || 500).json({ message: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = toggleLike(req.params.id, req.user.id);
    return res.json(post);
  } catch (error) {
    const status = error.message === "POST_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const post = toggleSave(req.params.id, req.user.id);
    return res.json(post);
  } catch (error) {
    const status = error.message === "POST_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.commentPost = async (req, res) => {
  try {
    if (!req.body.content) {
      return res.status(400).json({ message: "Nội dung bình luận là bắt buộc." });
    }

    const comment = createComment(req.params.id, req.user.id, req.body.content);
    return res.status(201).json(comment);
  } catch (error) {
    const status = error.message === "POST_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    deleteComment(req.params.id, req.user);
    return res.json({ message: "Đã xóa bình luận." });
  } catch (error) {
    const statusMap = {
      COMMENT_NOT_FOUND: 404,
      FORBIDDEN: 403,
    };

    return res.status(statusMap[error.message] || 500).json({ message: error.message });
  }
};

exports.reportPost = async (req, res) => {
  try {
    if (!req.body.reason) {
      return res.status(400).json({ message: "Lý do báo cáo là bắt buộc." });
    }

    const report = createReport({
      targetType: "post",
      targetId: req.params.id,
      reporterId: req.user.id,
      reason: req.body.reason,
      note: req.body.note,
      severity: req.body.severity,
    });

    return res.status(201).json({
      message: "Đã gửi báo cáo tới admin.",
      report,
    });
  } catch (error) {
    const status = error.message === "TARGET_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    if (!req.body.reason) {
      return res.status(400).json({ message: "Lý do báo cáo là bắt buộc." });
    }

    const report = createReport({
      targetType: "comment",
      targetId: req.params.id,
      reporterId: req.user.id,
      reason: req.body.reason,
      note: req.body.note,
      severity: req.body.severity,
    });

    return res.status(201).json({
      message: "Đã gửi báo cáo bình luận tới admin.",
      report,
    });
  } catch (error) {
    const status = error.message === "TARGET_NOT_FOUND" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};
