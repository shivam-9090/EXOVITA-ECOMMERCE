import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const fragmentParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );
        const queryParams = new URLSearchParams(window.location.search);
        const accessToken =
          fragmentParams.get("accessToken") || queryParams.get("accessToken");
        const refreshToken =
          fragmentParams.get("refreshToken") || queryParams.get("refreshToken");

        if (!accessToken || !refreshToken) {
          console.error("Missing tokens in callback");
          window.location.href = "/";
          return;
        }

        // Store tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Redirect immediately to home - AuthContext will pick up tokens
        window.location.href = "/";
      } catch (error) {
        console.error("Error in OAuth callback:", error);
        window.location.href = "/";
      }
    };

    handleCallback();
  }, [navigate]);

  return null;
};

export default AuthCallback;
