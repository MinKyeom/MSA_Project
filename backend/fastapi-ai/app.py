from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis, os, json, time, re
# Google Gemini 연동 라이브러리
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate 
from langchain_core.output_parsers import PydanticOutputParser 

from db_utils import init_db, save_info, query_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session
from schemas import ChatPayload, AgentActionSchema 

# 데이터베이스 및 테이블 초기화
init_db()
app = FastAPI()

# CORS 설정: 프론트엔드 도메인 및 로컬 환경 허용
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
    # 모델명 오류 수정을 위해 'models/' 접두사 추가
    # 404 에러 방지를 위한 가장 안정적인 호출 방식입니다.
    llm = ChatGoogleGenerativeAI(
        model="models/gemini-1.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.1,  # 판단의 정확도를 위해 낮게 설정
        max_output_tokens=256
    )
    print("✅ Gemini 에이전트 모델 로드 완료")
except Exception as e:
    print(f"❌ Gemini 로드 실패: {e}")
    llm = None

# 구조화된 데이터 출력을 위한 파서 설정
parser = PydanticOutputParser(pydantic_object=AgentActionSchema)

# 관리자 인증을 위한 고정 비밀번호
ADMIN_PASSWORD = "나인걸인증" 

@app.post("/chat")
async def chat(payload: ChatPayload):
    msg = payload.message.strip()
    session_id = payload.session_id

    # Redis에서 세션 정보 가져오기 (인증 상태 user_verified 포함)
    session = get_session_data(session_id)
    
    # [1] 관리자 인증 로직 (최우선 처리)
    if msg == ADMIN_PASSWORD:
        session["user_verified"] = True
        set_session_data(session_id, session)
        return {"response": "인증에 성공했습니다. 이제 말씀하시는 관심사나 공부 내용을 자동으로 분류하여 저장합니다."}

    # API 키가 없거나 모델 로드 실패 시 대응
    if llm is None:
        return {"response": "서버의 Gemini API 키 설정이 올바르지 않습니다. 관리자에게 문의하세요."}

    # [2] 에이전트 의도 판단 프롬프트
    # 사용자의 말을 분석해 save(저장), query(조회), none(일반대화) 중 하나를 결정합니다.
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
        # LLM을 통한 의도 분석 실행
        agent_chain = agent_prompt | llm | parser
        action_result = agent_chain.invoke({"message": msg})
        
        response_text = ""
        
        # [3] 에이전트 판단 결과에 따른 처리
        if action_result.action == "save":
            # "나인걸인증"이 된 세션일 때만 실제로 DB에 저장
            if session.get("user_verified"):
                save_info(action_result.category, action_result.value)
                response_text = f"알겠습니다. {action_result.category} 카테고리에 '{action_result.value}' 내용을 기억했습니다."
            else:
                # 인증되지 않은 사용자가 저장 요청을 할 경우, 저장하지 않고 답변만 생성
                context = retrieve_context(msg)
                response_text = await generate_gemini_response(msg, context)
        
        elif action_result.action == "query":
            # DB 컨텍스트를 조회하여 답변 생성
            context = retrieve_context(msg)
            response_text = await generate_gemini_response(msg, context)
            
        else:
            # 일반 대화 (none 판단 시)
            context = retrieve_context(msg)
            response_text = await generate_gemini_response(msg, context)

        # 대화 기록 Redis 저장
        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", response_text)
        
        return {"response": response_text}

    except Exception as e:
        print(f"Agent Logic Error: {e}")
        # 에러 발생 시(예: 404, 500) 사용자에게 예외 메시지 전달
        return {"response": "죄송합니다. 서비스 이용 중 일시적인 오류가 발생했습니다."}

async def generate_gemini_response(msg, context):
    """최종 대화형 답변을 생성하는 보조 함수"""
    prompt = PromptTemplate(
        template="""당신은 친절한 한국어 AI 비서입니다. 제공된 지식을 바탕으로 질문에 짧고 친절하게 한 문장으로 답하세요.
지식에 없는 내용이라면 자연스럽게 대화를 이어가세요.

### 지식: {context}
### 질문: {msg}
### 답변:""",
        input_variables=["context", "msg"]
    )
    # chain 구성: 프롬프트 -> 모델 -> 텍스트 결과값 추출
    chain = prompt | llm | (lambda x: x.content)
    return chain.invoke({"context": context if context else "저장된 정보 없음", "msg": msg})