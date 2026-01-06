package com.mk.user_service.repository;

import com.mk.user_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByNickname(String nickname); // ⭐ 추가: 닉네임 중복 확인
    Boolean existsByEmail(String email);
    Optional<User> findById(String id); // ID로 User를 찾는 메서드 추가
}