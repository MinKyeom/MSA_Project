package com.mk.post_service.controller;

import com.mk.post_service.dto.PostRequest;
import com.mk.post_service.dto.PostResponse;
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