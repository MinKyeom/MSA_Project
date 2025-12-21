package com.mk.post_service.service;

import com.mk.post_service.dto.*;
import com.mk.post_service.entity.*;
import com.mk.post_service.repository.*;
import org.springframework.core.ParameterizedTypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class PostService {
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final WebClient webClient;

    @Value("${user-service.url:http://localhost:8081}")
    private String userServiceUrl;

    public PostService(
            PostRepository postRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            WebClient.Builder webClientBuilder
    ) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.webClient = webClientBuilder.build();
    }

    public PostResponse createPost(PostRequest request, String authorId) {
        Post post = request.toEntity();
        post.setAuthorId(authorId);

        if (request.getCategoryName() != null && !request.getCategoryName().isEmpty()) {
            Category category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> {
                        Category newCat = new Category();
                        newCat.setName(request.getCategoryName());
                        return categoryRepository.save(newCat);
                    });
            post.setCategory(category);
        }

        if (request.getTagNames() != null) {
            Set<Tag> tags = request.getTagNames().stream()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> {
                                Tag newTag = new Tag();
                                newTag.setName(name);
                                return tagRepository.save(newTag);
                            }))
                    .collect(Collectors.toSet());
            post.setTags(tags);
        }

        Post savedPost = postRepository.save(post);
        return getPostById(savedPost.getId());
    }

    public PostResponse updatePost(Long id, PostRequest request, String authenticatedUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthorId().equals(authenticatedUserId)) {
            throw new RuntimeException("게시글 수정 권한이 없습니다.");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        if (request.getCategoryName() != null) {
            Category category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> {
                        Category newCat = new Category();
                        newCat.setName(request.getCategoryName());
                        return categoryRepository.save(newCat);
                    });
            post.setCategory(category);
        }

        if (request.getTagNames() != null) {
            post.getTags().clear();
            Set<Tag> tags = request.getTagNames().stream()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> {
                                Tag newTag = new Tag();
                                newTag.setName(name);
                                return tagRepository.save(newTag);
                            }))
                    .collect(Collectors.toSet());
            post.getTags().addAll(tags);
        }

        return getPostById(id);
    }

    public void deletePost(Long id, String authenticatedUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        if (!post.getAuthorId().equals(authenticatedUserId)) {
            throw new RuntimeException("게시글 삭제 권한이 없습니다.");
        }
        postRepository.delete(post);
    }

    @Transactional(readOnly = true) // 오타 수정: readStreamOnly -> readOnly
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(post.getAuthorId()));
        PostResponse response = PostResponse.fromEntity(post);
        response.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "알 수 없음"));
        return response;
    }

    public Page<PostResponse> getAllPosts(Pageable pageable) {
        Page<Post> postPage = postRepository.findAll(pageable);
        return mapPostPageToResponse(postPage);
    }

    public Page<PostResponse> getPostsByCategory(String categoryName, Pageable pageable) {
        // Repository 메서드명과 일치됨: findByCategoryName
        Page<Post> postPage = postRepository.findByCategoryName(categoryName, pageable); 
        return mapPostPageToResponse(postPage);
    }

    public Page<PostResponse> getPostsByTag(String tagName, Pageable pageable) {
        // Repository 메서드명과 일치됨: findByTagsName
        Page<Post> postPage = postRepository.findByTagsName(tagName, pageable);
        return mapPostPageToResponse(postPage);
    }

    public List<CategoryResponse> getAllCategoriesWithCount() {
        return categoryRepository.findAll().stream()
                .map(cat -> CategoryResponse.fromEntity(cat, postRepository.countByCategory(cat)))
                .collect(Collectors.toList());
    }

    public List<TagResponse> getAllTagsWithCount() {
        return tagRepository.findAll().stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getName())
                        .postCount(postRepository.countByTags(tag)) // Repository의 countByTags와 일치
                        .build())
                .collect(Collectors.toList());
    }

    private Page<PostResponse> mapPostPageToResponse(Page<Post> postPage) {
        List<String> authorIds = postPage.stream()
                .map(Post::getAuthorId)
                .distinct()
                .collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        return postPage.map(post -> {
            PostResponse res = PostResponse.fromEntity(post);
            res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "알 수 없음"));
            return res;
        });
    }

    private Map<String, String> getAuthorNicknamesMap(List<String> authorIds) {
        if (authorIds.isEmpty()) return Collections.emptyMap();
        try {
            return webClient.post()
                    .uri(userServiceUrl + "/api/users/nicknames")
                    .bodyValue(authorIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                    .block(); // 외부 통신 (동기 방식 유지)
        } catch (Exception e) {
            log.error("User Service 통신 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}