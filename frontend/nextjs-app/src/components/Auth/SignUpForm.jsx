// src/components/Auth/SignUpForm.jsx
"use client"; 

import { useState, useEffect } from "react";
import { registerUser, checkUsernameDuplicate, checkNicknameDuplicate } from "../../services/api/auth"; 
import { useRouter } from "next/navigation"; 
import { useAuth } from "../../providers/AuthProvider"; 
import { useToast } from "../../hooks/useToast"; 
import "../../../src/components/Auth/Signup.css"; 

export default function SignupForm() {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState(""); 
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [loading, setLoading] = useState(false); 

  // 실시간 에러 상태
  const [usernameError, setUsernameError] = useState("");
  const [nicknameError, setNicknameError] = useState("");

  const router = useRouter(); 
  const { showToast } = useToast(); 

  // 아이디 실시간 중복 검사 (디바운싱)
  useEffect(() => {
    if (!username) {
      setUsernameError("");
      return;
    }
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        const isDuplicate = await checkUsernameDuplicate(username);
        if (isDuplicate) {
          setUsernameError("이미 사용 중인 아이디입니다.");
        } else {
          setUsernameError("");
        }
      } else {
        setUsernameError("아이디는 3자 이상이어야 합니다.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // 닉네임 실시간 중복 검사 (디바운싱)
  useEffect(() => {
    if (!nickname) {
      setNicknameError("");
      return;
    }
    const timer = setTimeout(async () => {
      if (nickname.length >= 2) {
        const isDuplicate = await checkNicknameDuplicate(nickname);
        if (isDuplicate) {
          setNicknameError("이미 사용 중인 닉네임입니다.");
        } else {
          setNicknameError("");
        }
      } else {
        setNicknameError("닉네임은 2자 이상이어야 합니다.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameError || nicknameError) {
      showToast({ message: "입력 정보를 다시 확인해주세요.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
        showToast({ message: "비밀번호가 일치하지 않습니다.", type: "warning" }); 
        return;
    }

    setLoading(true);
    try {
      await registerUser({ username, password, nickname });
      showToast({ message: "회원가입 성공! 로그인해주세요.", type: "success" });
      router.push("/signin"); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      showToast({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>아이디</label>
          <input
            type="text"
            placeholder="3자 이상의 ID를 입력해주세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className={usernameError ? "input-error" : ""}
          />
          {usernameError && <span className="error-message" style={{color: 'red', fontSize: '12px', marginTop: '4px', display: 'block'}}>{usernameError}</span>}
        </div>

        <div className="form-group">
          <label>닉네임</label>
          <input
            type="text"
            placeholder="블로그에 표시될 닉네임을 입력해주세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            disabled={loading}
            className={nicknameError ? "input-error" : ""}
          />
          {nicknameError && <span className="error-message" style={{color: 'red', fontSize: '12px', marginTop: '4px', display: 'block'}}>{nicknameError}</span>}
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

        <div className="form-group">
          <label>비밀번호 확인</label>
          <input
            type="password"
            placeholder="비밀번호를 다시 한번 입력해주세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="auth-button" 
          disabled={loading || !!usernameError || !!nicknameError || !username || !nickname || !password}
        >
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </div>
  );
}