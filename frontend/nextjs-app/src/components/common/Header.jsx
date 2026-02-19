"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutUser } from "../../services/api/auth";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import Sidebar from "./Sidebar";
import HeaderThemeToggle from "./HeaderThemeToggle";
import "../../styles/Header.css";

export default function Header() {
  const { isAuthenticated, nickname, refreshAuth, extendSessionManually } = useAuth();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [extending, setExtending] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast({ message: "로그아웃 되었습니다.", type: "success" });
      refreshAuth();
    } catch (error) {
      showToast({ message: "오류가 발생했습니다.", type: "error" });
      console.error(error);
      refreshAuth();
    }
  };

  const handleExtendSession = async () => {
    setExtending(true);
    try {
      const ok = await extendSessionManually();
      if (ok) showToast({ message: "세션이 30분 연장되었습니다.", type: "success" });
    } catch (e) {
      showToast({ message: "세션 연장에 실패했습니다.", type: "error" });
    } finally {
      setExtending(false);
    }
  };

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />

      <header className="main-header">
        <div className="header-content-fluid">
          <div className="header-left-group">
            <button
              className="hamburger-button-fixed"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              ☰
            </button>

            <Link href="/" className="logo-text-header">
              MinKowskiM
            </Link>

            <HeaderThemeToggle />
          </div>

          <nav className="header-auth-nav">
            {isAuthenticated ? (
              <div className="auth-user-info">
                <span className="user-nickname-display">{nickname || "회원"}님</span>
                <button
                  type="button"
                  onClick={handleExtendSession}
                  disabled={extending}
                  className="btn-primary-small"
                  title="세션 30분 연장"
                  style={{ marginRight: "6px" }}
                >
                  {extending ? "연장 중…" : "세션 연장"}
                </button>
                <button onClick={handleLogout} className="btn-primary-small">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link href="/signin" className="btn-primary-small">
                  로그인
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
