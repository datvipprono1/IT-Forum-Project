const deletionReasonMetaMap = {
  "Bài viết mang tính bạo lực": {
    category: "Bạo lực hoặc máu me",
    severity: "high",
  },
  "Bài viết mang tính phân biệt chủng tộc": {
    category: "Phân biệt chủng tộc",
    severity: "high",
  },
  "Bài viết có nội dung xúc phạm": {
    category: "Ngôn từ xúc phạm",
    severity: "medium",
  },
  "Bài viết có hình ảnh hoặc ngôn từ nhạy cảm": {
    category: "Nội dung tình dục hoặc nhạy cảm",
    severity: "high",
  },
  "Bài viết spam hoặc sai mục đích diễn đàn": {
    category: "Spam hoặc sai mục đích diễn đàn",
    severity: "medium",
  },
};

function getModerationMetaByDeletionReason(reason) {
  return deletionReasonMetaMap[reason] || {
    category: "Nội dung cần kiểm duyệt",
    severity: "medium",
  };
}

module.exports = {
  getModerationMetaByDeletionReason,
};
