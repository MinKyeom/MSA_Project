package com.mk.user_service.security;

import com.mk.user_service.entity.User;
import com.mk.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        
        String password = user.getPassword() != null ? user.getPassword() : "";

        // ⭐ 수정: Principal을 username 대신 user.getId() (UUID)로 설정하여 
        // JWT 필터 및 SecurityUtils와 Principal 타입을 통일합니다.
        return new org.springframework.security.core.userdetails.User(
                user.getId(), // <--- ⭐ 변경: Principal을 ID로 설정
                password, 
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}