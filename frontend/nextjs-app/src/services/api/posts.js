import axios from "axios";

const POSTS_BASE_URL =
  process.env.NEXT_PUBLIC_POST_API_URL || "https://minkowskim.com";
const POSTS_API_URL = `${POSTS_BASE_URL}/api/posts`;

// 모든 요청에 HttpOnly 쿠키를 포함하는 전용 인스턴스
const authAxios = axios.create({
  baseURL: POSTS_BASE_URL,
  withCredentials: true,
});

/**
 * 게시글 목록 조회
 */
export const fetchPosts = async (
  page = 0,
  size = 10,
  category = null,
  tag = null,
  options = {}
) => {
  try {
    let url = POSTS_API_URL;
    let params = { page, size };

    if (category) {
      url = `${POSTS_API_URL}/category`;
      params.name = category;
    } else if (tag) {
      url = `${POSTS_API_URL}/tag`;
      params.name = tag;
    }

    const response = await authAxios.get(url, { params, ...options });
    return response.data;
  } catch (error) {
    console.error("fetchPosts 에러:", error);
    throw error;
  }
};

/**
 * 게시글 상세 조회
 */
export const fetchPostById = async (id, options = {}) => {
  try {
    const response = await authAxios.get(`${POSTS_API_URL}/${id}`, {
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error("fetchPostById 에러:", error);
    throw error;
  }
};

/**
 * 새 게시글 작성 (POST /api/posts)
 * 403 에러 방지를 위해 슬래시(/)를 제거했습니다.
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
 * 게시글 수정 (PUT /api/posts/{id})
 */
export const updatePost = async (id, postData) => {
  try {
    const response = await authAxios.put(`/api/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("updatePost 에러:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 게시글 삭제 (DELETE /api/posts/{id})
 */
export const deletePost = async (id) => {
  try {
    await authAxios.delete(`/api/posts/${id}`);
    return true;
  } catch (error) {
    console.error("deletePost 에러:", error.response?.data || error.message);
    throw error;
  }
};
