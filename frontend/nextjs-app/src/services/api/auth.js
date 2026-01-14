// src/services/api/authService.js
import axios from "axios";

// MSA 환경에서는 서비스별 포트가 다를 수 있으므로 환경변수 분리 권장
const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "https://minkowskim.com";

const authAxios = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
});

// 공통 에러 처리 인터셉터
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserNickname");
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
  const { id, nickname } = response.data;
  if (id && nickname) {
    localStorage.setItem("currentUserId", id);
    localStorage.setItem("currentUserNickname", nickname);
  }
  return response.data;
};

/**
 * 2. 로그아웃
 */
export const logoutUser = async () => {
  await authAxios.post("/auth/logout");
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("currentUserNickname");
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
