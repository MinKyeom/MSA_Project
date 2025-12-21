package com.mk.post_service.dto;

import com.mk.post_service.entity.Comment;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Builder
@Getter @Setter
public class CommentResponse {
    private Long id;
    private String content;
    private String authorNickname;
    private String authorId; 
    private LocalDateTime createdAt;

    // 기존 메서드 (유지)
    public static CommentResponse fromEntity(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(comment.getAuthorId()) 
                .createdAt(comment.getCreatedAt())
                .build();
    }

    // ⭐ 추가: 닉네임을 인자로 받는 변환 메서드 (Service에서 사용)
    public static CommentResponse fromEntity(Comment comment, String nickname) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(comment.getAuthorId())
                .authorNickname(nickname)
                .createdAt(comment.getCreatedAt())
                .build();
    }
    
    public static List<CommentResponse> fromEntityList(List<Comment> comments) {
        return comments.stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}