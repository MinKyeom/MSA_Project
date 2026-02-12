// src/services/api/chat.js

import axios from "axios";

// ⭐ 수정: 환경 변수에서 챗봇 서버 URL을 가져오도록 변경
// .env.local 파일에 NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:5000/chat 와 같이 정의해야 함
const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL || "https://dev.minkowskim.com/chat";

/**
 * 챗봇과 대화 요청을 전송하는 함수
 * @param {string} session_id - 사용자의 고유 ID (인증된 경우 localStorage의 currentUserId 사용)
 * @param {string} message - 사용자 입력 메시지
 * @returns {Promise<string>} 챗봇의 응답 메시지 문자열
 */
export const sendChatMessage = async (session_id, message) => {
  try {
    const response = await axios.post(CHAT_API_URL, {
      session_id, // FastAPI에서 세션/기억 관리에 사용
      message,
    }, {
      timeout: 30000, // 챗봇 응답은 30초 타임아웃 (AI 처리 시간 고려)
      withCredentials: true, // ⭐ CORS 일관성 (쿠키 전송)
    });
    // FastAPI app.py에서 {response: "..."} 형태로 응답
    return response.data.response;
  } catch (error) {
    console.error("챗봇 API 통신 오류:", error);
    // 사용자에게 친화적인 오류 메시지를 반환합니다.
    return "챗봇 서버에 연결할 수 없거나, 통신 오류가 발생했습니다.";
  }
};
