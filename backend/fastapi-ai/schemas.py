from pydantic import BaseModel, Field
from typing import Optional

class ChatPayload(BaseModel):
    session_id: str = "user_001"
    message: str

class AgentActionSchema(BaseModel):
    action: str = Field(description="결정된 행동: 'save', 'query', 또는 'none'.")
    category: str | None = Field(default=None, description="정보 카테고리 (예: 'interest', 'study').")
    value: str | None = Field(default=None, description="저장할 내용 혹은 AI의 답변 메시지.")