
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  // Load saved user
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Load saved JWT token
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  // Save authentication data
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  // Login
  const login = useCallback(async (email, password) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token || !data.user) {
      throw new Error("Invalid login response");
    }

    setUser(data.user);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);

    return data.user;
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Authenticated API requests
  const apiRequest = useCallback(
    async (path, options = {}) => {
      const headers = {
        ...(options.headers || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (options.body != null) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Request failed (${response.status})`
        );
      }

      return data;
    },
    [token]
  );

  // Authentication status
  const isAuthenticated = Boolean(user && token);
  const isTeacher = user?.role === "Teacher";
  const isStudent = user?.role === "Student";

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        apiRequest,
        isAuthenticated,
        isTeacher,
        isStudent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for accessing user authentication
export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider"
    );
  }

  return context;
}
