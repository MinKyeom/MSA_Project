// src/components/common/HeaderThemeToggle.jsx
"use client"; 

import { useTheme } from "../../providers/ThemeProvider"; 

// ⭐ 전역 테마 토글 컴포넌트
export default function HeaderThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme} 
      className="global-theme-toggle"
      // 🌟 UI 텍스트 한국어 우선: 라이트/다크 모드 전환
      title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"} 
    >
      {/* 감성적인 아이콘 사용 */}
      {isDarkMode ? "☀️" : "🌙"}
    </button>
  );
};