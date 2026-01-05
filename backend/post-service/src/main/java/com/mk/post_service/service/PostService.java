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

    @Value("${USER_SERVICE_URL:http://localhost:8081}")
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

    public PostResponse createPost(PostRequest request, String authenticatedUserId) {
        Post post = request.toEntity();
        post.setAuthorId(authenticatedUserId);

        if (request.getCategoryName() != null) {
            Category category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> categoryRepository.save(Category.builder().name(request.getCategoryName()).build()));
            post.setCategory(category);
        }

        if (request.getTagNames() != null) {
            Set<Tag> tags = request.getTagNames().stream()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build())))
                    .collect(Collectors.toSet());
            post.setTags(tags);
        }

        Post savedPost = postRepository.save(post);
        PostResponse res = PostResponse.fromEntity(savedPost);
        
        // 작성자 닉네임 설정
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public PostResponse updatePost(Long id, PostRequest request, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        if (request.getCategoryName() != null) {
            Category category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> categoryRepository.save(Category.builder().name(request.getCategoryName()).build()));
            post.setCategory(category);
        }

        if (request.getTagNames() != null) {
            Set<Tag> tags = request.getTagNames().stream()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build())))
                    .collect(Collectors.toSet());
            post.setTags(tags);
        }

        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public void deletePost(Long id, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        postRepository.delete(post);
    }

    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
        
        PostResponse res = PostResponse.fromEntity(post);
        
        // ⭐ 수정 포인트: 상세 조회 시에도 외부 서비스와 통신하여 닉네임을 가져옴
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(post.getAuthorId()));
        res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
        
        return res;
    }

    // public Page<PostResponse> getAllPosts(Pageable pageable) {
    //     return mapPostPageToResponse(postRepository.findAll(pageable));
    // }
    public Page<PostResponse> getAllPosts(Pageable pageable) {
        return mapPostPageToResponse(postRepository.findAllWithDetails(pageable)); // 명칭 변경
    }


    public Page<PostResponse> getPostsByCategory(String categoryName, Pageable pageable) {
        return mapPostPageToResponse(postRepository.findByCategoryName(categoryName, pageable));
    }

    public Page<PostResponse> getPostsByTag(String tagName, Pageable pageable) {
        return mapPostPageToResponse(postRepository.findByTagsName(tagName, pageable));
    }

    public List<CategoryResponse> getAllCategoriesWithCount() {
        return categoryRepository.findAll().stream()
                .map(category -> CategoryResponse.fromEntity(category, postRepository.countByCategory(category)))
                .collect(Collectors.toList());
    }

    public List<TagResponse> getAllTagsWithCount() {
        return tagRepository.findAll().stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getName())
                        .postCount(postRepository.countByTags(tag))
                        .build())
                .collect(Collectors.toList());
    }

    private Page<PostResponse> mapPostPageToResponse(Page<Post> postPage) {
        log.info("조회된 게시글 개수: {}", postPage.getContent().size());
        List<String> authorIds = postPage.stream()
                .map(Post::getAuthorId)
                .distinct()
                .collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        log.info("가져온 닉네임 맵: {}", nicknameMap);

        return postPage.map(post -> {
            PostResponse res = PostResponse.fromEntity(post);
            res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
            return res;
        });
    }

    private Map<String, String> getAuthorNicknamesMap(List<String> authorIds) {
        if (authorIds.isEmpty()) return Collections.emptyMap();
        try {
            return webClient.post()
                    .uri(userServiceUrl + "/user/api/users/nicknames")
                    .bodyValue(authorIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                    .timeout(java.time.Duration.ofSeconds(2)) // 2초 타임아웃 추가
                    .onErrorReturn(Collections.emptyMap())    // 실패 시 빈 값 반환
                    .block();
        } catch (Exception e) {
            log.error("User Service 통신 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}