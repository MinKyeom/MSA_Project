import axios from "axios";

const POSTS_BASE_URL =
  process.env.NEXT_PUBLIC_POST_API_URL || "https://dev.minkowskim.com";
const POSTS_API_URL = `${POSTS_BASE_URL}/api/posts`;

// ⭐ 수정: CORS 일관성을 위해 withCredentials 포함 인스턴스 사용
const publicAxios = axios.create({
  withCredentials: true,
  timeout: 10000,
});

/**
 * 카테고리 전체 목록 조회
 * @returns {Promise<Array>} CategoryResponse 객체 배열
 */
export const fetchCategoriesList = async () => {
  try {
    const response = await publicAxios.get(`${POSTS_API_URL}/categories`);
    // 응답 데이터가 null이거나 undefined일 경우 빈 배열 반환
    return response.data || [];
  } catch (error) {
    console.error("Error fetching categories list:", error);
    // 에러 발생 시 상위로 던지지 않고 빈 배열을 반환하여 사이드바 로딩 유지
    return [];
  }
};

/**
 * 태그 전체 목록 조회
 * @returns {Promise<Array>} TagResponse 객체 배열
 */
export const fetchTagsList = async () => {
  try {
    const response = await publicAxios.get(`${POSTS_API_URL}/tags`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching tags list:", error);
    return [];
  }
};
