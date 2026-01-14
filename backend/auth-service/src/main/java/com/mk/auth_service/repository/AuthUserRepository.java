package com.mk.auth_service.repository;

import com.mk.auth_service.entity.AuthUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AuthUserRepository extends JpaRepository<AuthUser, String> {
    // Optional<AuthUser> findByUsername(String username);
    Optional<AuthUser> findByUsernameIgnoreCase(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
}