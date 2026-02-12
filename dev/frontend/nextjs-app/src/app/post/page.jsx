// app/post/page.jsx (Server Component)

import Link from "next/link";
import { cookies } from "next/headers"; 
import { fetchPosts } from "../../services/api/posts"; 
import PostCard from "../../components/Post/PostCard"; 
import "../../styles/globals.css";
import "../../styles/PostList.css";
import { notFound } from "next/navigation"; 

// 🌟 SEO 메타데이터
export const metadata = {
  title: "전체 포스트 목록",
  description: "MinKowski 개발 블로그의 모든 포스트 목록입니다. 관심 있는 글을 찾아보세요.",
  keywords: ["전체 포스트", "개발 아티클", "기술 아카이브"], 
};

// 데이터를 가져오는 함수
async function getPosts(page, size, category, tag) {
  try {
    // ⭐ 1. 서버 환경에서 브라우저의 쿠키를 가져옵니다.
    const cookieStore = cookies();
    const token = cookieStore.get("authToken")?.value;

    // ⭐ 2. 만약 토큰이 있다면 headers 객체를 만들어 fetchPosts에 전달합니다.
    const options = token 
      ? { headers: { Cookie: `authToken=${token}` } } 
      : {};

    // 💡 fetchPosts의 5번째 인자로 options를 전달
    const data = await fetchPosts(page, size, category, tag, options);
    return data; 
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
    return null;
  }
}

export default async function PostListPage({ searchParams }) {
  const category = searchParams.category || "";
  const tag = searchParams.tag || "";
  const currentPage = parseInt(searchParams.page) || 0;
  const pageSize = 10;

  // 데이터 페칭
  const postPageData = await getPosts(currentPage, pageSize, category, tag);

  if (!postPageData) {
    return (
      <div className="error-container">
        <h2>데이터를 불러오는 중 오류가 발생했습니다.</h2>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  const posts = postPageData.content || [];
  const pageInfo = {
    totalPages: postPageData.totalPages,
    totalElements: postPageData.totalElements,
    page: postPageData.number,
  };

  const getPageLink = (page) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (tag) params.append("tag", tag);
    params.append("page", page);
    return `/post?${params.toString()}`;
  };

  return (
    <div className="post-list-page">
      <header className="list-header">
        <h1>
          {category ? `#${category}` : tag ? `tag: ${tag}` : "All Posts"}
        </h1>
        <p>
          {category ? `"${category}" 카테고리의 글들입니다.` : tag ? `"${tag}" 태그가 포함된 글들입니다.` : "최신 기술 아티클을 만나보세요."}
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-message">
            해당 조건의 포스트가 없습니다.
          </p>
          <Link href="/post" className="empty-state-link">
            전체 목록으로 돌아가기
          </Link>
        </div>
      )}

      {pageInfo.totalPages > 1 && (
        <div className="pagination-controls">
          <Link
            href={getPageLink(currentPage - 1)}
            className={`btn-secondary pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
          >
            이전
          </Link>
          
          <span className="pagination-info">
            {pageInfo.page + 1} / {pageInfo.totalPages}
          </span>

          <Link
            href={getPageLink(currentPage + 1)}
            className={`btn-secondary pagination-btn ${currentPage === pageInfo.totalPages - 1 ? 'disabled' : ''}`}
          >
            다음
          </Link>
        </div>
      )}
    </div>
  );
}