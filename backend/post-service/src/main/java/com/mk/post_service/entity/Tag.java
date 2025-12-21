package com.mk.post_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter
@Builder
@NoArgsConstructor // ⭐ AccessLevel.PROTECTED 제거 (Public으로 변경)
@AllArgsConstructor
public class Tag {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @JsonIgnore
    @ManyToMany(mappedBy = "tags")
    private Set<Post> posts = new HashSet<>();
}