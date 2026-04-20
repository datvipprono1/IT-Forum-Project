import axiosClient from "./axiosClient";

export const getCategories = () => axiosClient.get("/posts/categories");
export const getPosts = (params = {}) => axiosClient.get("/posts", { params });
export const getPostDetail = (postId) => axiosClient.get(`/posts/${postId}`);
export const getManagedPost = (postId) => axiosClient.get(`/posts/manage/${postId}`);
export const createPost = (payload) => axiosClient.post("/posts", payload);
export const updatePost = (postId, payload) => axiosClient.put(`/posts/${postId}`, payload);
export const deletePost = (postId, payload = {}) => axiosClient.delete(`/posts/${postId}`, { data: payload });
export const likePost = (postId) => axiosClient.put(`/posts/${postId}/like`);
export const savePost = (postId) => axiosClient.put(`/posts/${postId}/save`);
export const commentPost = (postId, payload) => axiosClient.post(`/posts/${postId}/comments`, payload);
export const deleteComment = (commentId) => axiosClient.delete(`/posts/comments/${commentId}`);
export const reportPost = (postId, payload) => axiosClient.post(`/posts/${postId}/report`, payload);
export const reportComment = (commentId, payload) =>
  axiosClient.post(`/posts/comments/${commentId}/report`, payload);
