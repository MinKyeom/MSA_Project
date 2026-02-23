package com.mk.auth_service.service;

import com.mk.auth_service.dto.*;
import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.repository.AuthUserRepository;
import com.mk.auth_service.security.TokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String REDIS_REFRESH_PREFIX = "REFRESH:";
    private static final String REDIS_USER_REFRESH_PREFIX = "USER_REFRESH:";

    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TokenProvider tokenProvider;

    @Value("${jwt.refresh-expiry-days:7}")
    private int refreshExpiryDays;

    public void sendVerificationCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        String code = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue().set("VERIFY:" + normalizedEmail, code, Duration.ofMinutes(5));
        kafkaTemplate.send("mail-topic", new MailEvent(normalizedEmail, code));
    }

    public boolean verifyCode(String email, String code) {
        if (email == null) return false;
        String normalizedEmail = email.trim().toLowerCase();
        String savedCode = redisTemplate.opsForValue().get("VERIFY:" + normalizedEmail);
        return code != null && code.equals(savedCode);
    }

    /** 아이디 찾기: 이메일로 인증번호 발송 */
    public void sendFindUsernameCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        AuthUser user = authUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정이 없습니다."));
        if (user.getAuthProvider() != AuthUser.AuthProvider.LOCAL) {
            throw new RuntimeException("소셜 로그인 계정입니다. 해당 서비스에서 로그인해 주세요.");
        }
        String code = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue().set("FIND_USERNAME:" + normalizedEmail, code, Duration.ofMinutes(5));
        kafkaTemplate.send("mail-topic", new MailEvent(normalizedEmail, code));
    }

    /** 아이디 찾기: 인증번호 확인 후 아이디 반환 (마스킹 가능) */
    @Transactional(readOnly = true)
    public String findUsernameByEmailAfterVerify(String email, String code) {
        if (email == null || code == null) return null;
        String normalizedEmail = email.trim().toLowerCase();
        String savedCode = redisTemplate.opsForValue().get("FIND_USERNAME:" + normalizedEmail);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new RuntimeException("인증번호가 일치하지 않거나 만료되었습니다.");
        }
        AuthUser user = authUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정이 없습니다."));
        redisTemplate.delete("FIND_USERNAME:" + normalizedEmail);
        return user.getUsername();
    }

    private static final String REDIS_RESET_PW_PREFIX = "RESET_PW:";

    /** 비밀번호 재설정: 이메일로 인증번호 발송 */
    public void sendResetPasswordCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        AuthUser user = authUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정이 없습니다."));
        if (user.getAuthProvider() != AuthUser.AuthProvider.LOCAL) {
            throw new RuntimeException("소셜 로그인 계정입니다. 비밀번호 재설정이 필요하지 않습니다.");
        }
        String code = String.format("%06d", new Random().nextInt(1000000));
        redisTemplate.opsForValue().set(REDIS_RESET_PW_PREFIX + normalizedEmail, code, Duration.ofMinutes(10));
        kafkaTemplate.send("mail-topic", new MailEvent(normalizedEmail, code));
    }

    /** 비밀번호 재설정: 인증번호 확인 후 새 비밀번호로 변경 */
    @Transactional
    public void resetPasswordWithCode(String email, String code, String newPassword) {
        if (email == null || code == null || newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("이메일, 인증번호, 새 비밀번호를 모두 입력해 주세요.");
        }
        String normalizedEmail = email.trim().toLowerCase();
        String savedCode = redisTemplate.opsForValue().get(REDIS_RESET_PW_PREFIX + normalizedEmail);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new RuntimeException("인증번호가 일치하지 않거나 만료되었습니다.");
        }
        AuthUser user = authUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정이 없습니다."));
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        authUserRepository.save(user);
        redisTemplate.delete(REDIS_RESET_PW_PREFIX + normalizedEmail);
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
                .authProvider(AuthUser.AuthProvider.LOCAL)
                .providerSubjectId(null)
                .build();

        AuthUser saved = authUserRepository.save(authUser);

        // Kafka를 통해 User-Service에 프로필 생성 요청
        UserCreatedEvent event = new UserCreatedEvent(saved.getId(), saved.getUsername(), request.nickname(), saved.getEmail());
        kafkaTemplate.send("user-created-topic", event);

        return saved;
    }

    @Transactional(readOnly = true)
    public AuthUser getByUsername(String username) {
        return authUserRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    /** 로그인 성공 후 리프레시 토큰을 Redis에 저장. 키: REFRESH:{token}=userId, USER_REFRESH:{userId}=token */
    public String saveRefreshToken(String userId) {
        String refreshToken = UUID.randomUUID().toString();
        Duration ttl = Duration.ofDays(refreshExpiryDays);
        redisTemplate.opsForValue().set(REDIS_REFRESH_PREFIX + refreshToken, userId, ttl);
        redisTemplate.opsForValue().set(REDIS_USER_REFRESH_PREFIX + userId, refreshToken, ttl);
        return refreshToken;
    }

    /** 리프레시 토큰으로 userId 조회. 없거나 만료 시 null */
    public String getUserIdByRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return null;
        return redisTemplate.opsForValue().get(REDIS_REFRESH_PREFIX + refreshToken);
    }

    /** 로그아웃 시 해당 사용자의 리프레시 토큰을 Redis에서 제거 */
    public void invalidateRefreshByUserId(String userId) {
        if (userId == null) return;
        String token = redisTemplate.opsForValue().get(REDIS_USER_REFRESH_PREFIX + userId);
        if (token != null) {
            redisTemplate.delete(REDIS_REFRESH_PREFIX + token);
        }
        redisTemplate.delete(REDIS_USER_REFRESH_PREFIX + userId);
    }

    /** 리프레시 토큰으로 새 액세스 토큰 발급(세션 연장). 유효한 리프레시일 때만 */
    @Transactional(readOnly = true)
    public AuthUser getById(String userId) {
        return authUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    /** OAuth2 로그인 성공 시 사용자 조회 또는 생성 (Google/Kakao) */
    @Transactional
    public AuthUser findOrCreateFromOAuth(AuthUser.AuthProvider provider, String providerSubjectId, String email, String name) {
        return authUserRepository.findByAuthProviderAndProviderSubjectId(provider, providerSubjectId)
                .orElseGet(() -> createOAuthUser(provider, providerSubjectId, email, name));
    }

    private AuthUser createOAuthUser(AuthUser.AuthProvider provider, String providerSubjectId, String email, String name) {
        String baseUsername = (provider.name().toLowerCase() + "_" + providerSubjectId).replaceAll("[^a-zA-Z0-9_]", "_");
        String username = baseUsername;
        int suffix = 0;
        while (authUserRepository.existsByUsername(username)) {
            username = baseUsername + "_" + (++suffix);
        }
        String safeEmail = (email != null && !email.isBlank()) ? email.trim().toLowerCase() : (username + "@oauth.local");
        if (authUserRepository.existsByEmail(safeEmail)) {
            safeEmail = username + "@oauth.local";
        }
        AuthUser user = AuthUser.builder()
                .username(username)
                .password(null)
                .email(safeEmail)
                .role(AuthUser.Role.ROLE_USER)
                .authProvider(provider)
                .providerSubjectId(providerSubjectId)
                .build();
        AuthUser saved = authUserRepository.save(user);
        UserCreatedEvent event = new UserCreatedEvent(saved.getId(), saved.getUsername(), name != null ? name : saved.getUsername(), saved.getEmail());
        kafkaTemplate.send("user-created-topic", event);
        return saved;
    }
}