package com.mk.post_service.controller;

import com.mk.post_service.dto.PostRequest;
import com.mk.post_service.dto.PostResponse;
import com.mk.post_service.dto.PostSearchResultDto;
import com.mk.post_service.dto.CategoryResponse;
import com.mk.post_service.dto.TagResponse;
import com.mk.post_service.service.PostService;
import com.mk.post_service.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public PostResponse createPost(@RequestBody PostRequest request) {
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new org.springframework.security.access.AccessDeniedException("포스트 작성 권한은 관리자만 있습니다.");
        }
        return postService.createPost(request, authenticatedUserId);
    }

    @PutMapping("/{id}")
    public PostResponse updatePost(@PathVariable Long id, @RequestBody PostRequest request) {
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        return postService.updatePost(id, request, authenticatedUserId);
    }

    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable Long id) {
        String authenticatedUserId = SecurityUtils.getAuthenticatedUserId();
        postService.deletePost(id, authenticatedUserId);
    }

    @GetMapping("/popular")
    public List<PostResponse> getPopularPosts(@RequestParam(defaultValue = "3") int limit) {
        return postService.getTopPopularPosts(Math.min(limit, 10));
    }

    /** 키워드(SQL) 검색 — 하이브리드 검색용. 제목·본문 LIKE 검색. */
    @GetMapping("/search")
    public java.util.Map<String, Object> searchByKeyword(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit) {
        java.util.List<PostSearchResultDto> results = postService.searchByKeyword(q, limit);
        return java.util.Map.of(
            "query", q,
            "results", results.stream()
                .map(dto -> java.util.Map.of(
                    "postId", dto.getPostId(),
                    "title", dto.getTitle() != null ? dto.getTitle() : "",
                    "snippet", dto.getSnippet() != null ? dto.getSnippet() : "",
                    "score", 1.0
                ))
                .collect(java.util.stream.Collectors.toList())
        );
    }

    @GetMapping("/{id}")
    public PostResponse getPost(@PathVariable Long id) {
        return postService.getPostById(id);
    }

    @GetMapping
    public Page<PostResponse> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Pageable pageable = PageRequest.of(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        // return postService.getAllPosts(pageable);
        return postService.getAllPosts(pageable);
    }

    @GetMapping("/category")
    public Page<PostResponse> getPostsByCategory(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return postService.getPostsByCategory(name, pageable);
    }

    @GetMapping("/tag")
    public Page<PostResponse> getPostsByTag(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return postService.getPostsByTag(name, pageable);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategoriesListWithCount() {
        return postService.getAllCategoriesWithCount();
    }

    @GetMapping("/tags")
    public List<TagResponse> getTagsListWithCount() {
        return postService.getAllTagsWithCount();
    }
}