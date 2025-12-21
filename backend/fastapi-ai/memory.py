import redis
import json

# Redis 연결 시도 및 상태 확인
try:
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    r.ping()
    IS_REDIS_CONNECTED = True
except redis.exceptions.ConnectionError:
    IS_REDIS_CONNECTED = False
    # 연결 실패 시 세션 관리를 위한 더미 클래스 정의
    class DummyRedis:
        def get(self, key): return None
        def set(self, key, value): pass
        def rpush(self, key, value): pass
        def lrange(self, key, start, end): return []
        def delete(self, key): pass
    r = DummyRedis()
    
# 세션 데이터 (dict) 관리: saving_mode, user_verified 등
def set_session_data(user_id: str, data: dict):
    if IS_REDIS_CONNECTED:
        r.set(f"session:{user_id}", json.dumps(data))

def get_session_data(user_id: str) -> dict:
    if IS_REDIS_CONNECTED:
        data = r.get(f"session:{user_id}")
        if data:
            return json.loads(data)
    # 초기 세션 데이터 또는 Redis 연결 실패 시 기본값
    return {"saving_mode": False, "user_verified": False}

# 채팅 히스토리 관리 (List)
def append_chat_history(user_id: str, role: str, message: str):
    if IS_REDIS_CONNECTED:
        # role: message 형태로 list에 저장
        r.rpush(f"history:{user_id}", f"{role}: {message}")

def get_chat_history(user_id: str, last=10) -> list[str]:
    if IS_REDIS_CONNECTED:
        # 최근 n개의 히스토리 조회
        return r.lrange(f"history:{user_id}", -last, -1)
    return []

def clear_session(user_id: str):
    if IS_REDIS_CONNECTED:
        r.delete(f"session:{user_id}")
        r.delete(f"history:{user_id}")