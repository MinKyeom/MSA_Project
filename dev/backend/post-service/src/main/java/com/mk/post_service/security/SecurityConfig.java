// src/main/java/com/mk/post_service/security/SecurityConfig.java

package com.mk.post_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // ⭐ 삭제: PasswordEncoder, AuthenticationManager Bean은 User Service로 이관

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // 1. 기본 보안 설정 해제 및 세션 정책 (Stateless)
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // 2. 요청 권한 설정 (순서가 매우 중요!)
        .authorizeHttpRequests(auth -> auth
            // .requestMatchers("/h2-console/**").permitAll()
            // [A] Pre-flight 요청 및 개발 도구 허용
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            
            // [B] 조회(GET) 관련 API 전체 허용
            // /api/posts/** 를 통해 하위의 모든 GET 요청(상세, 카테고리, 태그 등)을 한 번에 처리
            .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
            
            // [C] 그 외 모든 요청(POST, PUT, DELETE)은 인증 필수
            .anyRequest().authenticated()
        )

        // 3. 필터 배치
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    
    // 4. 추가 헤더 설정 (H2 Console용)
    // http.headers(headers -> headers.frameOptions(options -> options.sameOrigin()));

    return http.build();
}
    
    /**
     * CORS (교차 출처 리소스 공유) 설정
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://minkowskim.com",
            "https://www.minkowskim.com",
            "http://127.0.0.1:5173", 
            "http://localhost:5173",
            "http://localhost:3000" 
        )); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}