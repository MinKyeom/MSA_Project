"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { searchPosts } from "../../services/api/search";
import SearchBar from "../../components/Search/SearchBar";
import "../../styles/Search.css";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() || "";
  const [data, setData] = useState({ results: [], query: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
      setData({ results: [], query: "" });
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchPosts(q, 20)
      .then((res) => {
        if (!cancelled) {
          setData({
            query: res.query ?? q,
            results: Array.isArray(res.results) ? res.results : [],
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "검색 중 오류가 발생했습니다.");
          setData({ results: [], query: q });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="search-page">
      <div className="search-page__bar">
        <SearchBar variant="hero" placeholder="다시 검색하기..." />
      </div>

      {!q ? (
        <p className="search-page__empty">검색어를 입력해 주세요.</p>
      ) : (
        <>
          <h1 className="search-page__title">
            &ldquo;{q}&rdquo; 검색 결과
          </h1>
          {loading && <p className="search-page__loading">검색 중...</p>}
          {error && (
            <p className="search-page__error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && data.results.length === 0 && q && (
            <p className="search-page__empty">
              관련 글이 없습니다. 다른 키워드로 검색해 보세요.
            </p>
          )}
          {!loading && !error && data.results.length > 0 && (
            <ul className="search-results-list" aria-label="검색 결과 목록">
              {data.results.map((item) => (
                <li key={item.postId}>
                  <Link
                    href={`/post/${item.postId}`}
                    className="search-result-card"
                  >
                    <h3 className="search-result-card__title">
                      {item.title || "제목 없음"}
                    </h3>
                    {item.snippet && (
                      <p className="search-result-card__snippet">
                        {item.snippet}
                      </p>
                    )}
                    {item.score != null && (
                      <span className="search-result-card__score">
                        유사도 {Math.round(item.score * 100)}%
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="search-page"><p className="search-page__loading">로딩 중...</p></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
