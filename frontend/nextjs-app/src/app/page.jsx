// app/page.jsx (Server Component)
export const dynamic = "force-dynamic";

import { fetchPosts, fetchPopularPosts } from "../services/api/posts";
import PostCard from "../components/Post/PostCard";
import "../styles/globals.css";
import "../styles/HomePage.css";
import Link from "next/link";

// 🌟 수정: 한국어 우선 SEO 메타데이터 개선
export const metadata = {
  title: "MinKowskiM", // layout.jsx의 템플릿에 따라 '홈 | MinKowskiM'로 표시됨
  description:
    "Welcome to MinKowskiM. Explore in-depth posts on development trends and tech stacks.",
  keywords: ["development", "tech", "blog", "MinKowskiM"],
  alternates: {
    canonical: "https://minkowskim.com/",
    languages: { ko: "https://minkowskim.com/", en: "https://minkowskim.com/", "x-default": "https://minkowskim.com/" },
  },
};

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString) => {
  // 🌟 수정: 한국어 포맷으로 변경
  return new Date(dateString).toLocaleDateString("en-US", {
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

async function getPopularPosts() {
  try {
    return await fetchPopularPosts(3);
  } catch (error) {
    console.error("인기글을 가져오는 데 실패했습니다.", error);
    return [];
  }
}

export default async function HomePage() {
  const [recentPosts, popularPosts] = await Promise.all([
    getRecentPosts(),
    getPopularPosts(),
  ]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MinKowskiM",
    description: "Personal dev blog: backend, frontend, AI/ML.",
    url: "https://minkowskim.com",
    potentialAction: { "@type": "SearchAction", target: "https://minkowskim.com/search?q={search_term_string}", "query-input": "required name=search_term_string" },
  };

  return (
    <div className="homepage-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <section className="hero-section">
        <h1 className="hero-title">MinKowskiM</h1>
        <p className="hero-subtitle">A personal log across space and time.</p>
        <Link href="/post" className="btn-primary">
          View all posts &rarr;
        </Link>
      </section>

      {/* 2. 최신 포스트 섹션 */}
      <section className="latest-posts-section">
        {/* 🌟 UI 텍스트 한국어 우선 */}
        <h2 className="section-title">Posts</h2>
        {/* <h2 className="section-title cursive-title">Recent Post</h2> */}

        {recentPosts.length > 0 ? (
          <div className="post-list">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* 🌟 UI 텍스트 한국어 우선 */
          <p className="no-posts">No posts yet.</p>
        )}
      </section>

      {/* 3. Popular Posts (by view count, top 3) */}
      <section className="category-section popular-posts-section">
        <h2 className="section-title">Popular Posts</h2>
        {popularPosts.length > 0 ? (
          <div className="post-list post-list-popular">
            {popularPosts.map((post) => (
              <PostCard key={post.id} post={post} showViewCount />
            ))}
          </div>
        ) : (
          <p className="no-posts">No popular posts yet.</p>
        )}
      </section>
    </div>
  );
}
