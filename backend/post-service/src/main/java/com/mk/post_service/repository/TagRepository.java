package com.mk.post_service.repository;

import com.mk.post_service.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);

    // ⭐ 추가: 모든 태그와 해당 태그 포스트 개수 조회 (포스트가 0개인 태그 제외)
    @Query("SELECT t.name, COUNT(p) FROM Tag t JOIN t.posts p GROUP BY t.name ORDER BY COUNT(p) DESC")
    List<Object[]> findTagNamesAndPostCounts();
}