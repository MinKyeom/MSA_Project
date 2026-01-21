package com.mk.post_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException; 
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
// import java.time.Instant; // 토큰 생성 로직 제거
// import java.time.temporal.ChronoUnit; // 토큰 생성 로직 제거
// import java.util.Date; // 토큰 생성 로직 제거

/**
 * JWT 토큰을 검증하고 토큰에서 사용자 정보를 추출하는 Provider
 * Post Service는 토큰을 생성하지 않고, User Service가 생성한 토큰을 사용합니다.
 */
@Slf4j
@Service
public class TokenProvider {

    // application.yml/properties에 설정된 JWT 비밀 키
    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * 비밀 키를 사용하여 서명 키(Key)를 생성합니다.
     */
    private Key getSigningKey() {
        // secretKey는 최소 256비트(32바이트) 길이여야 합니다.
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // =========================================================================
    // ❌ 토큰 생성 로직은 User Service로 이관되었으므로 Post Service에서는 제거합니다.
    // public String create(User userEntity) { ... }
    // =========================================================================

    /**
     * ⭐ 1. 토큰 유효성 검증 및 ID 반환
     * * @param token JWT
     * @return 유효한 경우 사용자 ID (String), 유효하지 않은 경우 null
     */
    public String validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            // User Service에서 Subject (주체)로 설정된 사용자 ID를 반환
            return claims.getSubject(); 
        } catch (JwtException e) {
            // 토큰이 유효하지 않거나 만료된 경우 예외를 잡아 null 반환하여 필터 체인 계속 진행
            log.warn("JWT validation failed (returning null): {}", e.getMessage());
            return null; 
        }
    }
    
    /**
     * ⭐ 2. 토큰에서 역할 (Role) 추출
     * * @param token JWT
     * @return 토큰에 설정된 역할 (String), 없거나 유효하지 않은 경우 null
     */
    public String getRoleFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
            return (String) claims.get("roles");
            // String role = claims.get("roles", String.class); 
            // 권한 정보가 없더라도 기본 USER 권한을 부여하여 403 방지
            // return (role != null) ? role : "ROLE_USER"; 
        } catch (JwtException e) {
            return null; 
        }
    }
}