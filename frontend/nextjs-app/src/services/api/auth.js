// src/services/api/auth.js
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const authAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const getAuthUser = () => {
  if (typeof window === 'undefined') {
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
      params: { username }
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
      params: { nickname }
    });
    return response.data; // true: 중복, false: 사용가능
  } catch (error) {
    console.error("닉네임 중복 체크 오류:", error);
    return false;
  }
};