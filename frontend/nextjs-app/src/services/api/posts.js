import axios from "axios";

// 환경변수 또는 기본 URL 설정
const POSTS_BASE_URL =
  process.env.NEXT_PUBLIC_POST_API_URL || "https://minkowskim.com";
const POSTS_API_URL = `${POSTS_BASE_URL}/api/posts`;

// 인증이 필요한 요청용 Axios 인스턴스 (쿠키 포함)
const authAxios = axios.create({
  baseURL: POSTS_BASE_URL,
  withCredentials: true,
});

/**
 * 게시글 목록 조회 (필터링 기능 추가)
 */
export const fetchPosts = async (
  page = 0,
  size = 10,
  category = null,
  tag = null
) => {
  try {
    let url = POSTS_API_URL;
    let params = { page, size };

    // 카테고리가 있으면 /api/posts/category?name=... 호출
    if (category) {
      url = `${POSTS_API_URL}/category`;
      params.name = category;
    }
    // 태그가 있으면 /api/posts/tag?name=... 호출
    else if (tag) {
      url = `${POSTS_API_URL}/tag`;
      params.name = tag;
    }

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("fetchPosts 에러:", error);
    throw error;
  }
};

/**
 * 게시글 상세 조회 (공용)
 */
export const fetchPostById = async (id) => {
  try {
    const response = await axios.get(`${POSTS_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("fetchPostById 에러:", error);
    throw error;
  }
};

/**
 * 새 게시글 작성 (인증 필요)
 */
export const createPost = async (postData) => {
  try {
    const response = await authAxios.post("/api/posts", postData);
    return response.data;
  } catch (error) {
    console.error("createPost 에러:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 게시글 수정 (인증 필요)
 */
export const updatePost = async (id, postData) => {
  try {
    const response = await authAxios.put(`/api/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("updatePost 에러:", error);
    throw error;
  }
};

/**
 * 게시글 삭제 (인증 필요)
 */
export const deletePost = async (id) => {
  try {
    await authAxios.delete(`/api/posts/${id}`);
    return true;
  } catch (error) {
    console.error("deletePost 에러:", error);
    throw error;
  }
};
