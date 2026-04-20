export function getRoleLabel(role) {
  const map = {
    admin: "Quản trị viên",
    student: "Sinh viên",
    teacher: "Giảng viên",
  };

  return map[role] || "Người dùng";
}

export function getUserStatusLabel(status) {
  return status === "locked" ? "Đã khóa" : "Đang hoạt động";
}

export function getPostStatusLabel(status) {
  const map = {
    approved: "Đã duyệt",
    pending: "Chờ duyệt",
    rejected: "Đã từ chối",
  };

  return map[status] || "Không xác định";
}

export function getReportStatusLabel(status) {
  const map = {
    pending: "Chờ xử lý",
    reviewed: "Đã xem",
    resolved: "Đã xử lý",
    rejected: "Bỏ qua",
  };

  return map[status] || "Chưa rõ";
}

export function getSeverityLabel(severity) {
  const map = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };

  return map[severity] || "Chưa rõ";
}
