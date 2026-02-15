import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    const {
      accessToken,
      refreshToken: nextRefreshToken,
      user: userData,
    } = response.data;

    localStorage.setItem("accessToken", accessToken);
    if (nextRefreshToken) {
      localStorage.setItem("refreshToken", nextRefreshToken);
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    if (userData) {
      setUser(userData);
    }

    return accessToken as string;
  };

  // Restore session and token on app boot
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          await loadUser();
          return;
        }

        if (refreshToken) {
          await refreshSession();
          await loadUser();
          return;
        }
      } catch {
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // Auto-refresh access token when APIs return 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config as any;
        const statusCode = error?.response?.status;

        if (
          statusCode === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/auth/login") &&
          !originalRequest.url?.includes("/admin/auth/login") &&
          !originalRequest.url?.includes("/auth/refresh")
        ) {
          originalRequest._retry = true;

          try {
            const nextAccessToken = await refreshSession();
            if (!nextAccessToken) {
              clearAuthState();
              return Promise.reject(error);
            }

            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${nextAccessToken}`,
            };

            return axios(originalRequest);
          } catch {
            clearAuthState();
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      // Token is invalid or expired, clear auth state
      clearAuthState();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
      // Redirect to home page after logout
      window.location.href = "/";
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
