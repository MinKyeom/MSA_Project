package com.mk.auth_service.controller;

import com.mk.auth_service.dto.*;
import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.security.TokenProvider;
import com.mk.auth_service.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
public class AuthController {
    private static final String COOKIE_AUTH_TOKEN = "authToken";
    private static final String COOKIE_REFRESH_TOKEN = "refreshToken";

    private final AuthService authService;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.access-expiry-minutes:30}")
    private int accessExpiryMinutes;

    @Value("${jwt.refresh-expiry-days:7}")
    private int refreshExpiryDays;

    @Value("${jwt.extend-grace-seconds:60}")
    private int extendGraceSeconds;

    @Value("${app.cookie-domain:.minkowskim.com}")
    private String cookieDomain;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> request) {
        try {
            authService.sendVerificationCode(request.get("email"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Kafka/Redis 장애 시 502 대신 503으로 명확한 메시지 반환
            return ResponseEntity.status(503).body(
                Map.of("message", "메일 발송 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.")
            );
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> request) {
        boolean isValid = authService.verifyCode(request.get("email"), request.get("code"));
        return isValid ? ResponseEntity.ok().build() : ResponseEntity.badRequest().body("인증번호가 일치하지 않습니다.");
    }

    /** 아이디 찾기 1단계: 이메일로 인증번호 발송 */
    @PostMapping("/find-username/send")
    public ResponseEntity<?> findUsernameSend(@RequestBody Map<String, String> request) {
        try {
            authService.sendFindUsernameCode(request.get("email"));
            return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 아이디 찾기 2단계: 인증번호 확인 후 아이디 반환 */
    @PostMapping("/find-username/verify")
    public ResponseEntity<?> findUsernameVerify(@RequestBody Map<String, String> request) {
        try {
            String username = authService.findUsernameByEmailAfterVerify(request.get("email"), request.get("code"));
            return ResponseEntity.ok(Map.of("username", username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 비밀번호 찾기 1단계: 이메일로 인증번호 발송 */
    @PostMapping("/reset-password/send")
    public ResponseEntity<?> resetPasswordSend(@RequestBody Map<String, String> request) {
        try {
            authService.sendResetPasswordCode(request.get("email"));
            return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 비밀번호 찾기 2단계: 인증번호 + 새 비밀번호로 재설정 */
    @PostMapping("/reset-password/verify")
    public ResponseEntity<?> resetPasswordVerify(@RequestBody Map<String, String> request) {
        try {
            authService.resetPasswordWithCode(
                    request.get("email"),
                    request.get("code"),
                    request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest request) {
        AuthUser user = authService.signup(request);
        String token = tokenProvider.createAccessToken(user);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), token));
    }

    /** 로그인 — 액세스 토큰 30분, 리프레시 토큰 Redis 저장 후 쿠키에 설정 */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid SigninRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        String username = request.username();
        AuthUser user = authService.getByUsername(username);

        String accessToken = tokenProvider.createAccessToken(user);
        String refreshToken = authService.saveRefreshToken(user.getId());

        setCookie(response, COOKIE_AUTH_TOKEN, accessToken, accessExpiryMinutes * 60);
        setCookie(response, COOKIE_REFRESH_TOKEN, refreshToken, refreshExpiryDays * 24 * 60 * 60);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), accessToken));
    }

    /** 로그아웃 — Redis 리프레시 토큰 삭제 후 쿠키 제거 (브라우저에서 즉시 삭제되도록 Max-Age=0 + Expires 과거) */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = getCookieValue(request, COOKIE_AUTH_TOKEN);
        if (accessToken != null) {
            String userId = tokenProvider.validateAndGetUserId(accessToken);
            if (userId != null) {
                authService.invalidateRefreshByUserId(userId);
            }
        }
        clearCookie(response, COOKIE_AUTH_TOKEN);
        clearCookie(response, COOKIE_REFRESH_TOKEN);
        return ResponseEntity.ok().build();
    }

    /** 리프레시 토큰으로 새 액세스 토큰 발급(세션 연장 가능) */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, COOKIE_REFRESH_TOKEN);
        if (refreshToken == null) {
            refreshToken = request.getHeader("X-Refresh-Token");
        }
        String userId = authService.getUserIdByRefreshToken(refreshToken);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired refresh token"));
        }
        AuthUser user = authService.getById(userId);
        String newAccess = tokenProvider.createAccessToken(user);
        setCookie(response, COOKIE_AUTH_TOKEN, newAccess, accessExpiryMinutes * 60);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), newAccess));
    }

    /** 현재 액세스 토큰으로 세션 연장 — 만료 직전(grace 기간)도 허용, 새 액세스 토큰 발급 */
    @PostMapping("/extend")
    public ResponseEntity<?> extend(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = getCookieValue(request, COOKIE_AUTH_TOKEN);
        if (accessToken == null) {
            accessToken = request.getHeader("Authorization");
            if (accessToken != null && accessToken.startsWith("Bearer ")) {
                accessToken = accessToken.substring(7);
            }
        }
        long graceMillis = extendGraceSeconds * 1000L;
        String userId = tokenProvider.validateAndGetUserIdWithExpiry(accessToken, graceMillis);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Token invalid or expired. Use /auth/refresh with refresh token."));
        }
        AuthUser user = authService.getById(userId);
        String newAccess = tokenProvider.createAccessToken(user);
        setCookie(response, COOKIE_AUTH_TOKEN, newAccess, accessExpiryMinutes * 60);
        return ResponseEntity.ok(new SignupResponse(user.getId(), user.getUsername(), newAccess));
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private void setCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
        String cookieValue = String.format(
                "%s=%s; Path=/; Domain=%s; HttpOnly; Max-Age=%d; SameSite=None; Secure",
                name, value, cookieDomain, maxAgeSeconds
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /** 쿠키 삭제 — Max-Age=0 및 Expires 과거일로 설정해 브라우저에서 즉시 제거 */
    private void clearCookie(HttpServletResponse response, String name) {
        String deleteCookie = String.format(
                "%s=; Path=/; Domain=%s; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure",
                name, cookieDomain
        );
        response.addHeader("Set-Cookie", deleteCookie);
    }
}
