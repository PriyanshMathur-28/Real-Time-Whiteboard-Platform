import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "wb-auth";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate stored token against the server on load
  useEffect(() => {
    async function verifyToken() {
      if (!auth?.token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${SERVER_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Update user if server returns fresh data
          if (data.user) {
            setAuth((prev) => {
              const updated = { ...prev, user: data.user };
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } else {
          // Token is invalid/expired
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setAuth(null);
        }
      } catch {
        // If server is unreachable in dev, keep local session so user isn't abruptly logged out offline
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = ({ token, user }) => {
    const session = { token, user };
    setAuth(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUser = (updatedUser) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, user: { ...prev.user, ...updatedUser } };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        user: auth?.user || null,
        token: auth?.token || null,
        isAuthenticated: !!auth?.token,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
