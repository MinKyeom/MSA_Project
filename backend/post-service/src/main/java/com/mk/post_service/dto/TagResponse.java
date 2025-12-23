package com.mk.post_service.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * Sidebar 메뉴에 표시할 태그 목록의 응답 DTO
 * (Tag name과 postCount를 포함)
 */
@Builder
@Getter @Setter
public class TagResponse {
    private String name;
    private Long postCount;
}