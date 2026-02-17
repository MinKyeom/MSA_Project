# pgvector 스키마 및 연결
import psycopg2
from pgvector.psycopg2 import register_vector
from contextlib import contextmanager
from app.config import (
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    EMBEDDING_DIM,
)

def get_conn():
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    )
    register_vector(conn)
    return conn


@contextmanager
def get_cursor():
    conn = get_conn()
    try:
        yield conn.cursor()
        conn.commit()
    finally:
        conn.close()


def init_db():
    """pgvector 확장 및 post_embeddings 테이블 생성 (7일 보존 등은 별도 정책)"""
    with get_conn() as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS post_embeddings (
                    id BIGSERIAL PRIMARY KEY,
                    post_id BIGINT NOT NULL UNIQUE,
                    title TEXT,
                    content_snippet TEXT,
                    embedding vector(%s) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_post_embeddings_embedding
                ON post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
            """ % EMBEDDING_DIM)
    return True


def upsert_embedding(post_id: int, title: str, content_snippet: str, embedding: list):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO post_embeddings (post_id, title, content_snippet, embedding)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (post_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    content_snippet = EXCLUDED.content_snippet,
                    embedding = EXCLUDED.embedding,
                    created_at = NOW();
            """, (post_id, title or "", (content_snippet or "")[:2000], embedding))
        conn.commit()


def get_embedding_by_post_id(post_id: int):
    """연관글 검색용: 해당 post_id의 embedding 벡터 반환 (없으면 None)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT embedding::text FROM post_embeddings WHERE post_id = %s", (post_id,))
            row = cur.fetchone()
    if not row:
        return None
    # pgvector가 text로 반환될 수 있음 — 파싱
    s = row[0]
    if isinstance(s, str) and s.startswith("["):
        import json
        return json.loads(s)
    return list(s) if hasattr(s, "__iter__") and not isinstance(s, str) else None


def search_similar(query_embedding: list, limit: int = 10, exclude_post_id: int = None):
    """코사인 유사도로 유사 게시글 검색. exclude_post_id 있으면 해당 글 제외 (연관글용)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            if exclude_post_id is not None:
                cur.execute("""
                    SELECT post_id, title, content_snippet, 1 - (embedding <=> %s::vector) AS score
                    FROM post_embeddings
                    WHERE post_id != %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """, (query_embedding, exclude_post_id, query_embedding, limit))
            else:
                cur.execute("""
                    SELECT post_id, title, content_snippet, 1 - (embedding <=> %s::vector) AS score
                    FROM post_embeddings
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """, (query_embedding, query_embedding, limit))
            return cur.fetchall()
