import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_POST_API_URL || "https://minkowskim.com";

const searchApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/** 키워드(SQL) 검색 — post-service */
async function searchPostsByKeyword(query, limit = 10) {
  try {
    const { data } = await searchApi.get("/api/posts/search", { params: { q: query, limit } });
    return data?.results ?? [];
  } catch (e) {
    return [];
  }
}

/** 의미 검색 — search-service (벡터) */
async function searchPostsBySemantic(query, limit = 10) {
  try {
    const { data } = await searchApi.get("/api/search", { params: { q: query, limit } });
    return data?.results ?? [];
  } catch (e) {
    return [];
  }
}

/**
 * 하이브리드 검색: SQL 키워드 검색 + 의미 기반 검색 결과를 병합·중복 제거.
 * 키워드 매칭 결과를 우선 배치한 뒤, 의미 검색 결과를 이어붙임.
 */
export async function searchPosts(query, limit = 10) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const [keywordResults, semanticResults] = await Promise.all([
    searchPostsByKeyword(query, safeLimit),
    searchPostsBySemantic(query, safeLimit),
  ]);

  const seen = new Set();
  const merged = [];

  for (const r of keywordResults) {
    const id = r.postId ?? r.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({
        postId: id,
        title: r.title ?? "",
        snippet: r.snippet ?? "",
        score: r.score != null ? r.score : 1,
        source: "keyword",
      });
    }
  }
  for (const r of semanticResults) {
    const id = r.postId ?? r.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push({
        postId: id,
        title: r.title ?? "",
        snippet: r.snippet ?? "",
        score: r.score != null ? r.score : 0,
        source: "semantic",
      });
    }
  }

  return {
    query,
    results: merged.slice(0, safeLimit),
  };
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
