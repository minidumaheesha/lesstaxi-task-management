import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import api, { TOKEN_KEY } from "./services/api";
import TaskBoard from "./pages/TaskBoard";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState("");

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        if (!sessionStorage.getItem(TOKEN_KEY)) {
          return;
        }

        const response = await api.get("/auth/me");

        if (active) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        if (!active) return;

        if (error.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setUser(null);
        } else {
          setStartupError(
            "Unable to verify your session. Check your connection and try again."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const handleAuthenticated = ({ token, user: authenticatedUser }) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    setUser(authenticatedUser);
  };

  const handleLogout = useCallback(() => {
  sessionStorage.removeItem(TOKEN_KEY);
  setUser(null);
  }, []);

  if (isLoading) {
    return (
      <main className="auth-layout">
        <p role="status">Loading your workspace...</p>
      </main>
    );
  }

  if (startupError) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <p role="alert">{startupError}</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

    return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage
                key="login"
                mode="login"
                onAuthenticated={handleAuthenticated}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage
                key="register"
                mode="register"
                onAuthenticated={handleAuthenticated}
              />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <TaskBoard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;