"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createPost,
  fetchPostById,
  updatePost,
} from "../../../services/api/posts";
import { useAuth } from "../../../providers/AuthProvider";
import { useToast } from "../../../hooks/useToast";
import "../../../styles/globals.css";

import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
});

const renderMarkdown = (markdown) => {
  if (!markdown) return "";
  const rawMarkup = marked.parse(markdown);
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(rawMarkup);
  }
  return rawMarkup;
};

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, id: currentUserId } = useAuth();
  const { showToast } = useToast();

  const editId = searchParams.get("id");
  const isEdit = useMemo(() => !!editId, [editId]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchPostById(editId)
        .then((data) => {
          setTitle(data.title);
          setCategory(data.categoryName || "");
          setTags(data.tagNames ? data.tagNames.join(", ") : "");
          setContent(data.content);
          setIsLoading(false);
        })
        .catch((err) => {
          showToast({ message: "게시글을 불러오지 못했습니다.", type: "error" });
          router.push("/post");
        });
    }
  }, [isEdit, editId, router, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

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
        await updatePost(editId, postRequestData);
        showToast({ message: "게시글이 수정되었습니다.", type: "success" });
      } else {
        await createPost(postRequestData);
        showToast({ message: "게시글이 작성되었습니다.", type: "success" });
      }
      router.push("/post");
    } catch (error) {
      console.error(error);
      showToast({ message: "게시글 저장에 실패했습니다.", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) return <div className="container">로딩 중...</div>;

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "30px", color: "var(--color-text-main)" }}>
        {isEdit ? "포스트 수정" : "새 포스트 작성"}
      </h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
          <div style={{ display: "flex", gap: "20px" }}>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="카테고리 (예: 개발, 일상)"
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
          <div style={{ display: "flex", gap: "20px", height: "600px" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운 형식으로 내용을 입력하세요..."
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-main)",
                resize: "none",
                fontSize: "1rem",
              }}
              required
            ></textarea>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              style={{
                flex: 1,
                padding: "15px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                backgroundColor: "var(--color-primary)",
                overflowY: "auto",
              }}
            ></div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "15px",
              marginTop: "10px",
            }}
          >
            <Link
              href={isEdit ? `/post/${editId}` : "/post"}
              className="btn-secondary"
              style={{ padding: "12px 25px" }}
            >
              취소
            </Link>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "12px 40px" }}
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