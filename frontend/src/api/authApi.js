import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const changePassword = (payload) =>
  axiosClient.put("/auth/change-password", payload);
