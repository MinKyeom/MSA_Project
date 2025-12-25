package com.mk.post_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder; // ⭐ 추가
import lombok.NoArgsConstructor; // ⭐ 추가
import lombok.AllArgsConstructor; // ⭐ 추가
import lombok.AccessLevel; // ⭐ 추가
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@Builder // ⭐ 추가: 빌더 패턴 활성화
@NoArgsConstructor(access = AccessLevel.PROTECTED) // ⭐ 추가: JPA 요구 사항 (기본 생성자)
@AllArgsConstructor // ⭐ 추가: 빌더를 위한 전체 필드 생성자
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(nullable = false)
    private String content;

    private LocalDateTime createdAt = LocalDateTime.now();
    
    // 관계 1: Post (게시글) 유지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
    
    // ⭐ 수정: User 엔티티와의 관계 제거
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "user_id", nullable = false)
    // private User user; // 삭제

    // ⭐ 추가: 댓글 작성자의 ID만 저장
    @Column(name = "author_id", nullable = false, length = 50)
    private String authorId;
}