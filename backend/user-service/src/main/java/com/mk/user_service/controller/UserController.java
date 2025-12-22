package com.mk.user_service.controller;

import com.mk.user_service.dto.SigninRequest;
import com.mk.user_service.entity.User;
import com.mk.user_service.dto.SignupRequest;
import com.mk.user_service.dto.UserResponse;
import com.mk.user_service.exception.DuplicateResourceException;
import com.mk.user_service.security.TokenProvider;
import com.mk.user_service.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}, allowCredentials = "true") 
public class UserController {

    private final UserService userService;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * ⭐ 실시간 아이디 중복 체크 API 추가
     */
    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(userService.existsByUsername(username));
    }

    /**
     * ⭐ 실시간 닉네임 중복 체크 API 추가
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(userService.existsByNickname(nickname));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            User user = User.builder()
                    .username(signupRequest.username())
                    .password(signupRequest.password())
                    .nickname(signupRequest.nickname())
                    .build();
            User registeredUser = userService.create(user);
            return ResponseEntity.ok(UserResponse.fromEntity(registeredUser));
        } catch (DuplicateResourceException e) {
            return ResponseEntity.badRequest().body(new UserResponse(null, null, null, e.getMessage()));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@Valid @RequestBody SigninRequest signinRequest, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(signinRequest.username(), signinRequest.password())
        );
        User user = userService.findUserByUsername(signinRequest.username());
        String token = tokenProvider.create(user);
        setTokenCookie(response, token, 7 * 24 * 60 * 60);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        setTokenCookie(response, null, 0);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@RequestParam String userId) {
        try {
            User user = userService.findUserById(userId);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/users/nicknames")
    public ResponseEntity<Map<String, String>> getNicknamesByIds(@RequestBody List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyMap());
        }
        Map<String, String> nicknamesMap = userService.getNicknamesByIds(userIds);
        return ResponseEntity.ok(nicknamesMap);
    }

    // UserController.java 내 setTokenCookie 메서드 수정
    private void setTokenCookie(HttpServletResponse response, String token, int maxAge) {
    // String.format을 사용하여 Secure와 SameSite 속성을 강제 적용
        String cookieValue = String.format(
            "authToken=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=Lax; Secure", 
            token == null ? "" : token, 
            maxAge
        );
        response.addHeader("Set-Cookie", cookieValue);
    }
}