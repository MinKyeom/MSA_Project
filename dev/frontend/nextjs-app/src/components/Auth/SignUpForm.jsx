// src/components/Auth/SignUpForm.jsx
"use client";

import { useState, useEffect } from "react";
import {
  registerAuth,
  sendVerificationCode,
  verifyCode,
} from "../../services/api/auth";
import {
  checkUsernameDuplicate,
  checkNicknameDuplicate,
} from "../../services/api/user";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/useToast";
import "../../../src/components/Auth/Signup.css";

export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [nicknameError, setNicknameError] = useState("");

  const router = useRouter();
  const { showToast } = useToast();

  // 아이디/닉네임 중복 체크 로직 (기존 유지)
  useEffect(() => {
    if (!username) {
      setUsernameError("");
      return;
    }
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        const isDuplicate = await checkUsernameDuplicate(username);
        if (isDuplicate) setUsernameError("이미 사용 중인 아이디입니다.");
        else setUsernameError("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (!nickname) {
      setNicknameError("");
      return;
    }
    const timer = setTimeout(async () => {
      const isDuplicate = await checkNicknameDuplicate(nickname);
      if (isDuplicate) setNicknameError("이미 사용 중인 닉네임입니다.");
      else setNicknameError("");
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("유효한 이메일을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await sendVerificationCode(email);
      showToast({ message: "인증번호가 발송되었습니다.", type: "success" });
      setIsEmailSent(true);
      setEmailError("");
    } catch (error) {
      // 403 에러 발생 시 사용자에게 알림
      showToast({
        message: "서버 접근 권한이 없습니다(403). 관리자에게 문의하세요.",
        type: "error"
      });
      setEmailError("인증 요청 실패 (Security 설정 확인 필요)");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const success = await verifyCode(email, verificationCode);
      if (success) {
        showToast({ message: "인증되었습니다.", type: "success" });
        setIsVerified(true);
      } else {
        showToast({ message: "인증번호가 일치하지 않습니다.", type: "error" });
      }
    } catch (error) {
      showToast({ message: "인증 확인 중 오류 발생", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast({ message: "비밀번호가 일치하지 않습니다.", type: "error" });
      return;
    }
    if (!isVerified) {
      showToast({ message: "이메일 인증을 완료해주세요.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await registerAuth({ username, password, nickname, email });
      showToast({ message: "가입을 환영합니다!", type: "success" });
      router.push("/signin");
    } catch (error) {
      showToast({
        message: "가입 실패: " + (error.response?.data?.message || "오류 발생"),
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSignup}>
      {/* 아이디 */}
      <div className="form-group">
        <label>아이디</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="3자 이상"
        />
        {usernameError && (
          <span className="error-text">{usernameError}</span>
        )}
      </div>

      {/* 닉네임 */}
      <div className="form-group">
        <label>닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        {nicknameError && (
          <span className="error-text">{nicknameError}</span>
        )}
      </div>

      {/* 이메일 & 인증요청 버튼 */}
      <div className="form-group">
        <label>이메일 주소</label>
        <div className="email-verification-container">
          <div className="email-input-wrapper">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isVerified}
              placeholder="example@mink.com"
            />
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading || isVerified}
            className="verify-btn"
          >
            {isEmailSent ? "재발송" : "인증요청"}
          </button>
        </div>
        {emailError && (
          <span className="error-text">{emailError}</span>
        )}
      </div>

      {/* 인증번호 입력란 - 이메일 발송 성공 시에만 노출 */}
      {isEmailSent && !isVerified && (
        <div className="form-group verification-code-section">
          <label>인증번호 6자리</label>
          <div className="verification-input-container">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              className="confirm-btn"
              disabled={loading}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 비밀번호 */}
      <div className="form-group">
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="auth-button"
        disabled={
          loading || !!usernameError || !!nicknameError || !isVerified || !email
        }
      >
        {loading ? "처리 중..." : "회원가입 완료"}
      </button>
    </form>
  );
}
