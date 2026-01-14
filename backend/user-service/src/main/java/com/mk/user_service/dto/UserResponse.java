package com.mk.user_service.dto;

import com.mk.user_service.entity.User;
import lombok.Builder;

@Builder
public record UserResponse (
    String id,
    String username,
    String nickname,
    String email
) {
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .build();
    }
}