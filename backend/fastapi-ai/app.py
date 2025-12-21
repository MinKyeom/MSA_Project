from fastapi import FastAPI
import redis
import os 
from langchain_community.llms import CTransformers # CTransformers 임포트
from langchain_core.prompts import PromptTemplate 
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser 

# 유틸리티 함수 임포트 (변경 없음)
from db_utils import init_db, save_info, query_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session

# schemas.py에서 정의된 Pydantic 모델을 임포트 (변경 없음)
from schemas import ChatPayload, AgentActionSchema 

# -----------------------------
# 초기화
# -----------------------------
init_db() # SQLite DB 초기화

# 💡 Redis 연결 상태 확인 
try:
    redis_client_check = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    redis_client_check.ping()
    print("✅ Redis 서버 연결 성공. 세션 관리가 활성화됩니다.")
except redis.exceptions.ConnectionError:
    print("❌ Redis 서버에 연결할 수 없습니다. 세션 관리는 더미 객체로 동작합니다. Redis가 실행 중인지 확인해 주세요.")
    
# -----------------------------
# LLM 초기화 및 스키마 정의 (★★★ CTransformers로 변경 ★★★)
# -----------------------------
# CTransformers 설정
MODEL_PATH = "local_model.gguf" # 다운로드한 GGUF 파일 경로 (현재 폴더에 있어야 함)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"모델 파일이 없습니다. '{MODEL_PATH}' 파일을 다운로드하여 이 폴더에 저장해주세요.")

# 모델 설정 (CPU 기반 실행을 위한 기본 설정)
config_agent = {'max_new_tokens': 100, 'temperature': 0.1, 'context_length': 2048}
config_general = {'max_new_tokens': 512, 'temperature': 0.7, 'context_length': 4096}


# CTransformers LLM 초기화 (Action 판단용 - 온도 낮게)
llm_agent = CTransformers(
    model=MODEL_PATH, 
    model_type="mistral", # 사용한 모델에 따라 변경 (Nous-Hermes-2-Mistral-7B-DPO는 mistral 기반)
    config=config_agent
)

# CTransformers LLM 초기화 (일반 대화용 - 온도 높게)
llm_general = CTransformers(
    model=MODEL_PATH, 
    model_type="mistral", 
    config=config_general
) 

# Agent Action 판단용 Parser
parser = JsonOutputParser(pydantic_object=AgentActionSchema)
# 일반 대화용 Parser (텍스트 출력)
general_parser = StrOutputParser()

# -----------------------------
# FastAPI 시작
# -----------------------------
app = FastAPI()

# -----------------------------
# LLM 에이전트: 행동 판단 함수
# -----------------------------
def parse_user_action(message: str, history: list[str]) -> dict:
    """LLM에게 Pydantic 스키마를 사용하여 구조적 출력 강제"""
    
    # CTransformers LLM은 Chat 모델이 아니므로, System Prompt를 Prompt Template에 포함합니다.
    # LLM이 JSON을 잘 생성하도록 프롬프트에 명시적으로 지시
    sys_prompt_content = f"""
당신은 사용자의 메시지를 보고 행동(action)을 결정하는 전문 에이전트입니다.
당신의 역할은 사용자가 정보를 저장하려는지(action: 'save'), 조회하려는지(action: 'query'), 아니면 일반 대화(action: 'none')를 하려는지 판단하는 것입니다.
category는 'interest' 또는 'study'만 가능합니다.
반드시 아래 스키마에 따라 **정확히 JSON 형식**으로 응답해야 합니다. 다른 텍스트를 포함하지 마세요.

스키마:
{parser.get_format_instructions()}
"""

    prompt_template = PromptTemplate(
        template="{system_prompt}\n\n대화 기록:\n{conversation}\n사용자 입력:\n{message}",
        input_variables=["system_prompt", "conversation", "message"]
    )
    
    conversation = "\n".join(history)
    
    # LLM Chain: Prompt -> LLM (CTransformers) -> Parser (JSON)
    chain = prompt_template | llm_agent | parser

    try:
        # LLM 응답을 Pydantic 객체로 변환하고 dict로 반환
        return chain.invoke({
            "system_prompt": sys_prompt_content,
            "conversation": conversation,
            "message": message
        })
    except Exception as e:
        print(f"Agent Parsing Error: {e}")
        # 파싱 오류 시 안전하게 none action 반환
        return {"action": "none"}

