import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import MyBoards from "./components/MyBoards";
import BoardPage from "./components/BoardPage";
import NotFound from "./components/NotFound";
import "./css/style.css";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes (Redirects to /dashboard if already logged in) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="login" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="signup" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="forgot" />
              </PublicOnlyRoute>
            }
          />
          <Route path="/reset-password" element={<AuthPage initialMode="reset" />} />

          {/* Protected Routes (Requires logged-in account) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MyBoards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/board/:roomId"
            element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;