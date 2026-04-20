const POST_DELETION_REASONS = [
  "Bài viết mang tính bạo lực",
  "Bài viết mang tính phân biệt chủng tộc",
  "Bài viết có nội dung xúc phạm",
  "Bài viết có hình ảnh hoặc ngôn từ nhạy cảm",
  "Bài viết spam hoặc sai mục đích diễn đàn",
];

function isValidPostDeletionReason(reason) {
  return POST_DELETION_REASONS.includes(reason);
}

module.exports = {
  POST_DELETION_REASONS,
  isValidPostDeletionReason,
};
