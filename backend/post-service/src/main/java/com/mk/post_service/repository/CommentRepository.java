package com.mk.post_service.repository;

import com.mk.post_service.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // 포스트 ID로 댓글 목록을 조회하는 메서드 추가
    List<Comment> findByPostId(Long postId);
}