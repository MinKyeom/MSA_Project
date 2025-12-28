import sqlite3
import os

# ✅ Docker Compose 볼륨 경로인 /app/data 내부에 저장
DB_PATH = "/app/data/user.db" 

def init_db():
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
    keywords = ["interest", "study"] 
    context = []
    for k in keywords:
        vals = query_info(k)
        if vals:
            context.append(f"DB Context - {k}: {', '.join(vals)}")
    return "\n".join(context)