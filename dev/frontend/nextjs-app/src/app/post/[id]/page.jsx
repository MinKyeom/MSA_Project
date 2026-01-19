// app/post/[id]/page.jsx (Server Component)

import Link from "next/link";
import { fetchPostById } from "../../../services/api/posts";
import Comments from "../../../components/Comments/Comments";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import PostActions from "./PostActions";
import "../../../styles/globals.css";
import { notFound } from "next/navigation";

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString) => {
  // 🌟 수정: 한국어 포맷으로 변경
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 동적 경로 세그먼트 (id)를 받아 데이터를 가져옵니다.
async function getPost(id) {
  try {
    const data = await fetchPostById(id);
    return data;
  } catch (error) {
    console.error("서버에서 포스트를 가져오는 데 실패했습니다.:", error);
    return null;
  }
}

// 🌟 동적 메타데이터 생성 함수 (한국어 우선)
export async function generateMetadata({ params }) {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: "포스트를 찾을 수 없음",
      description: "요청하신 포스트를 찾을 수 없습니다.",
    };
  }

  const title = post.title || "제목 없음";
  const description = post.content
    ? post.content.substring(0, 150) + "..."
    : "이 포스트에 대한 자세한 내용을 확인하세요.";

  return {
    // 🌟 한국어 우선 SEO 메타데이터 적용
    title: title,
    description: description,
    keywords: [...(post.tagNames || []), post.categoryName].filter(Boolean),
    alternates: {
      canonical: `https://your-blog-url.com/post/${post.id}`,
    },
  };
}

export default async function PostDetailPage({ params }) {
  const postId = params.id;
  const post = await getPost(postId);

  if (!post) {
    // 포스트가 없을 경우 Next.js의 404 페이지를 표시
    notFound();
  }

  // 포스트 작성자 ID
  const postAuthorId = post.authorId;

  return (
    <div
      className="post-detail-container"
      style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 0" }}
    >
      <article>
        {/* 1. 포스트 제목 및 메타 정보 */}
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            marginBottom: "15px",
            lineHeight: 1.2,
            color: "var(--color-text-main)",
          }}
        >
          {/* 🌟 UI 텍스트 한국어 우선: 제목 없음 */}
          {post.title || "제목 없음"}
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "15px",
          }}
        >
          <span style={{ color: "var(--color-text-sub)" }}>
            {/* 🌟 UI 텍스트 한국어 우선: 작성자 알 수 없음 */}
            작성자:{" "}
            <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>
              {post.authorNickname || "작성자 알 수 없음"}
            </span>
          </span>
          <span style={{ color: "var(--color-text-sub)", fontSize: "0.9em" }}>
            작성일: {formatDate(post.createdAt)}
          </span>
        </div>

        {/* 2. 수정/삭제 버튼 (Client Component) */}
        <PostActions postId={postId} postAuthorId={postAuthorId} />

        {/* 3. 포스트 내용 (Markdown 렌더링) */}
        <div style={{ marginTop: "40px", paddingBottom: "40px" }}>
          <MarkdownRenderer content={post.content || ""} />
        </div>

        {/* 4. 카테고리 및 태그 */}
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "20px",
          }}
        >
          <p
            style={{
              margin: "0",
              color: "var(--color-text-sub)",
              fontWeight: 600,
            }}
          >
            {/* 🌟 UI 텍스트 한국어 우선: 카테고리 */}# 카테고리:{" "}
            <span
              className="tag-badge"
              style={{
                backgroundColor: "var(--color-secondary)",
                color: "var(--color-accent)",
              }}
            >
              {/* 🌟 UI 텍스트 한국어 우선: 미분류 */}
              {post.categoryName || "미분류"}
            </span>
          </p>
          <p
            style={{
              margin: "10px 0 0 0",
              color: "var(--color-text-sub)",
              fontWeight: 600,
            }}
          >
            {/* 🌟 UI 텍스트 한국어 우선: 태그 */}# 태그:{" "}
            {post.tagNames?.length > 0 ? (
              post.tagNames.map((tagName) => (
                <span key={tagName} className="tag-badge">
                  {tagName}
                </span>
              ))
            ) : (
              /* 🌟 UI 텍스트 한국어 우선: 태그 없음 */
              <span>태그 없음</span>
            )}
          </p>
        </div>

        {/* 5. 댓글 섹션 (Client Component) */}
        <Comments postId={postId} />
      </article>
    </div>
  );
}
