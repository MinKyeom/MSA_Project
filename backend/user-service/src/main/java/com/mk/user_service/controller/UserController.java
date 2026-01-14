package com.mk.user_service.controller;

import com.mk.user_service.dto.UserResponse;
import com.mk.user_service.entity.User;
import com.mk.user_service.security.SecurityUtils;
import com.mk.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 추가 1.12
    // 아이디 중복 확인
    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(userService.existsByUsername(username));
    }

    /*
    흐름 이해
    1.SecurityUtils: "지금 로그인한 놈 ID가 뭐야?" → userId 획득

    2.userService: "DB에서 이 ID 가진 유저 정보 다 가져와" → user (엔티티, 모든 정보 포함)

    3.UserResponse.fromEntity(user): "자, 이 유저 정보 중에서 클라이언트한테 보여줄 이름이랑 이메일만 딱 골라서 예쁜 상자(DTO)에 담아줘."

    4.ResponseEntity.ok(...): "완성된 상자를 클라이언트에게 보내!"
     */
    // 현재 로그인 유저 정보 반환
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        // 토큰에서 추출된 ID를 사용하므로 클라이언트가 ID를 조작할 수 없음
        String userId = SecurityUtils.getAuthenticatedUserId();
        // 아이디 여부 찾기 검토
        User user = userService.findUserById(userId);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    // 실시간 닉네임 중복 체크
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(userService.existsByNickname(nickname));
    }

    @PostMapping("/api/users/nicknames")
    public ResponseEntity<Map<String, String>> getNicknamesByIds(@RequestBody List<String> userIds) {
        return ResponseEntity.ok(userService.getNicknamesByIds(userIds));
    }
}