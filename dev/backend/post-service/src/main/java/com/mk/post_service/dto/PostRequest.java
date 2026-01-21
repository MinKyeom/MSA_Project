package com.mk.post_service.dto;

import com.mk.post_service.entity.Post;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter 
@Setter
public class PostRequest {
    private String title;
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