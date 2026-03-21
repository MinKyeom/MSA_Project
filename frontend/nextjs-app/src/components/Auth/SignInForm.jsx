// src/components/Auth/SignInForm.jsx
"use client";

import { useState } from "react";
import { loginUser } from "../../services/api/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import "./Signup.css";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://minkowskim.com";

export default function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setLoginState } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser({ username, password });
      setLoginState({ id: data.id, nickname: data.nickname ?? data.username, username: data.username });
      showToast({ message: "Logged in successfully.", type: "success" });
      router.push("/");
    } catch (error) {
      showToast({ message: error.message || "Log in failed. Check your username and password.", type: "error" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "1rem", width: "100%" }}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="oauth-divider">
        <span>or</span>
      </div>

      <div className="oauth-buttons">
        <a
          href={`${AUTH_BASE}/auth/oauth2/authorization/google`}
          className="oauth-btn oauth-google"
          aria-label="Log in with Google"
        >
          <span className="oauth-icon">G</span>
          Log in with Google
        </a>
        <a
          href={`${AUTH_BASE}/auth/oauth2/authorization/kakao`}
          className="oauth-btn oauth-kakao"
          aria-label="Log in with Kakao"
        >
          <span className="oauth-icon">K</span>
          Log in with Kakao
        </a>
      </div>
    </div>
  );
}