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

      {/* 챗봇 플로팅 버튼 — MinKowskiM 이니셜 M */}
      <button
        className="chatbot-float-btn btn-primary"
        onClick={toggleChat}
        aria-label={isChatOpen ? "챗봇 닫기" : "챗봇 열기"}
      >
        {isChatOpen ? "×" : <span className="chatbot-float-initial">M</span>}
      </button>
    </>
  );
};

export default ChatbotWrapper;