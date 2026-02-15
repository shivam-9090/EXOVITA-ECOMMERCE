import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

    const verifyAdminToken = async (token: string) => {
      await axios.get(`${API_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    };

    const tryAutoLogin = async () => {
      let existingToken = localStorage.getItem("accessToken");

      if (!existingToken) {
        try {
          existingToken = await refreshAccessToken();
        } catch {
          existingToken = null;
        }
      }

      if (!existingToken) {
        clearAuth();
        return;
      }

      try {
        await verifyAdminToken(existingToken);
        navigate("/admin", { replace: true });
      } catch {
        try {
          const refreshedToken = await refreshAccessToken();
          if (!refreshedToken) {
            clearAuth();
            return;
          }

          await verifyAdminToken(refreshedToken);
          navigate("/admin", { replace: true });
        } catch {
          clearAuth();
        }
      }
    };

    const check2faStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/auth/2fa/status`);
        setTwoFactorEnabled(!!response.data?.enabled);
      } catch {
        setTwoFactorEnabled(false);
      }
    };

    tryAutoLogin();
    check2faStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/admin/auth/login`, {
        password,
        twoFactorCode,
      });

      const { accessToken, refreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      if (response.data?.requires2faSetup) {
        navigate("/admin/settings?setup2fa=1", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <p>Authorized administrators only</p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          {twoFactorEnabled ? (
            <div className="admin-login-field">
              <label>2FA Code</label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 2FA code"
                required
              />
            </div>
          ) : (
            <div className="admin-login-setup">
              <p>
                2FA is not configured yet. Login with password, then set up 2FA
                in Settings.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Login to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
