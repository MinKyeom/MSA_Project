package com.mk.post_service.repository;

import com.mk.post_service.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);

    // ⭐ 추가: 모든 카테고리와 해당 카테고리 포스트 개수 조회 (포스트가 0개인 카테고리 제외)
    // SELECT c.name, COUNT(p) -> Category 이름과 해당 카테고리 Post 개수
    @Query("SELECT c.name, COUNT(p) FROM Category c JOIN c.posts p GROUP BY c.name ORDER BY COUNT(p) DESC")
    List<Object[]> findCategoryNamesAndPostCounts();
}