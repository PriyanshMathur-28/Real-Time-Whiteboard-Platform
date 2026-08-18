import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import "../css/AuthPage.css";

const SERVER_URL = (process.env.REACT_APP_SERVER_URL || "http://localhost:5000").replace(/\/+$/, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function apiRequest(path, body) {
  let res;
  try {
    res = await fetch(`${SERVER_URL}/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Please check your connection and try again.");
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON error body — fall through with generic message below
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

const PasswordStrengthHint = ({ password }) => {
  if (!password) return null;
  const ok = password.length >= 8;
  return (
    <span className={`ap-hint ${ok ? "ap-hint--ok" : "ap-hint--warn"}`}>
      {ok ? "Looks good." : "At least 8 characters."}
    </span>
  );
};

const AuthPage = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState(() => {
    if (location.pathname.includes("signup")) return "signup";
    if (location.pathname.includes("forgot")) return "forgot";
    if (location.pathname.includes("reset")) return "reset";
    return initialMode;
  });

  const [loading, setLoading] = useState(false);

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset-password-specific
  const [resetToken, setResetToken] = useState(null);
  const [forgotSent, setForgotSent] = useState(false);

  // Update mode when path changes
  useEffect(() => {
    if (location.pathname.includes("signup")) setMode("signup");
    else if (location.pathname.includes("forgot")) setMode("forgot");
    else if (location.pathname.includes("reset")) setMode("reset");
    else if (location.pathname.includes("login")) setMode("login");
  }, [location.pathname]);

  // Check URL query parameters for reset link or pre-filled email
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("resetToken") || params.get("token");
    const linkedEmail = params.get("email");
    if (token) {
      setResetToken(token);
      setMode("reset");
      if (linkedEmail) setEmail(linkedEmail);
    }
  }, [location.search]);

  const switchMode = (next) => {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setForgotSent(false);
    if (next === "login") navigate("/login", { state: location.state });
    else if (next === "signup") navigate("/signup", { state: location.state });
    else if (next === "forgot") navigate("/forgot-password", { state: location.state });
  };

  const handleAuthSuccess = (data) => {
    login(data);
    const destination = location.state?.from?.pathname
      ? location.state.from.pathname + (location.state.from.search || "")
      : "/dashboard";
    navigate(destination, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/login", { email: email.trim(), password });
      toast.success(`Welcome back, ${data.user.name}!`);
      handleAuthSuccess(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/signup", { name: name.trim(), email: email.trim(), password });
      toast.success(`Welcome, ${data.user.name}! Your account is ready.`);
      handleAuthSuccess(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/forgot-password", { email: email.trim() });
      setForgotSent(true);
      toast.info(data.message || "If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/reset-password", {
        token: resetToken,
        email: email.trim(),
        password,
      });
      toast.success("Password reset! You're now signed in.");
      handleAuthSuccess(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <svg className="ap-doodle ap-doodle-scribble" viewBox="0 0 80 40" fill="none">
        <path d="M2 20c8-16 16 16 24 0s16 16 24 0 16 16 26 0" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="ap-doodle ap-doodle-circle" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="24" stroke="#e11d48" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
      </svg>

      <div className="ap-card">
        <Link to="/" className="ap-logo" style={{ textDecoration: "none" }}>
          <svg className="ap-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="ap-logo-text">Whiteboard</span>
        </Link>

        {location.state?.from && (
          <div style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "0.5rem",
            padding: "0.5rem 0.75rem",
            marginBottom: "1rem",
            fontSize: "0.825rem",
            color: "#c2410c",
            textAlign: "center"
          }}>
            Please sign in or create an account to continue.
          </div>
        )}

        {/* ── Login / Signup tabs ─────────────────────────────────────────── */}
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="ap-tabs">
              <button
                type="button"
                className={`ap-tab ${mode === "login" ? "ap-tab--active" : ""}`}
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className={`ap-tab ${mode === "signup" ? "ap-tab--active" : ""}`}
                onClick={() => switchMode("signup")}
              >
                Sign up
              </button>
            </div>

            <form
              className="ap-form"
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              noValidate
            >
              {mode === "signup" && (
                <div className="ap-input-group">
                  <label className="ap-label" htmlFor="ap-name">Full name</label>
                  <input
                    id="ap-name"
                    type="text"
                    className="ap-input"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="ap-input-group">
                <label className="ap-label" htmlFor="ap-email">Email</label>
                <input
                  id="ap-email"
                  type="email"
                  className="ap-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="ap-input-group">
                <div className="ap-label-row">
                  <label className="ap-label" htmlFor="ap-password">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="ap-link-btn"
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="ap-password-wrap">
                  <input
                    id="ap-password"
                    type={showPassword ? "text" : "password"}
                    className="ap-input"
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="ap-eye-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "signup" && <PasswordStrengthHint password={password} />}
              </div>

              {mode === "signup" && (
                <div className="ap-input-group">
                  <label className="ap-label" htmlFor="ap-confirm">Confirm password</label>
                  <input
                    id="ap-confirm"
                    type={showPassword ? "text" : "password"}
                    className="ap-input"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button type="submit" className="ap-btn-primary" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "login"
                  ? "Log in"
                  : "Create account"}
              </button>
            </form>

            <p className="ap-switch-text">
              {mode === "login" ? (
                <>Don't have an account? <button type="button" className="ap-link-btn" onClick={() => switchMode("signup")}>Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" className="ap-link-btn" onClick={() => switchMode("login")}>Log in</button></>
              )}
            </p>
          </>
        )}

        {/* ── Forgot password ─────────────────────────────────────────────── */}
        {mode === "forgot" && (
          <>
            <h2 className="ap-subtitle">Reset your password</h2>
            <p className="ap-desc">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>

            {forgotSent ? (
              <div className="ap-sent-box">
                <p>If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder).</p>
                <button type="button" className="ap-link-btn" onClick={() => setForgotSent(false)}>
                  Send another link
                </button>
              </div>
            ) : (
              <form className="ap-form" onSubmit={handleForgotPassword} noValidate>
                <div className="ap-input-group">
                  <label className="ap-label" htmlFor="ap-forgot-email">Email</label>
                  <input
                    id="ap-forgot-email"
                    type="email"
                    className="ap-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <button type="submit" className="ap-btn-primary" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}

            <p className="ap-switch-text">
              <button type="button" className="ap-link-btn" onClick={() => switchMode("login")}>
                ← Back to log in
              </button>
            </p>
          </>
        )}

        {/* ── Reset password (from emailed link) ──────────────────────────── */}
        {mode === "reset" && (
          <>
            <h2 className="ap-subtitle">Choose a new password</h2>
            <p className="ap-desc">Resetting the password for <strong>{email}</strong>.</p>

            <form className="ap-form" onSubmit={handleResetPassword} noValidate>
              <div className="ap-input-group">
                <label className="ap-label" htmlFor="ap-new-password">New password</label>
                <div className="ap-password-wrap">
                  <input
                    id="ap-new-password"
                    type={showPassword ? "text" : "password"}
                    className="ap-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="ap-eye-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <PasswordStrengthHint password={password} />
              </div>

              <div className="ap-input-group">
                <label className="ap-label" htmlFor="ap-confirm-new">Confirm new password</label>
                <input
                  id="ap-confirm-new"
                  type={showPassword ? "text" : "password"}
                  className="ap-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="ap-btn-primary" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>

            <p className="ap-switch-text">
              <button
                type="button"
                className="ap-link-btn"
                onClick={() => switchMode("login")}
              >
                ← Back to log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
