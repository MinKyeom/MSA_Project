// src/components/Comments/Comments.jsx
"use client"; 

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import {
  fetchCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
} from "../../services/api/comments"; 
import { useAuth } from "../../providers/AuthProvider"; 
import { useToast } from "../../hooks/useToast"; 
import "../../styles/globals.css"; 
import "./Comments.css"; 

// 날짜 포맷팅 헬퍼 함수
const formatDate = (dateString) => {
    // 🌟 수정: 한국어 포맷으로 변경
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
};

// --- 헬퍼 컴포넌트 1: 댓글 작성 폼 (Client Component) --
const CommentForm = ({ postId, onCommentCreated }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast(); 

  // 댓글 작성 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
        // 🌟 UI 텍스트 한국어 우선: 댓글 내용을 입력해주세요.
        showToast({ message: "Please enter your comment.", type: "warning" });
        return;
    }

    setLoading(true);

    try {
      const newComment = await createComment(postId, { content });
      onCommentCreated(newComment); // 부모 상태 업데이트
      setContent(""); // 입력 필드 초기화
      // 🌟 UI 텍스트 한국어 우선: 댓글이 성공적으로 작성되었습니다.
      showToast({ message: "Comment posted.", type: "success" }); 
    } catch (error) {
      // 🌟 UI 텍스트 한국어 우선: 댓글 작성 실패: 권한 또는 서버 오류.
      showToast({ message: error.message || "Failed to post comment.", type: "error" }); 
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        // 🌟 UI 텍스트 한국어 우선: 댓글을 작성해주세요...
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        disabled={loading}
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {/* 🌟 UI 텍스트 한국어 우선: 작성 / 작성 중... */}
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
};

// --- 헬퍼 컴포넌트 2: 단일 댓글 아이템 --
// ⭐ forwardRef 제거: 필요 없는 부분으로, 일반 컴포넌트로 유지합니다.
const CommentItem = ({ comment, currentUserId, onDelete, onUpdate }) => {
  const isAuthor = currentUserId && (currentUserId.toString() === comment.authorId.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast(); 

  // 수정 제출 핸들러
  const handleUpdate = async () => {
    if (editContent.trim() === comment.content) {
        // 🌟 UI 텍스트 한국어 우선: 변경된 내용이 없습니다.
        showToast({ message: "No changes to save.", type: "info" });
        setIsEditing(false);
        return;
    }
    if (!editContent.trim()) {
        // 🌟 UI 텍스트 한국어 우선: 내용을 입력해주세요.
        showToast({ message: "Please enter content.", type: "warning" });
        return;
    }

    setLoading(true);
    try {
        await onUpdate(comment.id, editContent);
        // 🌟 UI 텍스트 한국어 우선: 댓글이 수정되었습니다.
        showToast({ message: "Comment updated.", type: "success" });
        setIsEditing(false);
    } catch (error) {
        // 🌟 UI 텍스트 한국어 우선: 댓글 수정 실패.
        showToast({ message: error.message || "Failed to update comment.", type: "error" });
    } finally {
        setLoading(false);
    }
  };

  // 삭제 핸들러 (UI에서 확인 후 호출)
  const handleDelete = () => {
    // 🌟 UI 텍스트 한국어 우선: 댓글을 삭제하시겠습니까?
    if (window.confirm("Delete this comment?")) {
        onDelete(comment.id);
    }
  }

  return (
    <div className="comment-item">
      <div className="comment-meta">
        <div>
          <span className="comment-author">{comment.authorNickname || "Unknown"}</span>
          {isAuthor && <span className="comment-badge"> (you)</span>}
        </div>
        <span className="comment-date">{formatDate(comment.createdAt)}</span>
      </div>
      
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            disabled={loading}
            className="post-form-textarea"
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
                type="button" 
                className="btn-secondary-small" 
                onClick={() => { setEditContent(comment.content); setIsEditing(false); }}
                disabled={loading}
            >
                {/* 🌟 UI 텍스트 한국어 우선: 취소 */}
                Cancel
            </button>
            <button 
                type="button" 
                className="btn-primary-small" 
                onClick={handleUpdate}
                disabled={loading}
            >
                {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-content">{comment.content}</p>
      )}

      {/* 댓글 수정/삭제 버튼 (작성자에게만 표시) */}
      {isAuthor && !isEditing && (
        <div className="comment-actions" style={{ textAlign: 'right', marginTop: '10px' }}>
          <button 
            type="button" 
            className="btn-link-primary" 
            onClick={() => setIsEditing(true)}
            style={{ marginRight: '10px' }}
          >
            {/* 🌟 UI 텍스트 한국어 우선: 수정 */}
            Edit
          </button>
          <button 
            type="button" 
            className="btn-link-primary" 
            onClick={handleDelete}
            style={{ color: '#E53935' }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};


// --- 메인 컴포넌트: Comments --
export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id: currentUserId } = useAuth();
  const { showToast } = useToast();

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchCommentsByPostId(postId);
      setComments(data);
    } catch (error) {
      // 🌟 UI 텍스트 한국어 우선: 댓글을 불러오는 데 실패했습니다.
      showToast({ message: "Failed to load comments.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // 새로운 댓글이 작성되었을 때 목록 갱신
  const handleCommentCreated = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  // 댓글 삭제 처리
  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      // 삭제된 댓글을 목록에서 제거
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // 🌟 UI 텍스트 한국어 우선: 댓글이 삭제되었습니다.
      showToast({ message: "Comment deleted.", type: "success" });
    } catch (error) {
      // 🌟 UI 텍스트 한국어 우선: 댓글 삭제 실패: 권한 또는 서버 오류.
      showToast({ message: error.message || "Failed to delete comment.", type: "error" }); 
      console.error(error);
    }
  };

  // 댓글 수정 처리 — CommentItem이 (commentId, editContent)로 호출
  const handleCommentUpdated = async (commentId, editContent) => {
    const updatedComment = await updateComment(commentId, { content: editContent });
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
  };


  return (
    <div className="comments-section">
      {/* 🌟 UI 텍스트 한국어 우선: 댓글 ({comments.length}) */}
      <h2 className="section-title">Comments ({comments.length})</h2>

      {currentUserId ? (
        <CommentForm postId={postId} onCommentCreated={handleCommentCreated} />
      ) : (
        <p className="login-prompt">
          <Link href="/signin" className="btn-link-primary">Sign in</Link>
          {" "}to leave a comment.
        </p>
      )}

      <div className="comments-list">
        {loading ? (
          <p className="loading-message" style={{ textAlign: "center", padding: "30px 0" }}>
            Loading comments...
          </p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onUpdate={handleCommentUpdated}
            />
          ))
        ) : (
            // 🌟 UI 텍스트 한국어 우선: 아직 댓글이 없습니다.
            <p className="no-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}