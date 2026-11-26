import time
from typing import Callable, Any
from app.config import settings

class CircuitBreakerOpenException(Exception):
    def __init__(self, service_name: str, retry_after: float):
        super().__init__(f"Circuit breaker for '{service_name}' is OPEN. Fast failing to prevent cascading outage.")
        self.service_name = service_name
        self.retry_after = retry_after

class CircuitBreaker:
    """
    Tracen Trail Topic 10: Circuit Breakers & Timeouts
    Protects downstream systems (like heavy OCR, embeddings, external DB) from cascading failures.
    States:
      - CLOSED: Normal operation. All calls go through.
      - OPEN: Failures exceeded threshold. Fast fail without calling service.
      - HALF-OPEN: Trial period after recovery timeout.
    """
    def __init__(self, service_name: str, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "CLOSED"
        self.failure_count = 0
        self.last_failure_time = 0.0

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"

    def can_execute(self) -> bool:
        now = time.time()
        if self.state == "OPEN":
            if now - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF-OPEN"
                return True
            return False
        return True

    def get_status(self) -> dict:
        return {
            "service": self.service_name,
            "state": self.state,
            "failure_count": self.failure_count,
            "threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout
        }

    def call(self, func: Callable, *args, **kwargs) -> Any:
        if not self.can_execute():
            retry_after = max(1.0, self.recovery_timeout - (time.time() - self.last_failure_time))
            raise CircuitBreakerOpenException(self.service_name, retry_after)
        
        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise e

# Core circuit breakers for pipeline modules
ocr_breaker = CircuitBreaker("ocr_engine", failure_threshold=settings.CIRCUIT_BREAKER_FAILURE_THRESHOLD, recovery_timeout=settings.CIRCUIT_BREAKER_RECOVERY_TIME)
embedding_breaker = CircuitBreaker("embedding_engine", failure_threshold=settings.CIRCUIT_BREAKER_FAILURE_THRESHOLD, recovery_timeout=settings.CIRCUIT_BREAKER_RECOVERY_TIME)
