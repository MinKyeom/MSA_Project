// src/components/Auth/SignInForm.jsx
"use client"; 

import { useState } from "react";
import { loginUser } from "../../services/api/auth"; 
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast"; 
import "../../../src/components/Auth/Signup.css"; 

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

      // 🌟 UI 텍스트 한국어 우선: 로그인 성공!
      showToast({ message: "로그인 성공!", type: "success" }); 
      router.push("/"); 
      refreshAuth(); 
    } catch (error) {
      // 🌟 UI 텍스트 한국어 우선: 로그인 실패: ID 또는 비밀번호를 확인해주세요.
      showToast({ message: error.message || "로그인 실패: ID 또는 비밀번호를 확인해주세요.", type: "error" }); 
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        {/* 🌟 UI 텍스트 한국어 우선: 아이디 */}
        <label>아이디</label>
        <input
          type="text"
          // 🌟 UI 텍스트 한국어 우선: ID를 입력해주세요
          placeholder="ID를 입력해주세요"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        {/* 🌟 UI 텍스트 한국어 우선: 비밀번호 */}
        <label>비밀번호</label>
        <input
          type="password"
          // 🌟 UI 텍스트 한국어 우선: 비밀번호를 입력해주세요
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <button 
        type="submit" 
        className="btn-primary"
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        {/* 🌟 UI 텍스트 한국어 우선: 로그인 / 로그인 중... */}
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}