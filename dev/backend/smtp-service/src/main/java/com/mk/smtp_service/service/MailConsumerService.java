package com.mk.smtp_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailConsumerService {

    private final JavaMailSender mailSender;

    /**
     * user-service의 "mail-topic"을 리스닝합니다.
     */
    @KafkaListener(topics = "mail-topic", groupId = "mail-group")
    public void consume(Map<String, String> message) {
        String email = message.get("email");
        String code = message.get("code");
        String type = message.get("type"); // SIGNUP 등

        log.info("Kafka 메시지 수신 완료: 수신자={}, 인증번호={}", email, code);

        try {
            sendVerificationMail(email, code);
        } catch (Exception e) {
            log.error("이메일 발송 중 기술적 오류 발생: {}", e.getMessage());
        }
    }

    private void sendVerificationMail(String toEmail, String code) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(toEmail);
        mailMessage.setSubject("[MK 서비스] 회원가입 인증번호 안내");
        mailMessage.setText("안녕하세요.\n\n요청하신 인증번호는 [" + code + "] 입니다.\n" +
                           "인증 페이지로 돌아가 5분 이내에 입력해 주세요.\n\n감사합니다.");

        mailSender.send(mailMessage);
        log.info("이메일 발송 성공: {}", toEmail);
    }
}