from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, json, traceback
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate 
from langchain_core.output_parsers import PydanticOutputParser 

from db_utils import init_db, save_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session
from schemas import ChatPayload, AgentActionSchema
from prompts.chat_prompts import GITHUB_INFO, AGENT_SYSTEM_TEMPLATE

# 초기화
init_db()
app = FastAPI()

# CORS 설정
origins = ["https://minkowskim.com", "https://www.minkowskim.com", "http://localhost:3000", "http://localhost:8000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# 환경 변수 및 설정
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234") # 기본값 1234

try:
    llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY, temperature=0.2) if GROQ_API_KEY else None
except Exception as e:
    print(f"LLM 로드 에러: {e}")
    llm = None


@app.get("/chat/health")
@app.get("/health")
async def health():
    """Gateway/로드밸런서 헬스체크용. LLM 설정 여부만 반환."""
    return {"status": "ok", "llm_configured": llm is not None}


@app.post("/chat")
async def chat_endpoint(payload: ChatPayload):
    session_id = payload.session_id
    msg = payload.message
    session = get_session_data(session_id)

    # 1. 비밀번호 인증 단계 처리
    if session.get("is_verifying"):
        if msg.strip() == ADMIN_PASSWORD:
            pending = session.get("pending_data")
            if pending:
                save_info(pending['category'], pending['value'])
                response_text = f"✅ 본인 확인 완료! 요청하신 내용을 기억했습니다: {pending['value']}"
            else:
                response_text = "✅ 본인 확인이 완료되었습니다. 이제 자유롭게 이용하세요."
            
            session.update({"user_verified": True, "is_verifying": False, "pending_data": None})
            set_session_data(session_id, session)
        else:
            if "취소" in msg:
                session.update({"is_verifying": False, "pending_data": None})
                set_session_data(session_id, session)
                response_text = "인증이 취소되었습니다."
            else:
                response_text = "❌ 비밀번호가 틀렸습니다. 다시 입력하시거나 '취소'를 입력해주세요."
        
        append_chat_history(session_id, "AI", response_text)
        return {"response": response_text}

    # 2. 일반 대화 및 정보 조회 처리
    if not llm:
        return {"response": "챗봇 엔진(GROQ API)이 설정되지 않았습니다. GROQ_API_KEY를 확인해 주세요."}

    history_list = get_chat_history(session_id)
    history_text = "\n".join(history_list) if history_list else "이전 대화 없음"
    context_text = retrieve_context(msg) # DB 정보 우선 참조

    parser = PydanticOutputParser(pydantic_object=AgentActionSchema)
    agent_prompt = PromptTemplate(
        template=AGENT_SYSTEM_TEMPLATE,
        input_variables=["history", "context", "message", "github_info"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    try:
        agent_chain = agent_prompt | llm | parser
        action_result = agent_chain.invoke({
            "history": history_text,
            "context": context_text,
            "message": msg,
            "github_info": GITHUB_INFO # 블로그 정보 포함
        })
        
        if action_result.action == "save":
            if session.get("user_verified"):
                save_info(action_result.category, action_result.value)
                response_text = f"✅ (기억됨) {action_result.value}"
            else:
                session.update({
                    "is_verifying": True, 
                    "pending_data": {"category": action_result.category, "value": action_result.value}
                })
                set_session_data(session_id, session)
                response_text = "🔒 중요 정보를 저장하려면 본인 인증이 필요합니다. 비밀번호를 입력해주세요."
        else:
            response_text = action_result.value if action_result.value else "답변을 생성할 수 없습니다."

        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", response_text)
        return {"response": response_text}

    except Exception as e:
        traceback.print_exc()
        return {"response": "죄송합니다. 처리 중 오류가 발생했습니다."}

@app.post("/clear")
async def clear_chat(payload: ChatPayload):
    clear_session(payload.session_id)
    return {"message": "기록이 초기화되었습니다."}


# Gateway가 /chat/** 를 그대로 전달하므로 /chat/clear 요청도 처리 (동일 동작)
@app.post("/chat/clear")
async def clear_chat_under_chat(payload: ChatPayload):
    clear_session(payload.session_id)
    return {"message": "기록이 초기화되었습니다."}