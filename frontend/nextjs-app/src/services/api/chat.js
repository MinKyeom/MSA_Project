// src/services/api/chat.js

import axios from "axios";

// ⭐ 수정: 환경 변수에서 챗봇 서버 URL을 가져오도록 변경
// .env.local 파일에 NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:5000/chat 와 같이 정의해야 함
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || "https://minkowskim.com/chat";

/**
 * 챗봇과 대화 요청을 전송하는 함수
 * @param {string} session_id - 사용자의 고유 ID (인증된 경우 localStorage의 currentUserId 사용)
 * @param {string} message - 사용자 입력 메시지
 * @returns {Promise<string>} 챗봇의 응답 메시지 문자열
 */
export const sendChatMessage = async (session_id, message) => {
  try {
    const response = await axios.post(
      CHAT_API_URL,
      { session_id, message },
      {
        timeout: 60000, // AI 응답 대기 60초
        validateStatus: () => true, // 4xx/5xx도 throw 없이 받기
      }
    );
    if (response.status !== 200) {
      console.error("챗봇 API 오류:", response.status, response.data);
      return `챗봇 서버 오류 (${response.status}). 잠시 후 다시 시도해 주세요.`;
    }
    return response.data?.response ?? "응답을 받지 못했습니다.";
  } catch (error) {
    const status = error.response?.status;
    const msg = error.message || "";
    console.error("챗봇 API 통신 오류:", status, msg, error.response?.data);
    if (status === 502) {
      return "챗봇 서버(502)에 연결할 수 없습니다. 서버에서 API Gateway와 챗봇 서비스가 실행 중인지 확인해 주세요.";
    }
    if (status === 504 || msg.includes("timeout")) {
      return "응답 대기 시간이 초과되었습니다. 다시 시도해 주세요.";
    }
    return "챗봇 서버에 연결할 수 없거나, 통신 오류가 발생했습니다.";
  }
};