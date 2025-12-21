package com.mk.user_service.service;

import com.mk.user_service.entity.User;
import com.mk.user_service.repository.UserRepository;
import com.mk.user_service.exception.DuplicateResourceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * 회원가입 (사용자 생성)
     */
    public User create(final User user) {
        if (user == null || user.getUsername() == null || user.getNickname() == null) {
            throw new RuntimeException("유효하지 않은 인수입니다.");
        }
        final String username = user.getUsername();
        final String nickname = user.getNickname();

        if (userRepository.existsByUsername(username)) {
            log.warn("이미 존재하는 사용자 이름: {}", username);
            throw new DuplicateResourceException("이미 존재하는 사용자 이름입니다.");
        }

        if (userRepository.existsByNickname(nickname)) {
            log.warn("이미 존재하는 닉네임: {}", nickname);
            throw new DuplicateResourceException("이미 존재하는 닉네임입니다.");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);

        if (user.getRole() == null) {
            user.setRole(User.Role.ROLE_USER);
        }

        return userRepository.save(user);
    }

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