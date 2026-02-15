import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

interface AdminAuthGateProps {
  children: React.ReactElement;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete axios.defaults.headers.common["Authorization"];
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    const { accessToken, refreshToken: nextRefreshToken } = response.data;

    if (!accessToken) {
      return null;
    }

    localStorage.setItem("accessToken", accessToken);
    if (nextRefreshToken) {
      localStorage.setItem("refreshToken", nextRefreshToken);
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    return accessToken as string;
  };

  const verifyAdminProfile = async (token: string) => {
    await axios.get(`${API_URL}/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  useEffect(() => {
    const verify = async () => {
      let token = localStorage.getItem("accessToken");

      if (!token) {
        try {
          token = await refreshAccessToken();
        } catch {
          token = null;
        }
      }

      if (!token) {
        clearAuth();
        setAuthorized(false);
        setChecking(false);
        return;
      }

      try {
        await verifyAdminProfile(token);
        setAuthorized(true);
      } catch {
        try {
          const refreshedToken = await refreshAccessToken();
          if (!refreshedToken) {
            clearAuth();
            setAuthorized(false);
            return;
          }

          await verifyAdminProfile(refreshedToken);
          setAuthorized(true);
        } catch {
          clearAuth();
          setAuthorized(false);
        }
      } finally {
        setChecking(false);
      }
    };

    verify();
  }, []);

  if (checking) {
    return <div style={{ padding: "24px" }}>Checking admin access...</div>;
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminAuthGate;
