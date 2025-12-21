package com.mk.post_service.dto;

import com.mk.post_service.entity.Post;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter @Setter
public class PostResponse {
    private Long id;
    private String title;
    private String content; 
    private String authorId; // ⭐ 추가: Post Entity의 authorId를 담을 필드
    private String authorNickname; 
    private LocalDateTime createdAt;
    
    private String categoryName; 
    private List<String> tagNames; 

    public static PostResponse fromEntity(Post post) {
        PostResponse dto = new PostResponse();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent()); 
        
        // ⭐ 수정: Post.user를 참조하지 않고 authorId를 설정
        dto.setAuthorId(post.getAuthorId());
        // dto.setAuthorNickname(...) // 닉네임은 Service Layer에서 외부 통신으로 채워짐
        
        dto.setCreatedAt(post.getCreatedAt());

        if (post.getCategory() != null) {
            dto.setCategoryName(post.getCategory().getName());
        }
        
        dto.setTagNames(post.getTags().stream()
                                    .map(tag -> tag.getName())
                                    .collect(Collectors.toList()));
        return dto;
    }
}