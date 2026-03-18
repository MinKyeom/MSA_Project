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
          setError(err?.message || "Search failed.");
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
        <SearchBar variant="hero" placeholder="Search again..." />
      </div>

      {!q ? (
        <p className="search-page__empty">Enter a search term.</p>
      ) : (
        <>
          <h1 className="search-page__title">
            Results for &ldquo;{q}&rdquo;
          </h1>
          {loading && <p className="search-page__loading">Searching...</p>}
          {error && (
            <p className="search-page__error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && data.results.length === 0 && q && (
            <p className="search-page__empty">
              No results. Try different keywords.
            </p>
          )}
          {!loading && !error && data.results.length > 0 && (
            <ul className="search-results-list" aria-label="Search results">
              {data.results.map((item) => (
                <li key={item.postId}>
                  <Link
                    href={`/post/${item.postId}`}
                    className="search-result-card"
                  >
                    <h3 className="search-result-card__title">
                      {item.title || "Untitled"}
                    </h3>
                    {item.snippet && (
                      <p className="search-result-card__snippet">
                        {item.snippet}
                      </p>
                    )}
                    {item.score != null && (
                      <span className="search-result-card__score">
                        Score {Math.round(item.score * 100)}%
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
    <Suspense fallback={<div className="search-page"><p className="search-page__loading">Loading...</p></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
