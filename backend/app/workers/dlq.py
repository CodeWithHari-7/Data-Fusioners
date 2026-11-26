import time
from typing import Dict, Any, List
from datetime import datetime, timezone

class DeadLetterQueue:
    """
    Tracen Trail Topic 15: Dead Letter Queue (DLQ).
    Stores poison jobs or tasks that failed repeatedly after max retries,
    allowing developers/analysts to inspect error traces without halting the main queue.
    """
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._dlq: List[Dict[str, Any]] = []

    def push(self, job_id: str, case_id: str, source_id: str, error_message: str, details: Dict[str, Any] = None):
        entry = {
            "job_id": job_id,
            "case_id": case_id,
            "source_id": source_id,
            "error_message": error_message,
            "details": details or {},
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "timestamp": time.time()
        }
        self._dlq.append(entry)
        if len(self._dlq) > self.max_size:
            self._dlq.pop(0)

    def list_failed(self) -> List[Dict[str, Any]]:
        return list(self._dlq)

    def count(self) -> int:
        return len(self._dlq)

    def remove(self, job_id: str) -> bool:
        initial_len = len(self._dlq)
        self._dlq = [item for item in self._dlq if item["job_id"] != job_id]
        return len(self._dlq) < initial_len

dlq = DeadLetterQueue()
