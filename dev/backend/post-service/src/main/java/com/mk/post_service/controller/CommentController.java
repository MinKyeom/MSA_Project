package com.mk.post_service.controller;

import com.mk.post_service.dto.CommentRequest;
import com.mk.post_service.dto.CommentResponse;
import com.mk.post_service.service.CommentService;
import com.mk.post_service.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 1. 댓글 작성 (POST /api/posts/{postId}/comments)
    @PostMapping("/{postId}/comments")
    public CommentResponse createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request
    ) {
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
            @Valid @RequestBody CommentRequest request
    ) {
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        return commentService.updateComment(commentId, request, authenticatedUserId);
    }

    // 4. 댓글 삭제 (DELETE /api/posts/comments/{commentId})
    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(@PathVariable Long commentId) {
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        commentService.deleteComment(commentId, authenticatedUserId);
    }
}