// src/components/Post/PostCard.jsx
// Server Component (기본값)

import Link from "next/link"; 
import "../../styles/HomePage.css"; // 스타일 임포트

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString) => {
    // 🌟 수정: 한국어 포맷으로 변경
    return new Date(dateString).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
};

// --- 서브 컴포넌트: 포스트 목록 카드 (Homepage용) --
export default function PostCard({ post, showViewCount = false }) {
    const content = post.content || "";
    return (
        <Link href={`/post/${post.id}`} className="post-card">
            <h3>{post.title || "제목 없음"}</h3>
            <p>
                {content.substring(0, 120)}{content.length > 120 ? "..." : ""}
            </p>
            <div className="post-meta">
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                        {post.authorNickname || "Unknown"}
                    </span>
                    <span style={{ fontSize: "0.9em", color: "var(--color-text-sub)", marginTop: "4px" }}>
                        {formatDate(post.createdAt)}
                    </span>
                </span>
                <span>
                    {showViewCount && (post.viewCount ?? 0) > 0 && (
                        <span className="view-count-badge" style={{ marginRight: "8px", fontSize: "0.85em", color: "var(--color-text-sub)" }}>
                            조회 {post.viewCount}
                        </span>
                    )}
                    <span
                        className="tag-badge"
                        style={{ backgroundColor: "var(--color-secondary)", color: "var(--color-accent)" }}
                    >
                        {post.categoryName || "미분류"}
                    </span>
                </span>
            </div>
        </Link>
    );
}