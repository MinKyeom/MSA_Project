package com.mk.post_service.dto;

import com.mk.post_service.entity.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter 
@Setter
public class PostRequest {
    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    @Size(min = 1, max = 200, message = "제목은 1자 이상 200자 이하여야 합니다.")
    private String title;
    
    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    private String content;
    
    // 프론트엔드 JSON 객체의 키값과 일치시킴
    private String categoryName; 
    private List<String> tagNames;

    public Post toEntity() {
        Post post = new Post();
        post.setTitle(this.title);
        post.setContent(this.content);
        return post;
    }
}