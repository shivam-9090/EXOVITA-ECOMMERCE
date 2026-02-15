import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LoginModal.css";
import googleIcon from "../assets/google-icon.svg";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {isRegistering
              ? "Join the Exovita community for exclusive rewards."
              : "Log in to access your wishlist and orders."}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form className="form-container" onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <UserIcon size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegistering ? "Sign Up" : "Log In"}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <button
            className="google-btn"
            type="button"
            onClick={handleGoogleLogin}
          >
            <img src={googleIcon} alt="Google" className="google-icon" />
            <span>Google</span>
          </button>
        </form>

        <div className="modal-footer">
          <p>
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}
            <button
              className="toggle-btn"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
