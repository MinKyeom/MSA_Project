import redis
import json
import os

# Redis 연결 설정
REDIS_HOST = os.getenv("REDIS_HOST", "msa-redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    r.ping()
    IS_REDIS_CONNECTED = True
except redis.exceptions.ConnectionError:
    IS_REDIS_CONNECTED = False
    class DummyRedis:
        def get(self, key): return None
        def set(self, key, value): pass
        def rpush(self, key, value): pass
        def lrange(self, key, start, end): return []
        def delete(self, key): pass
    r = DummyRedis()
    
def set_session_data(user_id: str, data: dict):
    if IS_REDIS_CONNECTED:
        r.set(f"session:{user_id}", json.dumps(data))

def get_session_data(user_id: str) -> dict:
    if IS_REDIS_CONNECTED:
        data = r.get(f"session:{user_id}")
        if data:
            return json.loads(data)
    # user_verified 상태를 기본적으로 False로 반환
    return {"saving_mode": False, "user_verified": False}

def append_chat_history(user_id: str, role: str, message: str):
    if IS_REDIS_CONNECTED:
        r.rpush(f"history:{user_id}", f"{role}: {message}")

def get_chat_history(user_id: str, last=10) -> list[str]:
    if IS_REDIS_CONNECTED:
        return r.lrange(f"history:{user_id}", -last, -1)
    return []

def clear_session(user_id: str):
    if IS_REDIS_CONNECTED:
        r.delete(f"session:{user_id}")
        r.delete(f"history:{user_id}")