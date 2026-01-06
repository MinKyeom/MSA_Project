package com.mk.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Getter @Setter
// Lombok Builder, NoArgsConstructor, AllArgsConstructor 추가 (UserController 사용 방식에 맞춤)
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
@Table(name = "USERS") // ⭐ 추가/수정: SQL 예약어 'USER' 충돌 방지를 위해 테이블 이름 명시
public class User {
    // String ID 사용 (UserRepository에 맞춤)
    @Id 
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id; 
    
    @Column(nullable = false, unique = true)
    private String username; 
    
    private String password;
    
    // ⭐ 닉네임 추가 및 UNIQUE 설정
    // 글 작성 시 ID 대신 해당 닉네임으로 작성자를 구성하기위해 unique 설정
    @Column(nullable = false, unique = true) 
    private String nickname; 

    // 권한 설정 관리자,일반 유저 
    @Enumerated(EnumType.STRING)
    private Role role;

    // ⭐ 이메일 필드 추가 (아이디/비밀번호 찾기 시 활용)
    @Column(nullable = false, unique = true)
    private String email;

    public enum Role { ROLE_USER, ROLE_ADMIN }
}