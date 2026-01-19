// src/services/api/comments.js

import axios from "axios";

// ⭐ 수정: Post Server URL을 환경 변수에서 가져오도록 변경
const POSTS_BASE_URL =
  process.env.NEXT_PUBLIC_POST_API_URL || "https://minkowskim.com";
const COMMENTS_BASE_API_URL = `${POSTS_BASE_URL}/api/posts`;

// 인증이 필요한 요청을 위해 HttpOnly 쿠키를 자동으로 전송하는 Axios 인스턴스
const authAxios = axios.create({
  baseURL: POSTS_BASE_URL,
  withCredentials: true, // HTTP-only 쿠키 전송 활성화
});

// --- 댓글 조회 (인증 불필요) ---

/**
 * 특정 게시글의 댓글 목록 조회 (GET /api/posts/{postId}/comments)
 * @param {number} postId - 게시글 ID
 */
export const fetchCommentsByPostId = async (postId) => {
  try {
    // 컨트롤러의 경로: /api/posts/{postId}/comments
    const response = await axios.get(
      `${COMMENTS_BASE_API_URL}/${postId}/comments`
    );
    return response.data; // List<CommentResponse>
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    throw error;
  }
};

// --- 댓글 CRUD (인증 필수) ---

/**
 * 댓글 생성 (POST /api/posts/{postId}/comments)
 * @param {number} postId - 게시글 ID
 * @param {object} commentRequestData - { content: string }
 */
export const createComment = async (postId, commentRequestData) => {
  try {
    // 컨트롤러의 경로: /api/posts/{postId}/comments
    const response = await authAxios.post(
      `${COMMENTS_BASE_API_URL}/${postId}/comments`,
      commentRequestData
    );
    return response.data; // 새로 생성된 CommentResponse 객체 반환
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

/**
 * 댓글 수정 (PUT /api/posts/comments/{commentId})
 * @param {number} commentId - 수정할 댓글 ID
 * @param {object} commentRequestData - { content: string }
 */
export const updateComment = async (commentId, commentRequestData) => {
  try {
    // 컨트롤러의 경로: /api/posts/comments/{commentId}
    const response = await authAxios.put(
      `${COMMENTS_BASE_API_URL}/comments/${commentId}`,
      commentRequestData
    );
    return response.data; // 수정된 CommentResponse 객체 반환
  } catch (error) {
    console.error(`Error updating comment ${commentId}:`, error);
    throw error;
  }
};

/**
 * 댓글 삭제 (DELETE /api/posts/comments/{commentId})
 * @param {number} commentId - 삭제할 댓글 ID
 */
export const deleteComment = async (commentId) => {
  try {
    // 컨트롤러의 경로: /api/posts/comments/{commentId}
    const response = await authAxios.delete(
      `${COMMENTS_BASE_API_URL}/comments/${commentId}`
    );
    return response.data; // HTTP 200/204 응답 (반환 값 없을 수 있음)
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
};
