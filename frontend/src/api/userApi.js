import axiosClient from "./axiosClient";

export const getProfile = () => axiosClient.get("/users/profile");
export const updateProfile = (payload) => axiosClient.put("/users/profile", payload);
export const getSavedPosts = () => axiosClient.get("/users/saved-posts");
export const getNotifications = (params = {}) => axiosClient.get("/users/notifications", { params });
export const markNotificationRead = (notificationId) => axiosClient.put(`/users/notifications/${notificationId}/read`);
export const markAllNotificationsRead = () => axiosClient.put("/users/notifications/read-all");
export const searchUsers = (query) => axiosClient.get("/users/directory", { params: { query } });
export const getPublicProfile = (userId) => axiosClient.get(`/users/public/${userId}`);
