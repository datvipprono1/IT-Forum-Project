function formatDate(dateString) {
  if (!dateString) {
    return "Không rõ thời gian";
  }

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Vừa xong";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default formatDate;
