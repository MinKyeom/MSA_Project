package com.mk.gateway_service.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Gateway 1차 JWT 검증: 서명 및 만료 확인.
 * 공개 경로(/auth/login, /auth/signup, /auth/send-code, /auth/verify-code, GET /api/posts 등)는 토큰 없이 통과.
 * 그 외 경로에서 Cookie(authToken) 또는 Authorization Bearer 가 있으면 검증; 실패 시 401.
 */
@Slf4j
@Component
public class JwtValidationGlobalFilter implements GlobalFilter, Ordered {

    private static final String AUTH_TOKEN_COOKIE = "authToken";
    private static final String BEARER_PREFIX = "Bearer ";

    /** 인증 없이 허용할 경로 패턴 (공개 API) */
    private static final List<Pattern> PUBLIC_PATTERNS = List.of(
        Pattern.compile("^/auth/(login|signup|send-code|verify-code|refresh|extend).*"),
        Pattern.compile("^/auth/oauth2/.*"),
        Pattern.compile("^/auth/login/oauth2/.*"),
        Pattern.compile("^/api/posts$"),           // GET 목록
        Pattern.compile("^/api/posts/\\d+$"),       // GET 상세
        Pattern.compile("^/api/posts/category.*"),
        Pattern.compile("^/api/posts/tag.*"),
        Pattern.compile("^/api/posts/categories$"),
        Pattern.compile("^/api/posts/tags$"),
        Pattern.compile("^/api/posts/\\d+/comments$"), // GET 댓글 목록
        Pattern.compile("^/api/search.*"),
        Pattern.compile("^/chat.*"),
        Pattern.compile("^/actuator/.*")
    );

    @Value("${jwt.secret}")
    private String secretString;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod().name();

        for (Pattern p : PUBLIC_PATTERNS) {
            if (p.matcher(path).matches()) {
                return chain.filter(exchange);
            }
        }
        // GET /api/posts/* 는 위에서 이미 허용됨. POST/PUT/DELETE 등은 토큰 필요
        String token = resolveToken(exchange);
        if (token == null) {
            return chain.filter(exchange);
        }
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
            if (claims.getExpiration() != null && claims.getExpiration().before(new java.util.Date())) {
                log.debug("JWT expired for path: {}", path);
                return respond401(exchange);
            }
            return chain.filter(exchange);
        } catch (Exception e) {
            log.debug("JWT validation failed for path {}: {}", path, e.getMessage());
            return respond401(exchange);
        }
    }

    private String resolveToken(ServerWebExchange exchange) {
        String bearer = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (bearer != null && bearer.startsWith(BEARER_PREFIX)) {
            return bearer.substring(BEARER_PREFIX.length()).trim();
        }
        List<String> cookies = exchange.getRequest().getHeaders().get(HttpHeaders.COOKIE);
        if (cookies != null) {
            for (String c : cookies) {
                for (String part : c.split(";")) {
                    String trimmed = part.trim();
                    if (trimmed.startsWith(AUTH_TOKEN_COOKIE + "=")) {
                        return trimmed.substring((AUTH_TOKEN_COOKIE + "=").length()).trim();
                    }
                }
            }
        }
        return null;
    }

    private Mono<Void> respond401(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        String body = "{\"error\":\"Unauthorized\",\"message\":\"Token invalid or expired\"}";
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
