// app/post/page.jsx (Server Component)

import Link from "next/link";
import { fetchPosts } from "../../services/api/posts"; 
import PostCard from "../../components/Post/PostCard"; 
import "../../styles/globals.css"; 
import { notFound } from "next/navigation"; 

// 🌟 SEO 메타데이터
export const metadata = {
  title: "전체 포스트 목록",
  description: "MinKowski 개발 블로그의 모든 포스트 목록입니다. 관심 있는 글을 찾아보세요.",
  keywords: ["전체 포스트", "개발 아티클", "기술 아카이브"], 
};

// 데이터를 가져오는 함수 (카테고리와 태그 파라미터 추가)
async function getPosts(page, size, category, tag) {
  try {
    // 💡 중요: fetchPosts가 이제 4개의 인자를 받도록 posts.js에서 수정되어야 함
    const data = await fetchPosts(page, size, category, tag);
    return data; 
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
    return null;
  }
}

export default async function PostListPage({ searchParams }) {
  // 💡 URL에서 쿼리 스트링 추출 (Next.js Server Component 기능)
  const category = searchParams.category || "";
  const tag = searchParams.tag || "";
  const currentPage = parseInt(searchParams.page) || 0;

  // 필터링 정보를 포함하여 데이터 요청
  const postData = await getPosts(currentPage, 10, category, tag);

  if (!postData) {
    return (
      <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
        <h2>데이터를 불러오는 중 오류가 발생했습니다.</h2>
      </div>
    );
  }

  const posts = postData.content || [];
  const pageInfo = {
    page: postData.number,
    totalPages: postData.totalPages,
    totalElements: postData.totalElements,
  };

  // 페이지네이션 링크 생성 시 필터(카테고리/태그) 유지
  const getPageLink = (pageNumber) => {
    let url = `/post?page=${pageNumber}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    return url;
  };

  return (
    <div className="container" style={{ marginTop: "80px", marginBottom: "80px" }}>
      <header style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", color: "var(--color-text-main)" }}>
          {/* 💡 현재 필터 상태에 따른 제목 동적 변경 */}
          {category ? `📂 ${category}` : tag ? `🏷️ #${tag}` : "📝 전체 포스트"}
        </h1>
        <p style={{ color: "var(--color-text-sub)", marginTop: "10px" }}>
          총 {pageInfo.totalElements}개의 포스트가 있습니다.
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="post-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "30px" 
        }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--color-text-sub)" }}>
            해당 조건의 포스트가 없습니다.
          </p>
          <Link href="/post" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
            전체 목록으로 돌아가기
          </Link>
        </div>
      )}

      {/* 페이지네이션 조작 */}
      {pageInfo.totalPages > 1 && (
        <div className="pagination-controls" style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "20px", 
          marginTop: "40px",
          alignItems: "center"
        }}>
          <Link
            href={getPageLink(currentPage - 1)}
            className="btn-secondary"
            style={{
              pointerEvents: currentPage === 0 ? "none" : "auto",
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
          >
            이전
          </Link>
          
          <span style={{ fontWeight: "bold" }}>
            {pageInfo.page + 1} / {pageInfo.totalPages}
          </span>

          <Link
            href={getPageLink(currentPage + 1)}
            className="btn-secondary"
            style={{
              pointerEvents: currentPage === pageInfo.totalPages - 1 ? "none" : "auto",
              opacity: currentPage === pageInfo.totalPages - 1 ? 0.5 : 1,
            }}
          >
            다음
          </Link>
        </div>
      )}
    </div>
  );
}