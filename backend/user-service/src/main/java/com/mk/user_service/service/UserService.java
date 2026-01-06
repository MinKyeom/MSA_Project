package com.mk.user_service.service;

import com.mk.user_service.entity.User;
import com.mk.user_service.repository.UserRepository;
import com.mk.user_service.exception.DuplicateResourceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// smtp 서버 추가 후 필요한 부분
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import java.time.Duration; // ⭐ 추가 필요
import java.util.Random;   // ⭐ 추가 필요

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate; // ⭐ Redis 주입
    private final KafkaTemplate<String, Object> kafkaTemplate; // ⭐ Kafka 주입


    /**
     * 1. 인증번호 발송 및 Redis 저장
     */
    public void sendVerificationCode(String email) {
        // 000000~999999까지 항상 6자리를 보장하는 코드 생성
        String code = String.format("%06d", java.util.concurrent.ThreadLocalRandom.current().nextInt(1000000));
        
        // Redis 저장 (5분 만료)
        redisTemplate.opsForValue().set("VERIFY:" + email, code, Duration.ofMinutes(5));

        // Kafka 전송
        Map<String, String> mailEvent = Map.of(
            "email", email,
            "code", code,
            "type", "SIGNUP"
        );
        kafkaTemplate.send("mail-topic", mailEvent);
    }

    /**
     * 2. 인증번호 검증
     */
    public boolean verifyCode(String email, String code) {
        String savedCode = redisTemplate.opsForValue().get("VERIFY:" + email);
        if (code.equals(savedCode)) {
            // 인증 성공 시 10분간 유효한 가입 권한 부여
            redisTemplate.opsForValue().set("AUTH_COMPLETE:" + email, "TRUE", Duration.ofMinutes(10));
            redisTemplate.delete("VERIFY:" + email); // 인증 성공 후 번호 삭제
            return true;
        }
        return false;
    }

    /**
     * 3. 최종 회원가입 (수정)
     */
    public User create(final User user) {
        if (user == null || user.getUsername() == null || user.getNickname() == null || user.getEmail() == null) {
            throw new RuntimeException("유효하지 않은 인수입니다.");
        }

        // ⭐ Redis 인증 여부 확인
        String isAuth = redisTemplate.opsForValue().get("AUTH_COMPLETE:" + user.getEmail());
        if (!"TRUE".equals(isAuth)) {
            throw new RuntimeException("이메일 인증이 완료되지 않았습니다.");
        }

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new DuplicateResourceException("이미 존재하는 사용자 이름입니다.");
        }

        if (userRepository.existsByNickname(user.getNickname())) {
            throw new DuplicateResourceException("이미 존재하는 닉네임입니다.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole(User.Role.ROLE_USER);
        }

        User savedUser = userRepository.save(user);
        redisTemplate.delete("AUTH_COMPLETE:" + user.getEmail()); // 가입 완료 후 인증 상태 삭제
        return savedUser;
    }

    /**
     * 회원가입 (사용자 생성)
     */
    // public User create(final User user) {
    //     if (user == null || user.getUsername() == null || user.getNickname() == null) {
    //         throw new RuntimeException("유효하지 않은 인수입니다.");
    //     }
    //     final String username = user.getUsername();
    //     final String nickname = user.getNickname();

    //     if (userRepository.existsByUsername(username)) {
    //         log.warn("이미 존재하는 사용자 이름: {}", username);
    //         throw new DuplicateResourceException("이미 존재하는 사용자 이름입니다.");
    //     }

    //     if (userRepository.existsByNickname(nickname)) {
    //         log.warn("이미 존재하는 닉네임: {}", nickname);
    //         throw new DuplicateResourceException("이미 존재하는 닉네임입니다.");
    //     }

    //     String encodedPassword = passwordEncoder.encode(user.getPassword());
    //     user.setPassword(encodedPassword);

    //     if (user.getRole() == null) {
    //         user.setRole(User.Role.ROLE_USER);
    //     }

    //     return userRepository.save(user);
    // }

    /**
     * 아이디 중복 확인 (실시간 체크용)
     */
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * 닉네임 중복 확인 (실시간 체크용)
     */
    @Transactional(readOnly = true)
    public boolean existsByNickname(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    public User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public Map<String, String> getNicknamesByIds(List<String> userIds) {
        List<User> users = userRepository.findAllById(userIds);
        return users.stream().collect(Collectors.toMap(User::getId, User::getNickname));
    }
}