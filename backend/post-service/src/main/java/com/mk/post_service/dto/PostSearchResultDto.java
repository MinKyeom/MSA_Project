package com.mk.post_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 키워드(SQL) 검색 결과 — 하이브리드 검색 시 프론트와 검색 서비스 응답 형식 통일용.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostSearchResultDto {
    private Long postId;
    private String title;
    private String snippet;
}
