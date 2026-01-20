package com.mk.user_service.entity;

import jakarta.persistence.*;
import lombok.*;

// 비밀번호는 이제 auth-service에 저장
@Entity
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    private String id; // Auth-Service에서 생성된 UUID를 할당받음

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String email;
}