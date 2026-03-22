"use client";

import Link from "next/link";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../providers/ThemeProvider";
import { logoutUser } from "../../services/api/auth";
import { useToast } from "../../hooks/useToast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  fetchCategoriesList,
  fetchTagsList,
} from "../../services/api/categories-tags";
import SearchBar from "../Search/SearchBar";

export default function Sidebar({ isSidebarOpen, closeSidebar }) {
  const { isAuthenticated, nickname, isAdmin, manualLogout } = useAuth();
  const { showToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSidebarData() {
      if (!isSidebarOpen) return;
      
      setIsLoading(true);
      try {
        // 병렬 호출하되, 하나가 실패해도 나머지는 표시함
        const results = await Promise.allSettled([
          fetchCategoriesList(),
          fetchTagsList(),
        ]);

        const categoriesData = results[0].status === "fulfilled" ? results[0].value : [];
        const tagsData = results[1].status === "fulfilled" ? results[1].value : [];

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (error) {
        console.error("사이드바 데이터 로딩 중 예상치 못한 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSidebarData();
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      manualLogout();
      showToast({ message: "Signed out.", type: "success" });
      closeSidebar();
      router.push("/");
    } catch (error) {
      showToast({ message: "Failed to sign out.", type: "error" });
      console.error(error);
      manualLogout();
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      ></div>

      <div className={`sidebar-menu ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <span className="logo-text-header" style={{ fontSize: "1.8rem" }}>MinKowskiM</span>
          <button onClick={closeSidebar} className="sidebar-close-btn">&times;</button>
        </div>

        <div className="sidebar-content" style={{ flex: 1, overflowY: "auto" }}>
          <div className="sidebar-search-section" style={{ marginBottom: "20px" }}>
            <SearchBar variant="sidebar" onNavigate={closeSidebar} />
          </div>
          <div className="sidebar-auth-section" style={{ marginBottom: "25px" }}>
            {isAuthenticated ? (
              <div className="sidebar-nav-list">
                <p>Hello, <strong>{nickname}</strong>!</p>
                {isAdmin && (
                  <Link href="/post/new" onClick={closeSidebar} className="btn-primary-small" style={{ textAlign: "center", marginTop: "10px", display: "block" }}>
                    ✏️ New post
                  </Link>
                )}
              </div>
            ) : (
              <div className="sidebar-nav-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/signin" onClick={closeSidebar} className="btn-primary-small" style={{ textAlign: "center" }}>Sign in</Link>
                <Link href="/signup" onClick={closeSidebar} className="btn-secondary-small" style={{ textAlign: "center" }}>Sign up</Link>
              </div>
            )}
          </div>

          <h3 className="sidebar-section-title cursive-title">Navigation</h3>
          <div className="sidebar-nav-list" style={{ marginTop: "10px", display: "flex", flexDirection: "column" }}>
            <Link href="/" onClick={closeSidebar} className="cursive-item">Home</Link>
            <Link href="/post" onClick={closeSidebar} className="cursive-item">All Posts</Link>
            <Link href="/structure" onClick={closeSidebar} className="cursive-item">System Structure</Link>
          </div>

          <h3 className="sidebar-section-title cursive-title">Categories</h3>
          <div className="sidebar-nav-list" style={{ marginTop: "10px" }}>
            {isLoading ? (
              <p>Loading...</p>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <Link key={cat.name} href={`/post?category=${cat.slug || cat.name}`} onClick={closeSidebar}>
                  • {cat.name} ({cat.postCount})
                </Link>
              ))
            ) : (
              <p style={{ fontSize: "0.85rem", color: "gray" }}>No categories yet.</p>
            )}
          </div>

          <h3 className="sidebar-section-title cursive-title">Tags</h3>
          <div className="sidebar-tag-list" style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {isLoading ? (
              <p>Loading...</p>
            ) : tags.length > 0 ? (
              tags.map((tag) => (
                <Link key={tag.name} href={`/post?tag=${tag.name}`} className="tag-badge" onClick={closeSidebar}>
                  #{tag.name}
                </Link>
              ))
            ) : (
              <p style={{ fontSize: "0.85rem", color: "gray" }}>No tags</p>
            )}
          </div>
        </div>

        <div className="sidebar-footer" style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={toggleTheme}
            className="sidebar-theme-btn"
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--color-text-main)", fontFamily: "var(--font-family-cursive), var(--font-family-main)", fontSize: "1rem", padding: "10px" }}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <>
                <span className="sidebar-theme-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                </span>
                Light mode
              </>
            ) : (
              <>
                <span className="sidebar-theme-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </span>
                Dark mode
              </>
            )}
          </button>
          {isAuthenticated && (
            <button onClick={handleLogout} style={{ width: "100%", marginTop: "10px", background: "none", border: "none", color: "var(--color-text-sub)", fontFamily: "var(--font-family-cursive), var(--font-family-main)", fontSize: "0.85rem", cursor: "pointer" }}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </>
  );
}