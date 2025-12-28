from pydantic import BaseModel, Field
from typing import List, Optional

# 사용자 정보 저장용 스키마 (현재는 AgentActionSchema에서 직접 사용되어 DB 저장은 단순화됨)
class UserInfoSchema(BaseModel):
    interest: Optional[List[str]] = []
    study: Optional[List[str]] = []
    is_private: Optional[bool] = False

# FastAPI 엔드포인트에 들어오는 요청 Payload
class ChatPayload(BaseModel):
    session_id: str = "user_001"
    message: str

# LLM Agent의 행동 판단을 위한 스키마 (가장 중요)
class AgentActionSchema(BaseModel):
    action: str = Field(description="결정된 행동: 'save', 'query', 또는 'none'.")
    category: str | None = Field(default=None, description="저장 또는 조회할 정보의 카테고리 (예: 'interest', 'study').")
    value: str | None = Field(default=None, description="저장할 구체적인 값 (action='save'일 때만 필요).")