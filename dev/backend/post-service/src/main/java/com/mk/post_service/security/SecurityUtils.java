package com.mk.post_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * JWT에서 인증된 사용자 ID를 추출하는 유틸리티 클래스
 */
@Component
public class SecurityUtils {

    /**
     * SecurityContextHolder에서 인증된 사용자 ID (Principal)를 추출합니다.
     * 인증되지 않았거나 익명 사용자인 경우 RuntimeException을 발생시킵니다.
     * * @return 인증된 사용자 ID (String - UUID)
     * @throws RuntimeException 인증되지 않은 사용자일 경우
     */
    public static String getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 인증 객체 자체가 null이거나, 익명 사용자 (anonymousUser)인 경우
        if (authentication == null || 
            !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("인증되지 않은 사용자입니다. 로그인하십시오.");
        }
        
        // Principal은 JwtAuthenticationFilter에서 설정된 사용자 ID (String/UUID)입니다.
        return (String) authentication.getPrincipal(); 
    }
}