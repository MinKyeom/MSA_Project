package com.mk.smtp_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class MailServiceSecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // 외부 호출이 없으므로 CSRF 비활성화
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll()); // 모든 접근 허용
        return http.build();
    }
}