package com.mk.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "auth_users")
public class AuthUser {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String username;

    /** 비밀번호 — OAuth 전용 사용자는 null 가능(로그인 불가 대신 OAuth만 사용) */
    @Column
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    /** OAuth 제공자: LOCAL(이메일 가입/로그인), GOOGLE, KAKAO */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    private AuthProvider authProvider;

    /** OAuth 제공자별 고유 식별자 (예: Google sub, Kakao id) */
    @Column(name = "provider_subject_id")
    private String providerSubjectId;

    public enum Role {
        ROLE_USER, ROLE_ADMIN
    }

    public enum AuthProvider {
        LOCAL, GOOGLE, KAKAO
    }
}