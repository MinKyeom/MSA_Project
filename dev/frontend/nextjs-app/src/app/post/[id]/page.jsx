// app/post/[id]/page.jsx (Server Component)

import Link from "next/link";
import { fetchPostById } from "../../../services/api/posts";
import Comments from "../../../components/Comments/Comments";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import PostActions from "./PostActions";
import "../../../styles/globals.css";
import "../../../styles/PostDetail.css";
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
    <div className="post-detail-container">
      <article>
        {/* 1. 포스트 제목 및 메타 정보 */}
        <h1 className="post-detail-title">
          {post.title || "제목 없음"}
        </h1>
        <div className="post-detail-meta">
          <span className="post-author-info">
            작성자:
            <span className="post-author-name">
              {post.authorNickname || "작성자 알 수 없음"}
            </span>
          </span>
          <span className="post-created-date">
            작성일: {formatDate(post.createdAt)}
          </span>
        </div>

        {/* 2. 수정/삭제 버튼 (Client Component) */}
        <PostActions postId={postId} postAuthorId={postAuthorId} />

        {/* 3. 포스트 내용 (Markdown 렌더링) */}
        <div className="post-detail-content">
          <MarkdownRenderer content={post.content || ""} />
        </div>

        {/* 4. 카테고리 및 태그 */}
        <div className="post-detail-taxonomy">
          <p className="post-taxonomy-item">
            <span className="post-taxonomy-label"># 카테고리:</span>
            <span className="post-category-badge">
              {post.categoryName || "미분류"}
            </span>
          </p>
          <p className="post-taxonomy-item">
            <span className="post-taxonomy-label"># 태그:</span>
            {post.tagNames?.length > 0 ? (
              post.tagNames.map((tagName) => (
                <span key={tagName} className="post-tag-badge">
                  {tagName}
                </span>
              ))
            ) : (
              <span className="post-no-tags">태그 없음</span>
            )}
          </p>
        </div>

        {/* 5. 댓글 섹션 (Client Component) */}
        <Comments postId={postId} />
      </article>
    </div>
  );
}
