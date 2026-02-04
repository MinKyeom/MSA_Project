// user 서버에 정보를 요청하기 위해 webclient 빈에 등록 후 서버 요청

package com.mk.post_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Post Service에서 외부 마이크로 서비스(예: User Service)와 통신하기 위한
 * WebClient.Builder Bean을 등록하는 설정 클래스
 */
@Configuration
public class WebClientConfig {
    
    /**
     * WebClient.Builder Bean 등록
     * 이를 통해 PostService 등에서 WebClient.Builder를 주입받아
     * 서비스 호출 시 기본 URL 및 설정을 재사용할 수 있습니다.
     * * @return WebClient.Builder 인스턴스
     */
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}