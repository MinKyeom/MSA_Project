package com.mk.auth_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record SignupRequest (
    @NotBlank(message = "사용자 이름은 필수 입력 항목입니다.") 
    @Size(min = 3)
    String username,
    
    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.") 
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하여야 합니다.")
    String password,
    
    @NotBlank(message = "닉네임은 필수 입력 항목입니다.") 
    String nickname,
    
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    String email
) {}