// src/components/Auth/SignInForm.jsx
"use client";

import { useState } from "react";
import { loginUser } from "../../services/api/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import "../../../src/components/Auth/Signup.css";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://minkowskim.com";

export default function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { refreshAuth } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await loginUser({ username, password });
      showToast({ message: "로그인 성공!", type: "success" });
      router.push("/");
      refreshAuth();
    } catch (error) {
      showToast({ message: error.message || "로그인 실패: ID 또는 비밀번호를 확인해주세요.", type: "error" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>아이디</label>
          <input
            type="text"
            placeholder="ID를 입력해주세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "1rem", width: "100%" }}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="oauth-divider">
        <span>또는</span>
      </div>

      <div className="oauth-buttons">
        <a
          href={`${AUTH_BASE}/auth/oauth2/authorization/google`}
          className="oauth-btn oauth-google"
          aria-label="Google로 로그인"
        >
          <span className="oauth-icon">G</span>
          Google로 로그인
        </a>
        <a
          href={`${AUTH_BASE}/auth/oauth2/authorization/kakao`}
          className="oauth-btn oauth-kakao"
          aria-label="카카오로 로그인"
        >
          <span className="oauth-icon">K</span>
          카카오로 로그인
        </a>
      </div>
    </div>
  );
}