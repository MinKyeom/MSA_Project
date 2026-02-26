package com.mk.post_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Search 서비스가 수신하여 pgvector 임베딩 인덱싱에 사용하는 이벤트 페이로드.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostEventPayload {
    private Long postId;
    private String title;
    private String content;
}
