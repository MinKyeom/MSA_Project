from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis, os, json, time, re
from langchain_community.llms import LlamaCpp
from langchain_core.prompts import PromptTemplate 
from langchain_core.output_parsers import StrOutputParser 

from db_utils import init_db, save_info, query_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session
from schemas import ChatPayload

init_db()
app = FastAPI()

origins = ["https://minkowskim.com", "https://www.minkowskim.com", "http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

MODEL_PATH = "local_model.gguf" 

try:
    llm_general = LlamaCpp(
        model_path=MODEL_PATH,
        temperature=0.3,      # 언어 혼란을 줄이기 위해 온도를 낮춤
        max_tokens=64,        # 불필요한 사족 방지
        n_ctx=512,            # 컨텍스트를 줄여 집중도 향상
        n_batch=32,
        n_threads=4,
        f16_kv=True,
        repeat_penalty=2.0,   # 반복 및 패턴 고착 방지
        top_p=0.5,            # 가장 확실한 단어만 선택하도록 제한
        stop=["사용자:", "User:", "###", "\n", "Football", "오전"], # 이상 징후 단어 차단
        verbose=False
    )
    print("✅ LlamaCpp 모델 로드 완료")
except Exception as e:
    llm_general = None

general_parser = StrOutputParser()
ADMIN_PASSWORD = "나인걸인증" 

@app.post("/chat")
async def chat(payload: ChatPayload):
    msg = payload.message.strip()
    session_id = payload.session_id

    session = get_session_data(session_id)
    history_list = get_chat_history(session_id)
    
    # [1] 인증 로직
    if msg == ADMIN_PASSWORD:
        session["saving_mode"] = True
        set_session_data(session_id, session)
        return {"response": "인증 성공! 이제 관심사를 말씀하시면 저장됩니다."}

    # [2] 질문 여부 판단
    is_question = any(q in msg for q in ["?", "뭐야", "뭐지", "어때", "어디", "누구"])
    
    # [3] 저장 로직
    if session.get("saving_mode") and not is_question:
        if any(x in msg for x in ["관심사", "공부", "좋아해"]):
            cat = "interest" if "관심사" in msg or "좋아해" in msg else "study"
            val = re.sub(r'내\s|관심사는\s|공부는\s|좋아해|이야|야|입니다|\.', '', msg).strip()
            if val:
                save_info(cat, val)
                return {"response": f"좋습니다. {val} 정보를 기억했습니다."}

    # [4] DB 컨텍스트
    context = retrieve_context(msg)
    
    # [5] 모델이 헷갈리지 않게 아주 단순한 지시문으로 변경
    general_prompt_template = PromptTemplate(
        template="""당신은 한국어 AI 비서입니다. 질문에 짧고 친절하게 한 문장으로만 답하세요.
### 지식: {context}
### 질문: {msg}
### 답변:""",
        input_variables=["context", "msg"]
    )

    if llm_general is None: return {"response": "잠시만 기다려 주세요."}

    try:
        chain = general_prompt_template | llm_general | general_parser
        response_text = chain.invoke({
            "context": context if context else '정보 없음',
            "msg": msg
        })
        
        res = response_text.strip()
        
        # [6] 한국어가 아닌 글자가 섞여있거나 이상한 패턴이면 강제 교정
        if re.search(r'[^\uAC00-\uD7A3\s\d.?!,]', res) or len(res) < 2:
            res = "네, 말씀하신 내용 잘 알겠습니다. 더 도와드릴까요?"

        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", res)
        
        return {"response": res}
    except Exception as e:
        return {"response": "다시 한번 말씀해 주시겠어요?"}