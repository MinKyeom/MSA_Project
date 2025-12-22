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
  const { isAuthenticated, nickname, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
              MinKowski
            </Link>

            <HeaderThemeToggle />
          </div>

          <nav className="header-auth-nav">
            {isAuthenticated ? (
              <div className="auth-user-info">
                <span className="user-nickname-display">{nickname}님</span>
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
