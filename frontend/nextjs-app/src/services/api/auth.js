// src/services/api/auth.js
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://minkowskim.com";

const authAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 서버에서 401(미인증) 또는 403(권한없음) 응답이 올 경우
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // 브라우저에 남아있는 유효하지 않은 인증 정보 삭제
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserNickname");

      // 필요한 경우 로그인 페이지로 강제 이동 (선택 사항)
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getAuthUser = () => {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, id: null, nickname: null };
  }
  try {
    const id = localStorage.getItem("currentUserId");
    const nickname = localStorage.getItem("currentUserNickname");
    return { isAuthenticated: !!(id && nickname), id, nickname };
  } catch (error) {
    return { isAuthenticated: false, id: null, nickname: null };
  }
};

export const loginUser = async ({ username, password }) => {
  try {
    const response = await authAxios.post("/user/signin", {
      username: username,
      password: password,
    });

    const { id, nickname } = response.data;
    if (id && nickname) {
      localStorage.setItem("currentUserId", id);
      localStorage.setItem("currentUserNickname", nickname);
    }
    return response.data;
  } catch (error) {
    console.error("로그인 오류:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await authAxios.post("/user/logout");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserNickname");
    return true;
  } catch (error) {
    console.error("로그아웃 오류:", error);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserNickname");
    throw error;
  }
};

export const registerUser = async ({ username, password, nickname }) => {
  try {
    const response = await authAxios.post("/user/signup", {
      username,
      password,
      nickname,
    });
    return response.data;
  } catch (error) {
    console.error("회원가입 오류:", error);
    throw error;
  }
};

// 실시간 아이디 중복 체크
export const checkUsernameDuplicate = async (username) => {
  try {
    const response = await authAxios.get("/user/check-username", {
      params: { username },
    });
    return response.data; // true: 중복, false: 사용가능
  } catch (error) {
    console.error("아이디 중복 체크 오류:", error);
    return false;
  }
};

// 실시간 닉네임 중복 체크
export const checkNicknameDuplicate = async (nickname) => {
  try {
    const response = await authAxios.get("/user/check-nickname", {
      params: { nickname },
    });
    return response.data; // true: 중복, false: 사용가능
  } catch (error) {
    console.error("닉네임 중복 체크 오류:", error);
    return false;
  }
};
