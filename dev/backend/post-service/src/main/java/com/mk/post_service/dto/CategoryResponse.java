package com.mk.post_service.dto;

import com.mk.post_service.entity.Category;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter @Setter
public class CategoryResponse {
    private String name;
    private String slug;
    private Long postCount;

    public static CategoryResponse fromEntity(Category category, Long count) {
        // 프론트엔드 URL과 호환되도록 slug 생성 로직 강화
        String generatedSlug = category.getName()
                                       .toLowerCase()
                                       .trim()
                                       .replaceAll("[^a-z0-9\\s-]", "") 
                                       .replaceAll("\\s+", "-"); 
        
        return CategoryResponse.builder()
                .name(category.getName())
                .slug(generatedSlug)
                .postCount(count)
                .build();
    }
}