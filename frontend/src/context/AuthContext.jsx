import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('docmind_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('docmind_session_id') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('docmind_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('docmind_user');
    }
  }, [user]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('docmind_session_id', sessionId);
    } else {
      localStorage.removeItem('docmind_session_id');
    }
  }, [sessionId]);

  const login = async ({ identifier, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      setUser(data.user);
      setSessionId(data.user.session_id);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ username, email, password, confirmPassword }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      setUser(data.user);
      setSessionId(data.user.session_id);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('docmind_user');
    localStorage.removeItem('docmind_session_id');
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
