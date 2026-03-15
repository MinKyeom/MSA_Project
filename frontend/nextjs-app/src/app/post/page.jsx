// app/post/page.jsx (Server Component)

import Link from "next/link";
import { cookies } from "next/headers"; // ⭐ 서버 컴포넌트에서만 사용 가능
import { fetchPosts } from "../../services/api/posts"; 
import PostCard from "../../components/Post/PostCard"; 
import "../../styles/globals.css"; 
import { notFound } from "next/navigation"; 

export const metadata = {
  title: "All posts",
  description: "Browse all posts on MinKowskiM. Development, tech, and in-depth articles.",
  keywords: ["posts", "articles", "tech", "MinKowskiM"],
  alternates: { canonical: "https://minkowskim.com/post" },
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
      <div className="container" style={{ paddingTop: "100px", textAlign: "center" }}>
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
    <div className="container post-list-page" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
      <header className="list-header" style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
          {category ? `#${category}` : tag ? `tag: ${tag}` : "All Posts"}
        </h1>
        <p style={{ color: "var(--color-text-sub)" }}>
          {category ? `"${category}" 카테고리의 글들입니다.` : tag ? `"${tag}" 태그가 포함된 글들입니다.` : "최신 기술 아티클을 만나보세요."}
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