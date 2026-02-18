// src/components/Chatbot/Chatbot.jsx
"use client"; 

import React, { useState, useEffect, useRef } from "react";
import { sendChatMessage } from "../../services/api/chat"; 
import { useAuth } from "../../providers/AuthProvider"; 
import "./Chatbot.css"; 

export default function Chatbot({ setIsChatOpen }) { 
  // 채팅 메시지 상태: [{ role: 'user'/'assistant', text: 'message' }]
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { id: currentUserId, nickname: currentUserNickname } = useAuth();
  // 비로그인 시 'guest_user' 사용을 원칙으로 유지
  const sessionId = currentUserId || "guest_user"; 

  const messagesEndRef = useRef(null);
  
  // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 챗봇 팝업 닫기
  const handleClose = () => {
    setIsChatOpen(false);
  };

  // 채팅 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    // 사용자 메시지를 목록에 추가
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // API 호출
      const botResponse = await sendChatMessage(sessionId, userMessage);

      // 챗봇 응답을 목록에 추가
      setMessages((prev) => [...prev, { role: "assistant", text: botResponse }]);
    } catch (error) {
      console.error("챗봇 통신 중 오류 발생:", error);
      // 🌟 UI 텍스트 한국어 우선: 오류 메시지
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ 챗봇 서버와의 통신 중 오류가 발생했습니다." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 챗봇 UI 렌더링
  return (
    <div className="chatbot-container">
      {/* 헤더 */}
      <div className="chatbot-header">
        <h3 className="chatbot-title">
          <span className="chatbot-title-icon" aria-hidden="true">⟡</span>
          <span className="chatbot-title-mark">MinKowskiM</span>
          <span className="chatbot-title-sub">Assistant</span>
        </h3>
        <button className="chatbot-close-btn" onClick={handleClose}>
          ×
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="chatbot-welcome" role="note" aria-label="챗봇 안내">
            <div className="chatbot-welcome-title">
              궁금한 점을 물어보거나, 관심사·학습 노트를 가볍게 기록해보세요.
            </div>
            <div className="chatbot-welcome-body">
              {currentUserId ? (
                <>
                  <span className="chatbot-welcome-badge">로그인됨</span>{" "}
                  <strong>{currentUserNickname || currentUserId}</strong> 님으로 연결되어 있어요.
                </>
              ) : (
                <>
                  <span className="chatbot-welcome-badge ghost">비회원</span>{" "}
                  지금은 임시 세션입니다. 로그인하면 기록을 계속 이어갈 수 있어요.
                </>
              )}
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          // 마크다운 문법 대신 간단한 문자열 렌더링을 위해 Pre-wrap 스타일 사용
          <div key={index} className={`message-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message-bubble assistant loading">
            <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
          </div>
        )}
        {/* 스크롤 위치를 잡아주는 Ref */}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 폼 */}
      <form className="chatbot-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          // 🌟 UI 텍스트 한국어 우선: 메시지 입력...
          placeholder="메시지 입력..."
          disabled={isLoading}
        />
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {/* 🌟 UI 텍스트 한국어 우선: 전송 */}
          전송
        </button>
      </form>
    </div>
  );
}