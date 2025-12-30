import redis, json, os

REDIS_HOST = os.getenv("REDIS_HOST", "msa-redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True, socket_connect_timeout=2)
    r.ping()
    IS_REDIS_CONNECTED = True
except Exception:
    IS_REDIS_CONNECTED = False
    class DummyRedis:
        def get(self, key): return None
        def set(self, key, value): pass
        def rpush(self, key, value): pass
        def lrange(self, key, start, end): return []
        def delete(self, key): pass
        def ltrim(self, key, start, end): pass
    r = DummyRedis()
    
def set_session_data(user_id: str, data: dict):
    if IS_REDIS_CONNECTED:
        r.set(f"session:{user_id}", json.dumps(data))

def get_session_data(user_id: str) -> dict:
    if IS_REDIS_CONNECTED:
        data = r.get(f"session:{user_id}")
        if data:
            try: return json.loads(data)
            except: pass
    return {"user_verified": False, "is_verifying": False, "pending_data": None}

def append_chat_history(user_id: str, role: str, message: str):
    if IS_REDIS_CONNECTED:
        r.rpush(f"history:{user_id}", f"{role}: {message}")
        r.ltrim(f"history:{user_id}", -30, -1)

def get_chat_history(user_id: str, last=10) -> list[str]:
    if IS_REDIS_CONNECTED:
        return r.lrange(f"history:{user_id}", -last, -1)
    return []

def clear_session(user_id: str):
    if IS_REDIS_CONNECTED:
        r.delete(f"session:{user_id}")
        r.delete(f"history:{user_id}")