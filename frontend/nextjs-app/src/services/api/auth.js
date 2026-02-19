// src/services/api/auth.js
import axios from "axios";

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "https://minkowskim.com";

const authAxios = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
});

// 401 시 로그아웃 콜백 (AuthProvider에서 세션 무효화용)
let onUnauthorized = () => {};
export const setOnUnauthorized = (fn) => {
  onUnauthorized = fn;
};

authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const originalRequest = error.config;
      if (!originalRequest._retry && error.response?.status === 401) {
        originalRequest._retry = true;
        try {
          await authAxios.post("/auth/refresh");
          return authAxios(originalRequest);
        } catch (refreshError) {
          // 리프레시 실패 시 로그아웃 처리
          onUnauthorized();
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentUserId");
            localStorage.removeItem("currentUserNickname");
          }
        }
      } else {
        onUnauthorized();
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("currentUserNickname");
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 브라우저 로컬 스토리지 정보를 바탕으로 로그인 여부를 즉시 판단
 * API 요청 없이 동기적으로 상태를 반환합니다.
 */
export const getAuthUser = () => {
  // SSR(Next.js 등) 환경 대응
  if (typeof window === "undefined") {
    return { isAuthenticated: false, id: null, nickname: null };
  }

  try {
    const id = localStorage.getItem("currentUserId");
    const nickname = localStorage.getItem("currentUserNickname");

    // 두 정보가 모두 있어야 인증된 것으로 간주
    return {
      isAuthenticated: !!(id && nickname),
      id,
      nickname,
    };
  } catch (error) {
    return { isAuthenticated: false, id: null, nickname: null };
  }
};

/**
 * 1. 로그인
 */
export const loginUser = async ({ username, password }) => {
  const response = await authAxios.post("/auth/login", { username, password });
  const { id, username: name } = response.data;
  if (id) {
    localStorage.setItem("currentUserId", id);
    localStorage.setItem("currentUserNickname", response.data.nickname ?? name ?? "");
  }
  return response.data;
};

/**
 * 로그아웃 (서버 Redis 리프레시 토큰 삭제 + 쿠키 제거)
 */
export const logoutUser = async () => {
  try {
    await authAxios.post("/auth/logout");
  } finally {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserNickname");
  }
};

/** 세션 연장 — 액세스 토큰 갱신(30분 연장). 만료 직전 호출 권장 */
export const extendSession = async () => {
  const res = await authAxios.post("/auth/extend");
  return res.data;
};

/** 리프레시 토큰으로 새 액세스 토큰 발급 */
export const refreshSession = async () => {
  const res = await authAxios.post("/auth/refresh");
  return res.data;
};

/**
 * 3. 이메일 인증번호 발송 요청
 */
export const sendVerificationCode = async (email) => {
  return await authAxios.post("/auth/send-code", { email });
};

/**
 * 4. 인증번호 확인 검증
 */
export const verifyCode = async (email, code) => {
  const response = await authAxios.post("/auth/verify-code", { email, code });
  return response.status === 200;
  // return response.data; // 성공 시 200 OK
};

/**
 * 5. 회원가입 (인증 서비스 단계의 가입 처리)
 */
export const registerAuth = async (userData) => {
  const response = await authAxios.post("/auth/signup", userData);
  return response.data;
};

export default authAxios;
