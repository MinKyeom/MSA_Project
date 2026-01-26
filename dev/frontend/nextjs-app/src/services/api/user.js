// src/services/api/userService.js
import axios from "axios";

const USER_BASE_URL =
  process.env.NEXT_PUBLIC_USER_API_URL || "https://dev.minkowskim.com";

const userAxios = axios.create({
  baseURL: USER_BASE_URL,
  withCredentials: true,
});

/**
 * 1. 내 정보 가져오기 (Me API)
 */
export const fetchMe = async () => {
  try {
    const response = await userAxios.get("/user/me");
    return response.data; // UserResponse
  } catch (error) {
    console.error("내 정보 불러오기 실패:", error);
    return null;
  }
};

/**
 * 2. 닉네임 중복 체크
 */
export const checkNicknameDuplicate = async (nickname) => {
  const response = await userAxios.get("/user/check-nickname", {
    params: { nickname },
  });
  return response.data; // true: 중복, false: 사용가능
};

/**
 * 3. 아이디(Username) 중복 체크
 * (만약 이 로직이 user-service에 있다면 여기에 위치합니다)
 */
export const checkUsernameDuplicate = async (username) => {
  const response = await userAxios.get("/user/check-username", {
    params: { username },
  });
  return response.data;
};

export default userAxios;
