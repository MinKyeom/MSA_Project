"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { deletePost } from "../../../services/api/posts";
import { useToast } from "../../../hooks/useToast";

export default function PostActions({ postId, postAuthorId }) {
  const { id: currentUserId } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // 로그인 유저 ID와 글 작성자 ID 비교
  const isAuthor =
    currentUserId &&
    postAuthorId &&
    currentUserId.toString().trim() === postAuthorId.toString().trim();

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 포스트를 삭제하시겠습니까?")) return;

    try {
      await deletePost(postId);
      showToast({ message: "포스트가 성공적으로 삭제되었습니다.", type: "success" });
      router.push("/post");
    } catch (error) {
      console.error(error);
      showToast({
        message: "삭제 중 오류가 발생했습니다. 권한을 확인해주세요.",
        type: "error",
      });
    }
  };

  if (!isAuthor) return null;

  return (
    <div
      className="post-action-buttons"
      style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}
    >
      <button
        onClick={() => router.push(`/post/new?id=${postId}`)}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-main)",
          cursor: "pointer",
        }}
      >
        수정
      </button>
      <button
        onClick={handleDelete}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#ff4d4f",
          color: "white",
          cursor: "pointer",
        }}
      >
        삭제
      </button>
    </div>
  );
}