@app.post("/chat")
def chat_endpoint(payload: ChatPayload):
    session_id = payload.session_id
    msg = payload.message.strip()

    session = get_session_data(session_id)
    append_chat_history(session_id, "user", msg)
    history = get_chat_history(session_id)
    
    # -----------------------------
    # ① 인증 요청/확인 로직
    # -----------------------------
    USER_VERIFY_CODE = "abcd"
    
    if session.get("saving_mode") and not session.get("user_verified"):
        if msg == USER_VERIFY_CODE:
            session["user_verified"] = True
            set_session_data(session_id, session)
            return {"response": "본인 인증 완료! 이제 정보를 입력하거나 '저장 끝'이라고 말씀해주세요."}
        elif msg in ["저장 끝", "취소"]:
            session["saving_mode"] = False
            session["user_verified"] = False
            set_session_data(session_id, session)
            return {"response": "저장 모드가 취소되었습니다."}
        else:
            return {"response": "정보 저장을 위해서는 먼저 본인 인증 코드를 입력해주세요."}

    # -----------------------------
    # ② LLM에게 행동(action) 판단 요청
    # -----------------------------
    agent_output = parse_user_action(msg, history)
    action = agent_output.get("action")
    category = agent_output.get("category")
    value = agent_output.get("value")

    # -----------------------------
    # ③ Action 실행
    # -----------------------------
    if action == "save":
        if not session.get("user_verified"):
            # 인증 안 되어 있으면 인증 모드로 전환 및 요청
            session["saving_mode"] = True
            set_session_data(session_id, session)
            return {"response": "정보 저장을 위해 먼저 본인 인증이 필요합니다. 'abcd'를 입력해주세요."}
            
        if category and value and category in ["interest", "study"]:
            save_info(category, value) # db_utils.save_info 사용
            append_chat_history(session_id, "assistant", f"사용자 정보 저장됨: {category}: {value}")
            return {"response": f"저장했습니다! -> 카테고리: {category}, 내용: {value}"}
        else:
            # save 의도는 있으나 카테고리/값이 불명확할 경우 일반 대화로 처리
            action = "none" 
            
    if action == "query":
        if category and category in ["interest", "study"]:
            rows = query_info(category) # db_utils.query_info 사용
            append_chat_history(session_id, "assistant", f"사용자 정보 조회됨: {category}")
            
            if rows:
                return {"response": f"당신의 '{category}' 정보는 다음과 같습니다: {', '.join(rows)}"}
            else:
                return {"response": f"'{category}'에 대한 저장된 정보가 없습니다."}
        else:
            # query 의도는 있으나 카테고리가 불명확할 경우 일반 대화로 처리
            action = "none" 

    if action == "none" and msg in ["저장 끝", "저장 완료"]:
        session["saving_mode"] = False
        session["user_verified"] = False
        set_session_data(session_id, session)
        return {"response": "정보 저장이 종료되었습니다."}
    
    # -----------------------------
    # ④ 일반 대화 (RAG 통합) 처리
    # -----------------------------
    if action in ["none", "other"]:
        # 💡 RAG 컨텍스트를 조회
        context = retrieve_context(msg) # db_utils.retrieve_context 사용
        
        # 일반 대화용 Prompt Template 정의
        general_prompt_template = PromptTemplate(
            template="""
당신은 친절한 AI 어시스턴트입니다. 다음 대화 기록과 사용자 입력에 대해 자연스럽게 응답하세요.
아래의 [DB Context]는 사용자에 대한 정보를 담고 있습니다. 사용자 관련 질문에 대해 이 정보를 활용하세요.

[DB Context]: 
{context}

대화 기록: {history}
사용자 입력: {msg}
""",
            input_variables=["context", "history", "msg"]
        )
        
        # LLM Chain: Prompt -> LLM (CTransformers) -> Parser (Str)
        chain = general_prompt_template | llm_general | general_parser

        try:
            res = chain.invoke({
                "context": context if context else '저장된 정보 없음',
                "history": "\n".join(history),
                "msg": msg
            })
            response_text = res.strip()
            append_chat_history(session_id, "assistant", response_text)
            return {"response": response_text}
        except Exception as e:
            print(f"General LLM Error: {e}")
            return {"response": "죄송합니다. 지금은 대화 처리가 어렵습니다."}

    return {"response": "무슨 말인지 잘 모르겠어요."}