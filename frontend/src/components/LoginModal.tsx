import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LoginModal.css";
const googleIcon = "https://api.exovitaherbal.com/media/google-icon.svg";
import { STORE_API_URL } from "../apiBase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = "login" | "register" | "otp";

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<ModalStep>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setStep("login");
      setName("");
      setEmail("");
      setPassword("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setResendCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${STORE_API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${STORE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${STORE_API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  if (!isOpen) return null;

  const ErrorBox = () =>
    error ? (
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
    ) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {step === "otp" ? (
          <>
            <div className="modal-header" style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <ShieldCheck size={42} color="#2d4a3e" />
              </div>
              <h2>Verify Your Email</h2>
              <p>
                We sent a 6-digit code to <strong>{email}</strong>.<br />
                Enter it below to create your account.
              </p>
            </div>

            <ErrorBox />

            <form className="form-container" onSubmit={handleVerifyOtp}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  margin: "8px 0 20px",
                }}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 44,
                      height: 52,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 700,
                      border: "2px solid",
                      borderColor: digit ? "#2d4a3e" : "#d1d5db",
                      borderRadius: 10,
                      outline: "none",
                      background: digit ? "#f0f7f0" : "#fff",
                      color: "#2d4a3e",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>

              <button
                className="submit-btn"
                type="submit"
                disabled={loading || otp.join("").length < 6}
              >
                {loading ? "Verifying…" : "Verify & Create Account"}
              </button>
            </form>

            <div className="modal-footer">
              <p>
                Didn't receive the code?{" "}
                <button
                  className="toggle-btn"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <RefreshCw size={13} />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </p>
              <p>
                <button
                  className="toggle-btn"
                  onClick={() => {
                    setStep("register");
                    setError("");
                  }}
                >
                  ← Back to Registration
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h2>{step === "register" ? "Create Account" : "Welcome Back"}</h2>
              <p>
                {step === "register"
                  ? "Join the Exovita community for exclusive rewards."
                  : "Log in to access your wishlist and orders."}
              </p>
            </div>

            <ErrorBox />

            <form
              className="form-container"
              onSubmit={step === "register" ? handleSendOtp : handleLogin}
            >
              {step === "register" && (
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
                {loading
                  ? "Please wait…"
                  : step === "register"
                    ? "Send Verification Code →"
                    : "Log In"}
              </button>

              <div className="divider">
                <span>Or continue with</span>
              </div>

              <button
                className="google-btn"
                type="button"
                onClick={loginWithGoogle}
              >
                <img src={googleIcon} alt="Google" className="google-icon" />
                <span>Google</span>
              </button>
            </form>

            <div className="modal-footer">
              <p>
                {step === "register"
                  ? "Already have an account?"
                  : "Don't have an account?"}
                <button
                  className="toggle-btn"
                  onClick={() => {
                    setStep(step === "register" ? "login" : "register");
                    setError("");
                  }}
                >
                  {step === "register" ? "Log In" : "Sign Up"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
