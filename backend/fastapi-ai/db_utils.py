import sqlite3
import os

# ✅ Docker Compose 볼륨 경로인 /app/data 내부에 저장
DB_PATH = "/app/data/user.db" 

def init_db():
    # 데이터 폴더가 없을 경우 생성
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_info (
            id INTEGER PRIMARY KEY,
            category TEXT,
            value TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_info(category: str, value: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO user_info (category, value) VALUES (?, ?)", (category, value))
    conn.commit()
    conn.close()

def query_info(category: str) -> list[str]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT value FROM user_info WHERE category=?", (category,))
    rows = cur.fetchall()
    conn.close()
    return [r[0] for r in rows]

def retrieve_context(message: str) -> str:
    # 모든 저장된 카테고리를 가져와서 문맥에 포함 (더 똑똑한 답변 유도)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("SELECT DISTINCT category FROM user_info")
        categories = [r[0] for r in cur.fetchall()]
    except:
        categories = ["interest", "study"]
    conn.close()
    
    context = []
    for k in categories:
        vals = query_info(k)
        if vals:
            context.append(f"DB Context - {k}: {', '.join(vals)}")
    return "\n".join(context)