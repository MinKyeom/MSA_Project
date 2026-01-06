package com.mk.user_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size; // ⭐ 추가
import lombok.Builder;
import jakarta.validation.constraints.Email; // ⭐ 추가 확인

@Builder
public record SignupRequest (
    // 빈 값/null 허용 안 함
    @NotBlank(message = "사용자 이름은 필수 입력 항목입니다.") 
    @Size(min = 3) // 프론트와 맞추기
    String username,
    
    // ⭐ 수정: 비밀번호 길이 조건 추가 (최소 8자, 최대 20자)
    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.") 
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하여야 합니다.")
    String password,
    
    // 빈 값/null 허용 안 함
    @NotBlank(message = "닉네임은 필수 입력 항목입니다.") 
    String nickname,
    
    // ⭐ 이메일 추가 및 형식 검증
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    String email
) {}