package com.mk.auth_service.controller;

import com.mk.auth_service.dto.*;
import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.security.TokenProvider;
import com.mk.auth_service.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> request) {
        authService.sendVerificationCode(request.get("email"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> request) {
        boolean isValid = authService.verifyCode(request.get("email"), request.get("code"));
        return isValid ? ResponseEntity.ok().build() : ResponseEntity.badRequest().body("인증번호가 일치하지 않습니다.");
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest request) {
        AuthUser user = authService.signup(request);
        String token = tokenProvider.create(user);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid SigninRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        // AuthUser user = (AuthUser) authentication.getPrincipal();
        String username;
        if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            username = userDetails.getUsername();
        } else {
            username = authentication.getPrincipal().toString();
        }

        // 3. 추출한 username으로 우리 DB에서 진짜 AuthUser 엔티티를 조회 request.username()으로 조회로 수정 1.15
        AuthUser user = authService.getByUsername(request.username());     
        
        String token = tokenProvider.create(user);
        setTokenCookie(response, token, 604800);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), token));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        setTokenCookie(response, null, 0);
        return ResponseEntity.ok().build();
    }

    private void setTokenCookie(HttpServletResponse response, String token, int maxAge) {
        String cookieValue = String.format(
            "authToken=%s; Path=/; Domain=minkowskim.com; HttpOnly; Max-Age=%d; SameSite=None; Secure", 
            token == null ? "" : token, maxAge
        );
        response.addHeader("Set-Cookie", cookieValue);
    }
}