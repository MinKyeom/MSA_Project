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
        if (isDuplicate) setUsernameError("This username is already taken.");
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
      if (isDuplicate) setNicknameError("This nickname is already taken.");
      else setNicknameError("");
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendVerificationCode(email);
      showToast({ message: "Verification code has been sent.", type: "success" });
      setIsEmailSent(true);
      setEmailError("");
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      if (status === 502 || status === 503) {
        showToast({ message: "Mail service is temporarily unavailable. Please try again later.", type: "error" });
        setEmailError("Mail service unavailable");
      } else if (status === 403) {
        showToast({ message: "Server access denied (403). Contact the administrator.", type: "error" });
        setEmailError("Verification request failed");
      } else {
        showToast({ message: msg || "Failed to send verification code.", type: "error" });
        setEmailError(msg || "Verification request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const success = await verifyCode(email, verificationCode);
      if (success) {
        showToast({ message: "Verified successfully.", type: "success" });
        setIsVerified(true);
      } else {
        showToast({ message: "Verification code does not match.", type: "error" });
      }
    } catch (error) {
      showToast({ message: "Verification failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast({ message: "Passwords do not match.", type: "error" });
      return;
    }
    if (!isVerified) {
      showToast({ message: "Please complete email verification.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await registerAuth({ username, password, nickname, email });
      showToast({ message: "Welcome! Your account has been created.", type: "success" });
      router.push("/signin");
    } catch (error) {
      showToast({
        message: "Sign up failed: " + (error.response?.data?.message || "An error occurred"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSignup}>
      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="At least 3 characters"
        />
        {usernameError && (
          <span
            className="error-text"
            style={{ color: "red", fontSize: "12px" }}
          >
            {usernameError}
          </span>
        )}
      </div>

      <div className="form-group">
        <label>Nickname</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        {nicknameError && (
          <span
            className="error-text"
            style={{ color: "red", fontSize: "12px" }}
          >
            {nicknameError}
          </span>
        )}
      </div>

      <div className="form-group">
        <label>Email</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
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
            className="btn-secondary-small verify-btn"
            style={{ whiteSpace: "nowrap", minHeight: "45px" }}
          >
            {isEmailSent ? "Resend" : "Send code"}
          </button>
        </div>
        {emailError && (
          <span style={{ color: "red", fontSize: "12px" }}>{emailError}</span>
        )}
      </div>

      {isEmailSent && !isVerified && (
        <div
          className="form-group"
          style={{
            marginTop: "-10px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <label>6-digit verification code</label>
          <div style={{ display: "flex", gap: "10px" }}>
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
              style={{
                padding: "0 20px",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "4px",
              }}
            >
              Verify
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Confirm password</label>
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
          loading || !!usernameError || !!nicknameError || !isVerified || !email // 이메일 값이 비어있는지 추가 확인
        }
        style={{ marginTop: "20px" }}
      >
        {loading ? "Processing..." : "Sign up"}
      </button>
    </form>
  );
}
