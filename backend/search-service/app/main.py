# Search Service — 의미 검색 / 연관 포스트 API
import os
import threading
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import KAFKA_BOOTSTRAP_SERVERS
from app.db import init_db, upsert_embedding, search_similar
from app.embedding import embed, get_model

app = FastAPI(title="Search Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    get_model()
    # Kafka 소비는 별도 스레드에서 (아래 consumer 모듈에서 start)
    try:
        from app.consumer import start_consumer
        t = threading.Thread(target=start_consumer, daemon=True)
        t.start()
    except Exception as e:
        print(f"Kafka consumer start skip: {e}")


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/api/search")
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    """의미 기반 통합 검색. 쿼리 문장을 임베딩하여 유사 게시글 반환."""
    query_emb = embed(q)
    rows = search_similar(query_emb, limit=limit)
    return {
        "query": q,
        "results": [
            {"postId": r[0], "title": r[1], "snippet": (r[2] or "")[:200], "score": round(float(r[3]), 4)}
            for r in rows
        ],
    }


@app.get("/api/search/related")
def related(
    post_id: int = Query(..., gt=0),
    limit: int = Query(5, ge=1, le=20),
):
    """특정 게시글과 유사한 연관 포스트 (해당 글 제외)."""
    from app.db import get_embedding_by_post_id
    query_emb = get_embedding_by_post_id(post_id)
    if not query_emb:
        return {"postId": post_id, "results": []}
    rows = search_similar(query_emb, limit=limit, exclude_post_id=post_id)
    return {
        "postId": post_id,
        "results": [
            {"postId": r[0], "title": r[1], "snippet": (r[2] or "")[:200], "score": round(float(r[3]), 4)}
            for r in rows
        ],
    }
