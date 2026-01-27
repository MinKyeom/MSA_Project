package com.mk.auth_service.security;

import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.repository.AuthUserRepository;
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

    private final AuthUserRepository authUserRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AuthUser user = authUserRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        
        return new org.springframework.security.core.userdetails.User(
                user.getId(), 
                user.getPassword(), 
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}