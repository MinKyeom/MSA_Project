// src/providers/ThemeProvider.jsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Context 생성
const ThemeContext = createContext();

// 2. Custom Hook
export const useTheme = () => useContext(ThemeContext);

// 3. Provider 컴포넌트
export const ThemeProvider = ({ children }) => {
  // ⭐ [수정] 초기 상태를 null로 설정하여, 로컬 스토리지 로딩 전까지는 UI 불일치 방지
  const [isDarkMode, setIsDarkMode] = useState(null); 

  // isDarkMode 상태를 토글하는 함수
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // ⭐ [수정] 컴포넌트 마운트 시 (클라이언트 환경에서) 실제 테마 상태를 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 로컬 스토리지에서 테마 정보 가져오기
    const savedTheme = localStorage.getItem("isDarkMode");
    
    // 저장된 값이 없으면 기본값인 true (다크 모드) 사용
    // isDarkMode의 초기 상태를 로컬 스토리지 값으로 설정
    setIsDarkMode(savedTheme !== null ? JSON.parse(savedTheme) : true);
  }, []);

  // isDarkMode 상태가 변경될 때마다 localStorage와 body 클래스를 업데이트
  useEffect(() => {
    // 초기 로딩 중에는 실행하지 않음
    if (isDarkMode === null || typeof window === 'undefined') return; 
    
    const body = document.body;

    // localStorage에 상태 저장
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));

    // body 클래스 토글: 전역 CSS 변수가 이에 반응합니다.
    if (isDarkMode) {
      body.classList.add("dark-mode");
      body.classList.remove("light-mode");
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
    }
  }, [isDarkMode]);
  
  // isDarkMode가 null이면 (로딩 중) 렌더링을 지연시킵니다.
  // 이 방법은 Next.js의 SSR/SSG에서 초기 UI 깜빡임을 방지하는 데 유용합니다.
  if (isDarkMode === null) {
    return null; 
  }

  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};