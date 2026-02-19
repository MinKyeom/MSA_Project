// src/components/common/HeaderThemeToggle.jsx
"use client";

import { useTheme } from "../../providers/ThemeProvider";

// 라이트 모드 아이콘 (태양)
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

// 다크 모드 아이콘 (달)
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export default function HeaderThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="global-theme-toggle"
      title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDarkMode ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}