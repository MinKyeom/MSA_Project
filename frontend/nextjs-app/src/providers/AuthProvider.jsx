"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthUser } from '../services/api/auth'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false, 
    id: null, 
    nickname: null 
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState(false); 

  useEffect(() => {
    // 1. 로컬 스토리지 정보로 1차 초기화
    const localUser = getAuthUser();
    setAuthState(localUser);
    
    // 2. [추가 권장] 실제 운영 시에는 여기서 서버에 'me' API를 호출하여 
    // HttpOnly 쿠키가 유효한지 최종 확인하는 로직이 들어가야 403 에러를 미리 방지할 수 있습니다.
    
    setIsAuthInitialized(true);
  }, []);

  const refreshAuth = () => {
    setAuthState(getAuthUser());
  };

  const manualLogout = () => {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};