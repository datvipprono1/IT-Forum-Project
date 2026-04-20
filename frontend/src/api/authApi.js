import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const forgotPassword = (payload) => axiosClient.post("/auth/forgot-password", payload);
export const validateResetPasswordToken = (token) =>
  axiosClient.get("/auth/reset-password/validate", {
    params: { token },
  });
export const resetPassword = (payload) => axiosClient.post("/auth/reset-password", payload);
export const changePassword = (payload) =>
  axiosClient.put("/auth/change-password", payload);
