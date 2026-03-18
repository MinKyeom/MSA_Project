// app/page.jsx (Server Component)
export const dynamic = "force-dynamic";

import { fetchPosts, fetchPopularPosts } from "../services/api/posts";
import PostCard from "../components/Post/PostCard";
import HeroStrokeText from "../components/Hero/HeroStrokeText";
import HeroPathTitle from "../components/Hero/HeroPathTitle";
import "../styles/globals.css";
import "../styles/HomePage.css";
import Link from "next/link";

// Trim Paths 스타일: centerline 붓이 왼쪽 → 오른쪽으로 순차(stagger)로 써짐
const TOTAL_LOOP = 28;
const HERO_TITLE = "MinKowskiM";
const TITLE_PATH_COUNT = 10; // MinKowskiM_new.svg path 개수
const STEP_TITLE = 0.4; // 타이틀 각 획 사이 간격
// 메인 문구가 완전히 써진 뒤에 부제목이 써지도록: 마지막 획이 끝나는 시점
const DRAW_PHASE_RATIO = 0.18; // keyframes에서 그리기가 끝나는 비율(18%)
const SUBTITLE_START_DELAY =
  (TITLE_PATH_COUNT - 1) * STEP_TITLE + DRAW_PHASE_RATIO * TOTAL_LOOP;

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
    <div className="homepage-wrapper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <div className="homepage-container">
        <section className="hero-section">
          <HeroPathTitle
            stepDelay={STEP_TITLE}
            startDelay={0}
            className="hero-title"
            as="h1"
          />
          <HeroStrokeText
            text="A personal log across space and time."
            stepDelay={0.1}
            startDelay={SUBTITLE_START_DELAY}
            className="hero-subtitle"
            variant="subtitle"
            as="p"
          />
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
    </div>
  );
}
