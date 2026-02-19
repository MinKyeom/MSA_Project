"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getAuthUser, setOnUnauthorized, extendSession } from "../services/api/auth";
import { fetchMe } from "../services/api/user";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 액세스 토큰 만료 30분 — 만료 5분 전에 세션 연장 시도
const SESSION_EXTEND_INTERVAL_MS = 25 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    id: null,
    nickname: null,
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const sessionTimerRef = useRef(null);

  const manualLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserNickname");
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setAuthState({ isAuthenticated: false, id: null, nickname: null });
  };

  useEffect(() => {
    setOnUnauthorized(manualLogout);
  }, []);

  // 로그인 상태일 때 25분마다 세션 연장 (만료 시 자동 로그아웃)
  useEffect(() => {
    if (!authState.isAuthenticated) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      return;
    }
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(async () => {
      try {
        await extendSession();
      } catch (e) {
        manualLogout();
      }
    }, SESSION_EXTEND_INTERVAL_MS);
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      const localUser = getAuthUser();
      if (localUser.isAuthenticated) {
        setAuthState(localUser);
      }

      try {
        const serverUser = await fetchMe();

        if (serverUser && serverUser.id) {
          const updatedState = {
            isAuthenticated: true,
            id: serverUser.id,
            nickname: serverUser.nickname,
          };
          setAuthState(updatedState);
          localStorage.setItem("currentUserId", serverUser.id);
          localStorage.setItem("currentUserNickname", serverUser.nickname ?? "");
        } else {
          manualLogout();
        }
      } catch (error) {
        console.error("인증 확인 과정에서 오류 발생:", error);
        manualLogout();
      } finally {
        setIsAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const refreshAuth = () => {
    setAuthState(getAuthUser());
  };

  /** 수동 세션 연장 (버튼 클릭 시) — 30분 연장 */
  const extendSessionManually = async () => {
    try {
      await extendSession();
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = setInterval(async () => {
        try {
          await extendSession();
        } catch (e) {
          manualLogout();
        }
      }, SESSION_EXTEND_INTERVAL_MS);
      return true;
    } catch (e) {
      manualLogout();
      return false;
    }
  };

  const value = {
    ...authState,
    refreshAuth,
    isAuthInitialized,
    manualLogout,
    extendSessionManually,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
