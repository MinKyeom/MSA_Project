package com.mk.auth_service.config;

import com.mk.auth_service.dto.UserCreatedEvent;
import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.repository.AuthUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 첫 메인 관리자 계정을 .env(ADMIN_USERNAME, ADMIN_PASSWORD)로 생성합니다.
 * DB에 해당 username이 없을 때만 생성하며, user-service에 프로필 생성 이벤트도 전송합니다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class AdminBootstrap {

    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Bean
    public ApplicationRunner initAdminUser() {
        return args -> {
            if (adminUsername == null || adminUsername.isBlank()) {
                log.debug("ADMIN_USERNAME not set, skipping admin bootstrap.");
                return;
            }
            if (adminPassword == null || adminPassword.isBlank()) {
                log.warn("ADMIN_USERNAME set but ADMIN_PASSWORD empty, skipping admin bootstrap.");
                return;
            }
            authUserRepository.findByUsernameIgnoreCase(adminUsername.trim()).ifPresentOrElse(
                u -> log.debug("Admin user already exists: {}", adminUsername),
                () -> {
                    String username = adminUsername.trim();
                    String email = username + "@admin.local";
                    AuthUser admin = AuthUser.builder()
                            .username(username)
                            .password(passwordEncoder.encode(adminPassword))
                            .email(email)
                            .role(AuthUser.Role.ROLE_ADMIN)
                            .authProvider(AuthUser.AuthProvider.LOCAL)
                            .providerSubjectId(null)
                            .build();
                    AuthUser saved = authUserRepository.save(admin);
                    kafkaTemplate.send("user-created-topic", new UserCreatedEvent(saved.getId(), saved.getUsername(), saved.getUsername(), saved.getEmail()));
                    log.info("Initial admin user created: {}", adminUsername);
                }
            );
        };
    }
}
