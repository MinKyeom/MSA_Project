"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthUser } from "../services/api/auth";
import { fetchMe } from "../services/api/user";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    id: null,
    nickname: null,
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. 로컬 스토리지 정보로 우선 1차 초기화 (사용자 경험을 위해 UI를 즉시 노출)
      const localUser = getAuthUser();
      if (localUser.isAuthenticated) {
        setAuthState(localUser);
      }

      // 2. [핵심 수정] 서버에 실제 세션 유효성 확인 (Me API 호출)
      // 프라이빗 모드에서 로컬 스토리지가 비어있거나 쿠키만 있을 경우를 대비합니다.
      try {
        const serverUser = await fetchMe();

        if (serverUser && serverUser.id) {
          // 서버에 유효한 세션이 있는 경우 상태 업데이트 및 로컬 스토리지 동기화
          const updatedState = {
            isAuthenticated: true,
            id: serverUser.id,
            nickname: serverUser.nickname,
          };
          setAuthState(updatedState);

          // 로컬 스토리지에도 최신 정보 저장
          localStorage.setItem("currentUserId", serverUser.id);
          localStorage.setItem("currentUserNickname", serverUser.nickname);
        } else {
          // 🌟 수정: 서버 세션이 없는 경우 (로그인하지 않은 방문자)
          // 조용히 로그아웃 상태로 설정 (알림 없이, 팝업 없이)
          // 이는 정상적인 초기 방문자 상태이므로 에러가 아닙니다
          manualLogout();
        }
      } catch (error) {
        // 🌟 수정: 네트워크 오류 등의 예외적인 상황에도 조용히 처리
        // 페이지 로드 시마다 알림을 표시하지 않습니다
        // 디버깅 목적으로만 콘솔에 기록
        if (process.env.NODE_ENV === 'development') {
          console.debug("인증 확인 과정에서 예외 발생:", error);
        }
        manualLogout();
      } finally {
        // 모든 인증 확인 절차가 완료됨
        setIsAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const refreshAuth = () => {
    setAuthState(getAuthUser());
  };

  const manualLogout = () => {
    if (typeof window !== "undefined") {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
