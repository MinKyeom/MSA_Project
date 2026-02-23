package com.mk.post_service.service;

import com.mk.post_service.dto.*;
import com.mk.post_service.entity.*;
import com.mk.post_service.event.PostEventPayload;
import com.mk.post_service.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class PostService {
    private static final String TOPIC_POST_EVENTS = "post.events";

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final WebClient webClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${USER_SERVICE_URL:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${search.service.url:http://msa-search:8010}")
    private String searchServiceUrl;

    public PostService(
            PostRepository postRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            WebClient.Builder webClientBuilder,
            KafkaTemplate<String, Object> kafkaTemplate
    ) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.webClient = webClientBuilder.build();
        this.kafkaTemplate = kafkaTemplate;
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

        // Search 서비스 임베딩 인덱싱: Kafka 발행 + 즉시 HTTP 인덱싱(검색 지연 방지)
        publishPostEvent(savedPost.getId(), savedPost.getTitle(), savedPost.getContent());
        syncSearchIndex(savedPost.getId(), savedPost.getTitle(), savedPost.getContent());

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

        // Search 서비스 갱신: Kafka 발행 + 즉시 HTTP 인덱싱
        publishPostEvent(post.getId(), post.getTitle(), post.getContent());
        syncSearchIndex(post.getId(), post.getTitle(), post.getContent());

        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public void deletePost(Long id, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        Category categoryToCheck = post.getCategory();
        Set<Tag> tagsToCheck = post.getTags() != null ? new HashSet<>(post.getTags()) : Collections.emptySet();
        postRepository.delete(post);
        removeSearchIndex(id);
        if (categoryToCheck != null && postRepository.countByCategory(categoryToCheck) == 0) {
            categoryRepository.delete(categoryToCheck);
        }
        for (Tag tag : tagsToCheck) {
            if (postRepository.countByTags(tag) == 0) {
                tagRepository.delete(tag);
            }
        }
    }

    /** 포스트 삭제 시 검색 서비스 인덱스에서 제거 */
    private void removeSearchIndex(Long postId) {
        try {
            webClient.delete()
                .uri(searchServiceUrl + "/api/search/index/" + postId)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(e -> {
                    log.warn("Search index 삭제 실패 (postId={}): {}", postId, e.getMessage());
                    return Mono.empty();
                })
                .subscribe();
        } catch (Exception e) {
            log.warn("Search index 삭제 요청 실패 (postId={}): {}", postId, e.getMessage());
        }
    }

    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
        post.setViewCount((post.getViewCount() == null ? 0L : post.getViewCount()) + 1L);
        postRepository.save(post);

        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(post.getAuthorId()));
        res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
        return res;
    }

    /** 조회수 기준 인기글 상위 N개 (메인 페이지용) */
    public List<PostResponse> getTopPopularPosts(int limit) {
        if (limit <= 0) return Collections.emptyList();
        List<Post> top = postRepository.findTopByViewCount(org.springframework.data.domain.PageRequest.of(0, limit));
        List<String> authorIds = top.stream().map(Post::getAuthorId).distinct().collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        return top.stream()
                .map(post -> {
                    PostResponse res = PostResponse.fromEntity(post);
                    res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
                    return res;
                })
                .collect(Collectors.toList());
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

    /** Search 서비스가 소비하는 post.events 토픽으로 발행 (임베딩 인덱싱) */
    private void publishPostEvent(Long postId, String title, String content) {
        try {
            kafkaTemplate.send(TOPIC_POST_EVENTS, String.valueOf(postId),
                PostEventPayload.builder()
                    .postId(postId)
                    .title(title)
                    .content(content != null ? content : "")
                    .build());
        } catch (Exception e) {
            log.warn("Kafka post.events 발행 실패 (postId={}): {}", postId, e.getMessage());
        }
    }

    /** 포스트 저장/수정 직후 검색 서비스에 동기 인덱싱 요청 (글 작성 후 검색 즉시 반영) */
    private void syncSearchIndex(Long postId, String title, String content) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("postId", postId);
            body.put("title", title != null ? title : "");
            body.put("content", content != null ? content : "");
            webClient.post()
                .uri(searchServiceUrl + "/api/search/index")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(8))
                .onErrorResume(e -> {
                    log.warn("Search sync index 실패 (postId={}): {}", postId, e.getMessage());
                    return Mono.empty();
                })
                .subscribe();
        } catch (Exception e) {
            log.warn("Search sync index 요청 실패 (postId={}): {}", postId, e.getMessage());
        }
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