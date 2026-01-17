package com.mk.auth_service.service;

import com.mk.auth_service.dto.*;
import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.repository.AuthUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendVerificationCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        String code = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue().set("VERIFY:" + normalizedEmail, code, Duration.ofMinutes(5));
        kafkaTemplate.send("mail-topic", new MailEvent(normalizedEmail, code));
    }

    public boolean verifyCode(String email, String code) {
        String savedCode = redisTemplate.opsForValue().get("VERIFY:" + email);
        return code != null && code.equals(savedCode);
    }

    @Transactional
    public AuthUser signup(SignupRequest request) {
        if (authUserRepository.existsByUsername(request.username())) {
            throw new RuntimeException("이미 존재하는 아이디입니다.");
        }
        if (authUserRepository.existsByEmail(request.email())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        AuthUser authUser = AuthUser.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .role(AuthUser.Role.ROLE_USER)
                .build();

        AuthUser saved = authUserRepository.save(authUser);

        // Kafka를 통해 User-Service에 프로필 생성 요청
        UserCreatedEvent event = new UserCreatedEvent(saved.getId(), saved.getUsername(), request.nickname(), saved.getEmail());
        kafkaTemplate.send("user-created-topic", event);

        return saved;
    }

    @Transactional(readOnly = true)
    public AuthUser getByUsername(String username) {
        System.out.println("조회 요청된 username: [" + username + "]");
        return authUserRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}