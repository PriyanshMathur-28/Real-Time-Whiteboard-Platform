import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      fontFamily: "Inter, sans-serif",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div style={{
        fontSize: "5rem",
        fontWeight: 900,
        color: "#fb923c",
        lineHeight: 1,
        marginBottom: "1rem"
      }}>
        404
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#64748b", maxWidth: "400px", marginBottom: "2rem" }}>
        The whiteboard room or page you are looking for doesn't exist or has moved.
      </p>
      <Link
        to="/dashboard"
        style={{
          background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
          color: "white",
          padding: "0.75rem 1.75rem",
          borderRadius: "0.75rem",
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
        }}
      >
        Go to My Boards
      </Link>
    </div>
  );
};

export default NotFound;
