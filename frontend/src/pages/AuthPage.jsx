import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AuthPage({ mode, onAuthenticated }) {
  const isRegister = mode === "register";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };

      if (isRegister) {
        payload.name = form.name.trim();
      }

      const response = await api.post(
        isRegister ? "/auth/register" : "/auth/login",
        payload
      );

      onAuthenticated(response.data.data);
    } catch (requestError) {
      const response = requestError.response?.data;

      setError(
        response?.errors?.map((item) => item.message).join(" ") ||
          response?.message ||
          "Unable to connect. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="brand">LessTaxi · Task Manager</p>

        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>

        <p className="muted">
          {isRegister
            ? "Join your team and keep work moving."
            : "Sign in to manage your tasks."}
        </p>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting}>
            {isRegister && (
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>

            <div className="password-group">
              <label htmlFor="password">Password</label>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  minLength={isRegister ? 8 : undefined}
                  aria-describedby={
                    isRegister ? "password-help" : undefined
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-controls="password"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </div>
            </div>

            {isRegister && (
              <p id="password-help" className="muted">
                Use at least 8 characters, including uppercase,
                lowercase, and a number.
              </p>
            )}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <button className="primary-button" type="submit">
              {isSubmitting
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </fieldset>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account? " : "New here? "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}