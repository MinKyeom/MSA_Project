package com.mk.post_service.service;

import com.mk.post_service.dto.*;
import com.mk.post_service.entity.*;
import com.mk.post_service.repository.*;
import org.springframework.core.ParameterizedTypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final WebClient webClient;

    @Value("${USER_SERVICE_URL:http://localhost:8081}")
    private String userServiceUrl;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, WebClient.Builder webClientBuilder) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.webClient = webClientBuilder.build();
    }

    public CommentResponse createComment(Long postId, CommentRequest request, String authenticatedUserId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("게시글 없음"));
        
        Comment comment = Comment.builder()
                .content(request.getContent())
                .authorId(authenticatedUserId)
                .post(post)
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        return CommentResponse.fromEntity(savedComment, nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
    }

    public List<CommentResponse> getCommentsByPostId(Long postId) {
        List<Comment> comments = commentRepository.findByPostId(postId);
        
        // ⭐ 수정 포인트: 댓글들의 모든 작성자 ID를 추출하여 닉네임을 한꺼번에 조회
        List<String> authorIds = comments.stream()
                .map(Comment::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);

        // 닉네임과 함께 Response DTO 생성
        return comments.stream()
                .map(comment -> {
                    String nickname = nicknameMap.getOrDefault(comment.getAuthorId(), "작성자 알 수 없음");
                    return CommentResponse.fromEntity(comment, nickname);
                })
                .collect(Collectors.toList());
    }

    public CommentResponse updateComment(Long commentId, CommentRequest request, String authenticatedUserId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("댓글 없음"));
        if (!comment.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");

        comment.setContent(request.getContent());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        return CommentResponse.fromEntity(comment, nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
    }

    public void deleteComment(Long commentId, String authenticatedUserId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("댓글 없음"));
        if (!comment.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        commentRepository.delete(comment);
    }

    private Map<String, String> getAuthorNicknamesMap(List<String> authorIds) {
        if (authorIds.isEmpty()) return Collections.emptyMap();
        try {
            return webClient.post()
                    .uri(userServiceUrl + "/user/api/users/nicknames")
                    .bodyValue(authorIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                    .block();
        } catch (Exception e) {
            log.error("User Service 연결 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}