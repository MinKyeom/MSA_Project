// 회원가입 응답 DTO
package com.mk.user_service.dto;

public record SignupResponse(
        String id,
        String username,
        String token
) {}
