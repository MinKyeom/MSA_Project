package com.mk.auth_service.security;

import com.mk.auth_service.entity.AuthUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 액세스 토큰 발급(30분) 및 검증.
 * 리프레시 토큰은 Redis에 저장되며 여기서는 UUID 발급만 담당하지 않음(Redis 키는 AuthService에서 관리).
 */
@Slf4j
@Service
public class TokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-expiry-minutes:30}")
    private int accessExpiryMinutes;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    /** 액세스 토큰 생성 — 만료 30분 (설정값 사용) */
    public String createAccessToken(AuthUser authUser) {
        String role = authUser.getRole() != null ? authUser.getRole().name() : AuthUser.Role.ROLE_USER.name();
        Date expiryDate = new Date(System.currentTimeMillis() + accessExpiryMinutes * 60L * 1000L);

        return Jwts.builder()
                .setSubject(authUser.getId())
                .claim("roles", role)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), io.jsonwebtoken.SignatureAlgorithm.HS512)
                .compact();
    }

    /** 기존 7일 토큰 생성(호환용) — 가입 응답 등에서만 사용 시 createAccessToken 사용 권장 */
    public String create(AuthUser authUser) {
        return createAccessToken(authUser);
    }

    public String validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getSubject();
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return null;
        }
    }

    /** 만료 여부 포함 검증(세션 연장 시 grace 기간 허용). 만료 후 graceMillis 초과 시 null. */
    public String validateAndGetUserIdWithExpiry(String token, long graceMillis) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Date exp = claims.getExpiration();
            if (exp != null && exp.getTime() + graceMillis < System.currentTimeMillis()) {
                return null;
            }
            return claims.getSubject();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            Claims claims = e.getClaims();
            Date exp = claims.getExpiration();
            if (exp != null && exp.getTime() + graceMillis >= System.currentTimeMillis()) {
                return claims.getSubject();
            }
            return null;
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return null;
        }
    }

    public String getRoleFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.get("roles", String.class);
        } catch (JwtException e) {
            return null;
        }
    }
}
