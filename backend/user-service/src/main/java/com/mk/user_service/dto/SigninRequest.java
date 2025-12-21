package com.mk.user_service.dto;

import jakarta.validation.constraints.NotBlank; // ⭐ 추가

public record SigninRequest(
        @NotBlank(message = "사용자 이름은 필수 입력 항목입니다.") // ⭐ 추가
        String username,
        
        @NotBlank(message = "비밀번호는 필수 입력 항목입니다.") // ⭐ 추가
        String password
) {}