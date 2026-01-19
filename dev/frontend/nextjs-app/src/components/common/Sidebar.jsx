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

export default function Sidebar({ isSidebarOpen, closeSidebar }) {
  const { isAuthenticated, nickname, refreshAuth } = useAuth();
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
      refreshAuth();
      showToast({ message: "로그아웃 되었습니다.", type: "success" });
      closeSidebar();
      router.push("/");
    } catch (error) {
      showToast({ message: "로그아웃 중 오류가 발생했습니다.", type: "error" });
      console.error(error);
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
          <div className="sidebar-auth-section" style={{ marginBottom: "25px" }}>
            {isAuthenticated ? (
              <div className="sidebar-nav-list">
                <p><strong>{nickname}</strong>님 반가워요!</p>
                <Link href="/post/new" onClick={closeSidebar} className="btn-primary-small" style={{ textAlign: "center", marginTop: "10px", display: "block" }}>
                  ✏️ 새 글 작성
                </Link>
              </div>
            ) : (
              <div className="sidebar-nav-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/signin" onClick={closeSidebar} className="btn-primary-small" style={{ textAlign: "center" }}>로그인</Link>
                <Link href="/signup" onClick={closeSidebar} className="btn-secondary-small" style={{ textAlign: "center" }}>회원가입</Link>
              </div>
            )}
          </div>

          <h3 className="sidebar-section-title cursive-title">Navigation</h3>
          <div className="sidebar-nav-list" style={{ marginTop: "10px", display: "flex", flexDirection: "column" }}>
            <Link href="/" onClick={closeSidebar} className="cursive-item">Home</Link>
            <Link href="/post" onClick={closeSidebar} className="cursive-item">All Posts</Link>
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
              <p style={{ fontSize: "0.85rem", color: "gray" }}>등록된 카테고리가 없습니다.</p>
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
              <p style={{ fontSize: "0.85rem", color: "gray" }}>#태그없음</p>
            )}
          </div>
        </div>

        <div className="sidebar-footer" style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
          <button onClick={toggleTheme} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--color-text-main)", fontSize: "1rem", padding: "10px" }}>
            {isDarkMode ? "🌞 라이트 모드로 변경" : "🌙 다크 모드로 변경"}
          </button>
          {isAuthenticated && (
            <button onClick={handleLogout} style={{ width: "100%", marginTop: "10px", background: "none", border: "none", color: "var(--color-text-sub)", fontSize: "0.85rem", cursor: "pointer" }}>
              로그아웃
            </button>
          )}
        </div>
      </div>
    </>
  );
}