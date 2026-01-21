package com.mk.post_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie; // ⭐ 추가: 쿠키 처리를 위한 import
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; 
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.Collections;

@Slf4j 
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenProvider tokenProvider;
    
    /**
     * ⭐ 추가: HTTP 헤더 대신 "authToken" 쿠키에서 JWT를 추출하도록 변경
     * User Service의 토큰 발행 방식(HttpOnly 쿠키)과 일치시키기 위함입니다.
     */
    private String getJwtFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if ("authToken".equals(cookie.getName())) { // 쿠키 이름 확인
                return cookie.getValue();
            }
        }
        return null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // ⭐ 수정: Authorization 헤더 대신 getJwtFromCookie 호출
        String token = getJwtFromCookie(request);
        log.info("Extracted Token from Cookie: {}", token);
        // 유효한 토큰이 쿠키에 있는 경우에만 처리
        if(StringUtils.hasText(token)) {
            
            // TokenProvider에서 예외를 처리하므로, 유효성 검사 실패 시 userId는 null이 됩니다.
            String userId = tokenProvider.validateAndGetUserId(token);
            String role = tokenProvider.getRoleFromToken(token); 
            
            // 토큰이 유효한 경우에만 인증 객체 설정
            if(userId != null && role != null) {
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role); 

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, // principal: 사용자 ID (String)
                    null,   
                    Collections.singleton(authority) 
                );
                
                SecurityContextHolder.getContext().setAuthentication(authentication); 
            }
        }
        else{
            log.warn("No authToken found in cookies!");
        }
        
        // 토큰 유무/유효성에 관계없이 다음 필터로 진행 (permitAll() 경로 허용 보장)
        filterChain.doFilter(request, response);
    }
}