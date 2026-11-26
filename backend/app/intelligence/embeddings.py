import numpy as np
import hashlib
from typing import List, Optional
import logging
from app.workers.circuit_breaker import embedding_breaker

logger = logging.getLogger(__name__)

class LocalEmbeddingEngine:
    """
    Local embedding inference using sentence-transformers / BGE-M3 or fast lightweight fallback.
    Cached in-memory to prevent redundant computations.
    """
    def __init__(self, model_name: str = "BAAI/bge-m3"):
        self.model_name = model_name
        self.model = None
        self._cache = {}

    def _load_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                # Use lightweight all-MiniLM-L6-v2 or bge-small for instant local inference if bge-m3 not local
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer model ({e}). Using deterministic feature vector fallback.")
                self.model = "fallback"

    def embed_text(self, text: str) -> np.ndarray:
        if not text:
            return np.zeros(384, dtype=np.float32)

        cache_key = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]

        def _compute():
            self._load_model()
            if self.model != "fallback":
                vec = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
                return vec.astype(np.float32)
            else:
                # Deterministic bag-of-words / hash projection fallback (dimension 384)
                words = text.lower().split()
                vec = np.zeros(384, dtype=np.float32)
                for w in words:
                    h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % 384
                    vec[h] += 1.0
                norm = np.linalg.norm(vec)
                return vec / norm if norm > 0 else vec

        try:
            vec = embedding_breaker.call(_compute)
            self._cache[cache_key] = vec
            return vec
        except Exception as e:
            logger.error(f"Embedding computation failed: {e}")
            vec = np.zeros(384, dtype=np.float32)
            return vec

    def cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity between two unit vectors."""
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

embedding_engine = LocalEmbeddingEngine()
