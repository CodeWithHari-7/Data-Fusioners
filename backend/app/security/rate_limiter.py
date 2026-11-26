import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.config import settings

class TokenBucket:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate_per_sec
        self.last_update = time.time()

    def consume(self, amount: int = 1) -> Tuple[bool, float]:
        now = time.time()
        # Refill tokens based on elapsed time
        elapsed = now - self.last_update
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_update = now

        if self.tokens >= amount:
            self.tokens -= amount
            return True, 0.0
        
        # Calculate retry after seconds
        needed = amount - self.tokens
        retry_after = needed / self.refill_rate if self.refill_rate > 0 else 1.0
        return False, retry_after

class RateLimiter:
    def __init__(self, requests_per_minute: int = 120, burst: int = 30):
        self.rate = requests_per_minute / 60.0
        self.capacity = burst
        self.buckets: Dict[str, TokenBucket] = {}

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "127.0.0.1"

    def check_rate_limit(self, request: Request):
        # Allow internal testing / health bypass if specified
        if request.url.path in ("/api/v1/health", "/docs", "/openapi.json"):
            return

        client_ip = self._get_client_ip(request)
        if client_ip not in self.buckets:
            self.buckets[client_ip] = TokenBucket(self.capacity, self.rate)

        allowed, retry_after = self.buckets[client_ip].consume(1)
        if not allowed:
            retry_sec = max(1, int(retry_after))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "message": "You have exhausted your API quota. Please slow down.",
                    "retry_after_seconds": retry_sec
                },
                headers={"Retry-After": str(retry_sec)}
            )

rate_limiter = RateLimiter(
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    burst=settings.RATE_LIMIT_BURST
)
