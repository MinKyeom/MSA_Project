package com.mk.user_service.service;

import com.mk.user_service.entity.User;
import com.mk.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // 1.12 추가
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND:" + id));
    }

    @Transactional(readOnly = true)
    public boolean existsByNickname(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getNicknamesByIds(List<String> userIds) {
        List<User> users = userRepository.findAllById(userIds);
        return users.stream()
                .collect(Collectors.toMap(User::getId, User::getNickname));
    }
}