// src/providers/AuthProvider.jsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthUser, logoutUser } from '../services/api/auth'; 

// 1. Context 생성
const AuthContext = createContext();

// 2. Custom Hook
export const useAuth = () => useContext(AuthContext);

// 3. Provider 컴포넌트
export const AuthProvider = ({ children }) => {
  // ⭐ [수정] 초기 상태를 안전한 값으로 설정 (서버 렌더링 시 UI 불일치 방지)
  const [authState, setAuthState] = useState({
    isAuthenticated: false, 
    id: null, 
    nickname: null 
  });
  // 초기화 상태 추가: 클라이언트에서 인증 상태를 로드했는지 확인
  const [isAuthInitialized, setIsAuthInitialized] = useState(false); 

  // ⭐ [수정] 컴포넌트가 클라이언트에서 마운트된 후 (Hydration 후) 상태를 초기화
  useEffect(() => {
    // getAuthUser()는 localStorage에 접근하므로, 반드시 클라이언트 환경에서 실행
    setAuthState(getAuthUser());
    setIsAuthInitialized(true);
  }, []);

  // 인증 상태를 수동으로 새로고침하는 함수
  const refreshAuth = () => {
    // auth.js에서 최신 정보를 가져와 상태 업데이트
    setAuthState(getAuthUser());
  };

  // 로그아웃을 API 호출 없이 강제로 처리하는 경우를 대비
  const manualLogout = () => {
    // 로컬 스토리지에 저장된 사용자 정보 삭제
    if (typeof window !== 'undefined') {
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentUserNickname");
    }
    setAuthState({ isAuthenticated: false, id: null, nickname: null });
  };
  
  const value = {
    ...authState,
    refreshAuth,
    isAuthInitialized,
    manualLogout,
  };

  // 주석: 인증 상태가 초기화될 때까지 children 렌더링을 지연시킬 수 있지만, 
  // Next.js 환경에서는 초기 상태로 렌더링한 후 useEffect에서 업데이트하는 것이 일반적입니다.
  // if (!isAuthInitialized) {
  //   return null; 
  // }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};