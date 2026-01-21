package com.mk.post_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter @Setter
@Table(name = "posts", indexes = @Index(name = "idx_post_created_at", columnList = "createdAt"))
// @Table(name = "posts")
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    // @Lob
    @Column(columnDefinition = "TEXT") //PostgreSQL 오류 방지
    private String content; 

    // ⭐ 수정: User 엔티티와의 관계 제거
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "user_id") 
    // private User user; // 삭제
    
    // ⭐ 추가: 작성자의 ID만 저장
    @Column(name = "author_id", nullable = false, length = 50) 
    private String authorId; 

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category; 

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_tag",
        joinColumns = @JoinColumn(name="post_id"),
        inverseJoinColumns = @JoinColumn(name="tag_id")
    )
    private Set<Tag> tags = new HashSet<>(); 

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();
}