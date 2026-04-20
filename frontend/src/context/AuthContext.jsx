import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../api/authApi";
import { getProfile } from "../api/userApi";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  saveAuthStorage,
  updateStoredUser,
} from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const token = getStoredToken();

      if (!token) {
        clearAuthStorage();
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getProfile();
        if (!isMounted) {
          return;
        }

        setUser(response.data);
        updateStoredUser(response.data);
      } catch {
        clearAuthStorage();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password, rememberUser = true) => {
    const response = await loginApi({
      email,
      password,
    });

    const { token, user: signedInUser } = response.data;
    saveAuthStorage({ token, user: signedInUser, rememberUser });
    setUser(signedInUser);

    return signedInUser;
  };

  const logout = async () => {
    clearAuthStorage();
    setUser(null);
  };

  const refreshProfile = async () => {
    const response = await getProfile();
    setUser(response.data);
    updateStoredUser(response.data);
    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
