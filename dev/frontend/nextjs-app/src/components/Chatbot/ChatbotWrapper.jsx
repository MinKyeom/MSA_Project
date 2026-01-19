// src/components/Chatbot/ChatbotWrapper.jsx 
// Client Component

"use client"; 

import { useState } from "react"; 
import Chatbot from "./Chatbot"; 

const ChatbotWrapper = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 챗봇 토글 함수
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <>
      {/* 챗봇 팝업 */}
      {isChatOpen && <Chatbot setIsChatOpen={setIsChatOpen} />}

      {/* 챗봇 플로팅 버튼 */}
      <button
        className="chatbot-float-btn btn-primary"
        onClick={toggleChat}
        // 🌟 UI 텍스트 한국어 우선: 챗봇 닫기/열기
        aria-label={isChatOpen ? "챗봇 닫기" : "챗봇 열기"} 
      >
        {isChatOpen ? "×" : "🤖"}
      </button>
    </>
  );
};

export default ChatbotWrapper;