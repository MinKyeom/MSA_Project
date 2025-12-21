// uploaded:UserResponse.java (수정)

package com.mk.user_service.dto;

import com.mk.user_service.entity.User; // User 엔티티 임포트 필요 (User Service에 존재한다고 가정)
import lombok.Builder;

@Builder
public record UserResponse (
    String id,
    String username,
    String nickname, 
    String error 
) {
    /**
     * ⭐ 추가: User 엔티티를 UserResponse DTO로 변환하는 정적 팩토리 메서드
     * UserController에서 이 메서드를 호출하여 응답을 생성합니다.
     */
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                // 에러 필드는 변환 시에는 null로 설정
                .error(null) 
                .build();
    }
}