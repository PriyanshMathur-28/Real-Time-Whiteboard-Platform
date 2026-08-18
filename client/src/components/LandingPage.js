import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/JoinCreateRoom.css";

const LandingPage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="wb-page">
      {/* Decorative doodles */}
      <svg className="wb-doodle wb-doodle-scribble" viewBox="0 0 80 40" fill="none">
        <path d="M2 20c8-16 16 16 24 0s16 16 24 0 16 16 26 0" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="wb-doodle wb-doodle-circle" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="24" stroke="#0891b2" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
      </svg>
      <svg className="wb-doodle wb-doodle-star" viewBox="0 0 40 40" fill="none">
        <path d="M20 2l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>

      {/* Navigation */}
      <nav className="wb-nav">
        <div className="wb-nav-content">
          <Link to="/" className="wb-logo" style={{ textDecoration: "none" }}>
            <svg className="wb-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="wb-logo-text-group">
              <span className="wb-logo-text">Whiteboard</span>
              <svg className="wb-logo-underline" viewBox="0 0 100 8" fill="none">
                <path d="M2 5c14-6 20 4 32 0s20-6 32 0 20 4 32 0" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </Link>

          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                {user?.name}
              </span>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "#0891b2", border: "none", borderRadius: "0.5rem",
                  padding: "0.4rem 1rem", fontSize: "0.85rem", fontWeight: 600,
                  color: "white", cursor: "pointer",
                }}
              >
                Go to Dashboard →
              </button>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: "none", border: "1px solid #e2e8f0", borderRadius: "0.5rem",
                  padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 700,
                  color: "#64748b", cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Link
                to="/login"
                style={{
                  background: "none", border: "none", fontSize: "0.9rem", fontWeight: 600,
                  color: "#64748b", cursor: "pointer", padding: "0.5rem", textDecoration: "none",
                }}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                style={{
                  background: "#0891b2", border: "none", borderRadius: "0.5rem",
                  padding: "0.45rem 1.1rem", fontSize: "0.9rem", fontWeight: 600,
                  color: "white", cursor: "pointer", textDecoration: "none",
                }}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="wb-hero" style={{ padding: "4rem 1rem 6rem" }}>
        <div className="wb-container">
          <div className="wb-badge-wrapper">
            <div className="wb-badge">
              <span className="wb-badge-dot" />
              Real-time Collaboration Platform
            </div>
          </div>

          <h1 className="wb-title">
            Draw Together. Create Magic.
          </h1>

          <p className="wb-subtitle">
            The most elegant whiteboard platform for teams, educators, and creators.
            Sign in to start creating, collaborating, and managing your boards with instant real-time sync.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="wb-btn-primary wb-btn-orange"
                style={{ width: "auto", padding: "0.85rem 2rem", fontSize: "1.05rem" }}
              >
                <span>Go to My Boards</span>
                <svg className="wb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="wb-btn-primary wb-btn-orange"
                  style={{ width: "auto", padding: "0.85rem 2rem", fontSize: "1.05rem", textDecoration: "none" }}
                >
                  <span>Get Started for Free</span>
                  <svg className="wb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.85rem 1.75rem", borderRadius: "0.75rem",
                    border: "1.5px solid #cbd5e1", background: "white",
                    color: "#334155", fontWeight: 700, fontSize: "1.05rem",
                    textDecoration: "none", transition: "all 0.2s"
                  }}
                >
                  Log in to Account
                </Link>
              </>
            )}
          </div>

          <div className="wb-benefits" style={{ marginTop: "3.5rem" }}>
            <div className="wb-benefit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Live sync & persistent rooms
            </div>
            <div className="wb-benefit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
              </svg>
              Saved boards dashboard
            </div>
            <div className="wb-benefit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" />
                <path d="M10 18h4" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Rich tools & live chat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
