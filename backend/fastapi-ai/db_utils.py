import sqlite3
import os

# 프로젝트 루트 디렉토리에 user.db 생성
DB_PATH = "user.db" 

def init_db():
    """DB 파일 및 테이블 초기화"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # 테이블 스키마: category와 value로 단순화
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
    """사용자 정보를 DB에 저장 (category: 'interest' 또는 'study')"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO user_info (category, value) VALUES (?, ?)", (category, value))
    conn.commit()
    conn.close()

def query_info(category: str) -> list[str]:
    """특정 category의 저장된 모든 정보를 조회"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT value FROM user_info WHERE category=?", (category,))
    rows = cur.fetchall()
    conn.close()
    return [r[0] for r in rows]

def retrieve_context(message: str) -> str:
    """RAG 컨텍스트를 위해 DB에서 관련 정보를 조회"""
    # 현재는 'interest'와 'study'만 조회
    keywords = ["interest", "study"] 
    context = []
    for k in keywords:
        vals = query_info(k)
        if vals:
            context.append(f"DB Context - {k}: {', '.join(vals)}")
    return "\n".join(context)