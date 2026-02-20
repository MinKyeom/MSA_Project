"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/Search.css";

/**
 * 검색 입력 + 제출 시 /search?q= 로 이동.
 * variant: "hero" (메인 히어로용 큰 입력) | "sidebar" (사이드바용 컴팩트)
 */
export default function SearchBar({ variant = "hero", onNavigate, placeholder }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const defaultPlaceholder =
    variant === "sidebar"
      ? "검색어 입력..."
      : "키워드로 글 검색하기";

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query?.trim();
    if (!q) return;
    if (onNavigate) onNavigate();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      className={`search-bar search-bar--${variant}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <input
        type="search"
        className="search-bar__input"
        placeholder={placeholder ?? defaultPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="검색어"
        autoComplete="off"
      />
      <button type="submit" className="search-bar__btn" aria-label="검색">
        <span className="search-bar__icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
      </button>
    </form>
  );
}
