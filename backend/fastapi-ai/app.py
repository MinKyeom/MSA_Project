from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis, os, json, time, re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate 
from langchain_core.output_parsers import PydanticOutputParser 

from db_utils import init_db, save_info, query_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session
from schemas import ChatPayload, AgentActionSchema 

# DB 초기화
init_db()
app = FastAPI()

# CORS 설정
origins = ["https://minkowskim.com", "https://www.minkowskim.com", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# 환경 변수에서 Gemini API 키 로드
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

try:
    # Gemini 모델 설정
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.1,
        max_output_tokens=256
    )
    print("✅ Gemini 에이전트 모델 로드 완료")
except Exception as e:
    print(f"❌ Gemini 로드 실패: {e}")
    llm = None

# 의도 분석을 위한 파서 설정
parser = PydanticOutputParser(pydantic_object=AgentActionSchema)
ADMIN_PASSWORD = "나인걸인증" 

@app.post("/chat")
async def chat(payload: ChatPayload):
    msg = payload.message.strip()
    session_id = payload.session_id

    # Redis에서 인증 상태를 포함한 세션 데이터 로드
    session = get_session_data(session_id)
    
    # [1] 관리자 인증 처리
    if msg == ADMIN_PASSWORD:
        session["user_verified"] = True
        set_session_data(session_id, session)
        return {"response": "인증에 성공했습니다. 이제 말씀하시는 관심사나 공부 내용을 자동으로 분류하여 저장합니다."}

    if llm is None:
        return {"response": "서버의 Gemini API 키 설정을 확인해 주세요."}

    # [2] 에이전트 의도 판단 프롬프트
    agent_prompt = PromptTemplate(
        template="""당신은 사용자의 대화를 분석하여 시스템 행동을 결정하는 관리 에이전트입니다.
사용자의 메시지를 분석하여 다음 행동 중 하나를 선택하고 JSON 형식으로 답변하세요.

1. save: 사용자가 자신의 관심사, 공부하고 있는 것, 좋아하는 것을 말하며 기억해달라고 할 때
2. query: 사용자가 이전에 저장했던 정보에 대해 물어볼 때 (예: '내 관심사 뭐야?')
3. none: 그 외 일반적인 대화, 인사, 잡담일 때

카테고리는 반드시 'interest' 또는 'study' 중 하나여야 합니다.

{format_instructions}

사용자 메시지: {message}""",
        input_variables=["message"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    try:
        # 에이전트가 의도 판단
        agent_chain = agent_prompt | llm | parser
        action_result = agent_chain.invoke({"message": msg})
        
        response_text = ""
        
        # [3] 판단 결과에 따른 로직 실행
        if action_result.action == "save":
            # 인증된 상태일 때만 실제 DB 저장 수행
            if session.get("user_verified"):
                save_info(action_result.category, action_result.value)
                response_text = f"알겠습니다. {action_result.category} 카테고리에 '{action_result.value}' 내용을 저장했습니다."
            else:
                # 인증되지 않았다면 저장하지 않고 일반 답변
                context = retrieve_context(msg)
                response_text = await generate_response(msg, context)
        
        elif action_result.action == "query":
            # DB 조회 후 답변 생성
            context = retrieve_context(msg)
            response_text = await generate_response(msg, context)
            
        else:
            # 일반 대화
            context = retrieve_context(msg)
            response_text = await generate_response(msg, context)

        # 대화 기록 기록
        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", response_text)
        
        return {"response": response_text}

    except Exception as e:
        print(f"Agent Logic Error: {e}")
        return {"response": "죄송합니다. 요청을 처리하는 중에 문제가 발생했습니다."}

async def generate_response(msg, context):
    """최종 답변 생성을 위한 보조 함수"""
    prompt = PromptTemplate(
        template="""당신은 친절한 한국어 AI 비서입니다. 제공된 지식을 바탕으로 질문에 짧고 친절하게 한 문장으로 답하세요.
지식에 없는 내용이라면 자연스럽게 대화를 이어가세요.

### 지식: {context}
### 질문: {msg}
### 답변:""",
        input_variables=["context", "msg"]
    )
    chain = prompt | llm | (lambda x: x.content)
    return chain.invoke({"context": context if context else "저장된 정보 없음", "msg": msg})