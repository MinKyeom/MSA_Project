package com.mk.post_service.controller;

import com.mk.post_service.dto.CommentRequest;
import com.mk.post_service.dto.CommentResponse;
import com.mk.post_service.service.CommentService;
import com.mk.post_service.security.SecurityUtils; // ⭐ SecurityUtils 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts") // 게시글 하위 경로로 맵핑
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 1. 댓글 작성 (POST /api/posts/{postId}/comments)
    @PostMapping("/{postId}/comments")
    public CommentResponse createComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request
    ) {
        // ⭐ 수정: 유틸리티 클래스 사용
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        return commentService.createComment(postId, request, authenticatedUserId);
    }

    // 2. 댓글 조회 (GET /api/posts/{postId}/comments)
    @GetMapping("/{postId}/comments")
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return commentService.getCommentsByPostId(postId);
    }

    // 3. 댓글 수정 (PUT /api/posts/comments/{commentId})
    @PutMapping("/comments/{commentId}")
    public CommentResponse updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request
    ) {
        // ⭐ 수정: 유틸리티 클래스 사용
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        return commentService.updateComment(commentId, request, authenticatedUserId);
    }

    // 4. 댓글 삭제 (DELETE /api/posts/comments/{commentId})
    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(@PathVariable Long commentId) {
        // ⭐ 수정: 유틸리티 클래스 사용
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        // ✅ 수정: authenticatedUserId를 서비스 메서드에 전달하여 권한 확인을 수행합니다.
        commentService.deleteComment(commentId, authenticatedUserId);
    }
}