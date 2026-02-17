# Kafka post.events 소비 → 임베딩 → pgvector 저장
# post.created / post.updated 페이로드: { "postId": 1, "title": "...", "content": "..." }
import json
import logging
from kafka import KafkaConsumer
from app.config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_POST_EVENTS
from app.embedding import embed
from app.db import upsert_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def start_consumer():
    try:
        consumer = KafkaConsumer(
            KAFKA_TOPIC_POST_EVENTS,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(","),
            group_id="search-service",
            auto_offset_reset="earliest",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")) if m else {},
        )
        for msg in consumer:
            try:
                body = msg.value or {}
                post_id = body.get("postId") or body.get("post_id")
                title = body.get("title") or ""
                content = (body.get("content") or "")[:5000]
                if not post_id:
                    continue
                text = f"{title} {content}".strip()
                vector = embed(text)
                snippet = (content or "")[:500]
                upsert_embedding(int(post_id), title, snippet, vector)
                logger.info("Indexed post_id=%s", post_id)
            except Exception as e:
                logger.exception("Consume error: %s", e)
    except Exception as e:
        logger.exception("Kafka consumer failed: %s", e)
