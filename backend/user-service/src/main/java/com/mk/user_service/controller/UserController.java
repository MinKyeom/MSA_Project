package com.mk.user_service.controller;

import com.mk.user_service.dto.SigninRequest;
import com.mk.user_service.entity.User;
import com.mk.user_service.dto.SignupRequest;
import com.mk.user_service.dto.UserResponse;
import com.mk.user_service.exception.DuplicateResourceException;
import com.mk.user_service.security.TokenProvider;
import com.mk.user_service.service.UserService;
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
public class UserController {

    private final UserService userService;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            // SignupRequest도 Record이므로 필드명()으로 호출
            User user = User.builder()
                    .username(signupRequest.username())
                    .password(signupRequest.password())
                    .nickname(signupRequest.nickname())
                    .build();
            User registeredUser = userService.create(user);
            return ResponseEntity.ok(UserResponse.fromEntity(registeredUser));
        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticate(@RequestBody SigninRequest signinRequest, HttpServletResponse response) {
        // [수정 포인트] Record 타입이므로 getUsername() -> username()으로 변경
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        signinRequest.username(),
                        signinRequest.password()
                )
        );

        User user = userService.findUserByUsername(signinRequest.username());
        String token = tokenProvider.create(user);

        setTokenCookie(response, token, 7 * 24 * 60 * 60);

        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        setTokenCookie(response, null, 0);
        return ResponseEntity.ok().body("로그아웃 되었습니다.");
    }

    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(userService.existsByUsername(username));
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(userService.existsByNickname(nickname));
    }

    @GetMapping("/me/{userId}")
    public ResponseEntity<UserResponse> getUserInfo(@PathVariable String userId) {
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
        return ResponseEntity.ok(userService.getNicknamesByIds(userIds));
    }

    private void setTokenCookie(HttpServletResponse response, String token, int maxAge) {
        String value = (token == null) ? "" : token;
        StringBuilder sb = new StringBuilder();
        sb.append("authToken=").append(value);
        sb.append("; Path=/; Max-Age=").append(maxAge);
        sb.append("; HttpOnly");
        if (!value.isEmpty()) {
            sb.append("; Secure");
        }
        sb.append("; SameSite=Lax");
        response.setHeader("Set-Cookie", sb.toString());
    }
}