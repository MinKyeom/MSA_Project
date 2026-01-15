package com.mk.user_service.kafka;

import com.mk.user_service.dto.UserCreatedEvent;
import com.mk.user_service.entity.User;
import com.mk.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserConsumer {

    private final UserRepository userRepository;

    @Transactional
    @KafkaListener(topics = "user-created-topic", groupId = "user-service-group")
    public void consumeUserCreated(UserCreatedEvent event) {
        
        // 이미 존재하는 회원인지 확인하여 중복 저장 방지
        if (userRepository.existsById(event.getId())) {
            log.info("User already exists: {}", event.getId());
            return;
        }
        
        log.info("Kafka Consumer - Received user-created event for user: {}", event.getUsername());
        
        try {
            User user = User.builder()
                    .id(event.getId())
                    .username(event.getUsername())
                    .nickname(event.getNickname())
                    .email(event.getEmail())
                    .build();
            
            userRepository.save(user);
            log.info("User-Service DB - Successfully saved user profile: {}", event.getId());
        } catch (Exception e) {
            log.error("Error saving user profile to User-Service DB: {}", e.getMessage());
            // 에러 발생 시 Kafka 재시도 전략에 따라 처리 가능
        }
    }
}