import time
from typing import Dict, Any, Optional
from fastapi import Request

class IdempotencyManager:
    """
    Tracen Trail Topic 14: Idempotency Keys.
    Stores results of non-idempotent operations (POST /upload, POST /cases, etc.)
    so retried client requests receive the cached success response rather than double-processing.
    """
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl_seconds = ttl_seconds
        # Key -> {"response": Any, "timestamp": float, "status": "processing"|"done"}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        self._evict_expired()
        entry = self._cache.get(key)
        if entry and entry.get("status") == "done":
            return entry.get("response")
        return None

    def is_in_flight(self, key: str) -> bool:
        self._evict_expired()
        entry = self._cache.get(key)
        return bool(entry and entry.get("status") == "processing")

    def mark_in_flight(self, key: str):
        self._cache[key] = {
            "status": "processing",
            "timestamp": time.time(),
            "response": None
        }

    def set(self, key: str, response: Any):
        self._cache[key] = {
            "status": "done",
            "timestamp": time.time(),
            "response": response
        }

    def _evict_expired(self):
        now = time.time()
        expired = [k for k, v in self._cache.items() if now - v["timestamp"] > self.ttl_seconds]
        for k in expired:
            del self._cache[k]

idempotency_manager = IdempotencyManager()
