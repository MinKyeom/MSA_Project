import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_POST_API_URL || "https://minkowskim.com";

const searchApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/** 의미 검색 — 쿼리와 유사한 게시글 목록 */
export async function searchPosts(query, limit = 10) {
  const { data } = await searchApi.get("/api/search", { params: { q: query, limit } });
  return data;
}

/** 연관 포스트 — 해당 글과 유사한 글 목록 (벡터 검색) */
export async function fetchRelatedPosts(postId, limit = 5) {
  try {
    const { data } = await searchApi.get("/api/search/related", { params: { post_id: postId, limit } });
    return data?.results ?? [];
  } catch (e) {
    return [];
  }
}
