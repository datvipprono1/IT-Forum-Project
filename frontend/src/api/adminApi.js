import axiosClient from "./axiosClient";

export const getStatistics = () => axiosClient.get("/admin/statistics");
export const getUsers = () => axiosClient.get("/admin/users");
export const createUser = (payload) => axiosClient.post("/admin/users", payload);
export const toggleUserStatus = (userId) => axiosClient.put(`/admin/users/${userId}/status`);
export const getPendingPosts = () => axiosClient.get("/admin/posts/pending");
export const approvePost = (postId) => axiosClient.put(`/admin/approve-post/${postId}`);
export const rejectPost = (postId, payload = {}) => axiosClient.delete(`/admin/reject-post/${postId}`, { data: payload });
export const getReports = () => axiosClient.get("/admin/reports");
export const updateReportStatus = (reportId, status) =>
  axiosClient.put(`/admin/reports/${reportId}/status`, { status });
export const createCategory = (name) => axiosClient.post("/admin/categories", { name });
