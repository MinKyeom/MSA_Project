package com.mk.post_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@Builder
@NoArgsConstructor // ⭐ AccessLevel.PROTECTED 제거 (Public으로 변경)
@AllArgsConstructor
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @JsonIgnore 
    @OneToMany(mappedBy = "category")
    private List<Post> posts = new ArrayList<>();
}