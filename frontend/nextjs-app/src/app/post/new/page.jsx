"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createPost,
  fetchPostById,
  updatePost,
} from "../../../services/api/posts"; // 경로가 다를 경우 프로젝트 구조에 맞게 수정하세요
import { useAuth } from "../../../providers/AuthProvider";
import { useToast } from "../../../hooks/useToast";
import "../../../styles/globals.css";

import { marked } from "marked";
import DOMPurify from "dompurify";

// 마크다운 줄바꿈 설정
marked.setOptions({
  breaks: true,
});

const renderMarkdown = (markdown) => {
  if (!markdown) return "";
  const rawMarkup = marked.parse(markdown);
  // 브라우저 환경에서만 DOMPurify 실행 (Hydration 오류 방지)
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(rawMarkup);
  }
  return rawMarkup;
};

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, id: currentUserId, isAuthInitialized } = useAuth();
  const { showToast } = useToast();

  // URL 파라미터에 id가 있으면 수정 모드, 없으면 새 글 작성 모드
  const editId = searchParams.get("id");
  const isEdit = useMemo(() => !!editId, [editId]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 1. 보안 점검: 로그인하지 않은 사용자가 접근하면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      showToast({ message: "로그인이 필요한 서비스입니다.", type: "error" });
      router.push("/login");
    }
  }, [isAuthInitialized, isAuthenticated, router, showToast]);

  // 2. 수정 모드일 때 기존 데이터 로드 및 본인 확인
  useEffect(() => {
    if (isEdit && editId && isAuthInitialized && isAuthenticated) {
      fetchPostById(editId)
        .then((data) => {
          // Spring Boot 백엔드에서 내려준 작성자 ID와 현재 로그인 유저 ID 비교
          // PostResponse.java의 authorId 필드와 대조합니다.
          if (data.authorId !== currentUserId) {
            showToast({ message: "수정 권한이 없습니다.", type: "error" });
            router.push("/post");
            return;
          }
          setTitle(data.title);
          setCategory(data.categoryName || "");
          setTags(data.tagNames ? data.tagNames.join(", ") : "");
          setContent(data.content);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("데이터 로드 실패:", err);
          showToast({ message: "게시글을 불러오는 중 오류가 발생했습니다.", type: "error" });
          router.push("/post");
        });
    }
  }, [isEdit, editId, isAuthInitialized, isAuthenticated, currentUserId, router, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 최종 제출 전 인증 확인 (HttpOnly 쿠키 방식 대응)
    if (!isAuthenticated) {
      showToast({ message: "인증 세션이 만료되었습니다. 다시 로그인해주세요.", type: "error" });
      return;
    }
    
    setSubmitLoading(true);

    // Spring Boot PostRequest DTO 구조에 맞게 데이터 구성
    const postRequestData = {
      title,
      content,
      categoryName: category,
      tagNames: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    };

    try {
      if (isEdit) {
        // PUT /api/posts/{id} 호출
        await updatePost(editId, postRequestData);
        showToast({ message: "게시글이 성공적으로 수정되었습니다.", type: "success" });
      } else {
        // POST /api/posts 호출 (슬래시 없는 경로 사용)
        await createPost(postRequestData);
        showToast({ message: "게시글이 성공적으로 작성되었습니다.", type: "success" });
      }
      router.push("/post"); // 성공 시 목록 페이지로 이동
    } catch (error) {
      console.error("저장 실패:", error);
      // 403 Forbidden 에러 발생 시의 안내 메시지 강화
      const errorMsg = error.response?.status === 403 
        ? "접근 권한이 없거나 인증이 만료되었습니다. (403)" 
        : "서버 통신 중 오류가 발생했습니다.";
      showToast({ message: errorMsg, type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // 인증 초기화 대기 및 데이터 로딩 처리
  if (!isAuthInitialized || isLoading) {
    return (
      <div className="container" style={{ padding: "100px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-main)" }}>페이지를 준비 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "var(--color-text-main)", fontSize: "2rem" }}>
          {isEdit ? "포스트 수정" : "새 포스트 작성"}
        </h1>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 제목 입력 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "1.2rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
            required
          />

          {/* 카테고리 및 태그 입력 */}
          <div style={{ display: "flex", gap: "20px" }}>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="카테고리명"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그 (쉼표로 구분)"
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
          </div>

          {/* 에디터 및 미리보기 영역 (반응형 대응 권장) */}
          <div style={{ display: "flex", gap: "20px", minHeight: "600px" }}>
            {/* 작성 영역 */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운으로 내용을 작성해 보세요..."
              style={{
                flex: 1,
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-main)",
                resize: "none",
                fontSize: "1rem",
                lineHeight: "1.6",
              }}
              required
            ></textarea>

            {/* 미리보기 영역 */}
            <div
              className="markdown-body preview-area"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              style={{
                flex: 1,
                padding: "20px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                backgroundColor: "var(--color-bg-sub, #f9f9f9)", // 미리보기 배경 약간 다르게 설정 가능
                overflowY: "auto",
                color: "var(--color-text-main)",
              }}
            ></div>
          </div>

          {/* 하단 버튼 부 */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
            <Link
              href={isEdit ? `/post/${editId}` : "/post"}
              className="btn-secondary"
              style={{
                padding: "12px 25px",
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-block",
                textAlign: "center"
              }}
            >
              취소
            </Link>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "12px 40px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
              disabled={submitLoading || !title || !content}
            >
              {submitLoading ? "저장 중..." : isEdit ? "수정 완료" : "작성 완료"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}