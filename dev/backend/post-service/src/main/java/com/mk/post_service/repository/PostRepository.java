package com.mk.post_service.repository;

import com.mk.post_service.entity.Post;
import com.mk.post_service.entity.Category;
import com.mk.post_service.entity.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.category LEFT JOIN FETCH p.tags", 
    //        countQuery = "SELECT COUNT(p) FROM Post p")
    // @Query(value = "SELECT DISTINCT p FROM Post p " +
    //            "LEFT JOIN FETCH p.category " + // LEFT 추가: 카테고리 없어도 나오게 함
    //            "LEFT JOIN FETCH p.tags",        // 태그 없어도 나오게 함
    //    countQuery = "SELECT COUNT(DISTINCT p) FROM Post p") // DISTINCT 추가: 정확한 개수 산정
        // Page<Post> findAllWithDetails(Pageable pageable);
    // FETCH JOIN을 제거하여 메모리 페이징 방지
    @Query(value = "SELECT p FROM Post p", 
           countQuery = "SELECT COUNT(p) FROM Post p")
    Page<Post> findAllWithDetails(Pageable pageable);

    
    // 서비스의 getPostsByCategory와 일치하도록 수정
    Page<Post> findByCategoryName(String categoryName, Pageable pageable);
    
    // 서비스의 getPostsByTag와 일치하도록 수정
    Page<Post> findByTagsName(String tagName, Pageable pageable);

    // PostService의 통계 기능을 위해 이름 일치
    long countByCategory(Category category);
    
    // 서비스의 getAllTagsWithCount 내 countByTags와 일치하도록 수정
    long countByTags(Tag tag); 
}