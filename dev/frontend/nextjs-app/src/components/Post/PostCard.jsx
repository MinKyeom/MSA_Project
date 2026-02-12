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
export default function PostCard({ post }) {
    return (
        <Link href={`/post/${post.id}`} className="post-card">
            <h3>{post.title || "제목 없음"}</h3>
            <p>
                {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
            </p>
            <div className="post-meta">
                <span className="post-card-author-info">
                    <span className="post-card-author-name">
                        {post.authorNickname || "작성자 알 수 없음"}
                    </span>
                    <span className="post-card-date">
                        {formatDate(post.createdAt)}
                    </span>
                </span>
                
                <span className="post-card-category">
                    {post.categoryName || "미분류"}
                </span>
            </div>
        </Link>
    );
}