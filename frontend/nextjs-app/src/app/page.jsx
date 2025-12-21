// app/page.jsx (Server Component)

import { fetchPosts } from "../services/api/posts";
import PostCard from "../components/Post/PostCard";
import "../styles/globals.css";
import "../styles/HomePage.css";
import Link from "next/link";

// 🌟 수정: 한국어 우선 SEO 메타데이터 개선
export const metadata = {
  title: "홈", // layout.jsx의 템플릿에 따라 '홈 | MinKowskiM'로 표시됨
  description:
    "MinKowskiM에 오신 것을 환영합니다! 최신 개발 트렌드와 기술 스택에 대한 깊이 있는 글들을 만나보세요.",
  keywords: ["최신 트렌드", "기술 스택", "IT", "개발 블로그", "홈"],
  alternates: {
    canonical: "https://your-blog-url.com/",
  },
};

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString) => {
  // 🌟 수정: 한국어 포맷으로 변경
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// 포스트 목록 데이터를 서버에서 미리 가져옵니다. (최신 6개만)
async function getRecentPosts() {
  // 페이지는 0 (첫 페이지), 사이즈는 6
  try {
    const data = await fetchPosts(0, 6);
    return data.content || [];
  } catch (error) {
    console.error("홈 페이지에서 포스트를 가져오는 데 실패했습니다.", error);
    return [];
  }
}

export default async function HomePage() {
  const recentPosts = await getRecentPosts();

  return (
    <div className="homepage-container">
      {/* 1. 히어로 섹션 */}
      <section className="hero-section">
        <h1 className="hero-title">MinKowskiM</h1>
        {/* 🌟 UI 텍스트 한국어 우선 */}
        <p className="hero-subtitle">A personal log across space and time.</p>
        <Link
          href="/post"
          className="btn-primary"
          style={{ marginTop: "20px" }}
        >
          모든 포스트 보기 &rarr;
        </Link>
      </section>

      {/* 2. 최신 포스트 섹션 */}
      <section className="latest-posts-section">
        {/* 🌟 UI 텍스트 한국어 우선 */}
        <h2 className="section-title">✨ 최신 포스트</h2>

        {recentPosts.length > 0 ? (
          <div className="post-list">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* 🌟 UI 텍스트 한국어 우선 */
          <p className="no-posts">아직 작성된 포스트가 없습니다.</p>
        )}
      </section>

      {/* 3. 카테고리/태그 섹션 (예시: 사이드바와 연동되어야 함) */}
      <section className="category-section">
        {/* 🌟 UI 텍스트 한국어 우선 */}
        <h2 className="section-title">📚 주요 카테고리</h2>
        <div className="category-links">
          {/* 주석: 실제 데이터 기반으로 변경 필요 */}
          {/* 🌟 UI 텍스트 한국어 우선 */}
          <Link href="/post?category=frontend" className="category-link">
            프론트엔드
          </Link>
          <Link href="/post?category=backend" className="category-link">
            백엔드
          </Link>
          <Link href="/post?category=ai-ml" className="category-link">
            AI/ML
          </Link>
          <Link href="/post?category=talk" className="category-link">
            잡담
          </Link>
        </div>
      </section>
    </div>
  );
}
