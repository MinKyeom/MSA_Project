# all-MiniLM-L6-v2 임베딩 (384차원)
from sentence_transformers import SentenceTransformer
from app.config import EMBEDDING_MODEL

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed(text: str) -> list:
    if not (text or "").strip():
        return get_model().encode(" ").tolist()
    return get_model().encode(text.strip(), normalize_embeddings=True).tolist()
