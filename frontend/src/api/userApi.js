import axiosClient from "./axiosClient";

export const getProfile = () => axiosClient.get("/users/profile");
export const updateProfile = (payload) => axiosClient.put("/users/profile", payload);
export const getSavedPosts = () => axiosClient.get("/users/saved-posts");
