import time
import pytest
from app.workers.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException
from app.workers.retry import retry_with_backoff
from app.workers.idempotency import IdempotencyManager
from app.workers.dlq import DeadLetterQueue

def test_circuit_breaker_transitions():
    cb = CircuitBreaker("test_service", failure_threshold=3, recovery_timeout=0.2)
    assert cb.state == "CLOSED"

    # Trip the breaker with 3 failures
    for _ in range(3):
        cb.record_failure()
    assert cb.state == "OPEN"

    # Calls should now fast-fail
    with pytest.raises(CircuitBreakerOpenException):
        cb.call(lambda: "success")

    # Wait for recovery timeout
    time.sleep(0.25)
    assert cb.can_execute() is True
    # In HALF-OPEN, successful call recovers to CLOSED
    res = cb.call(lambda: "recovered")
    assert res == "recovered"
    assert cb.state == "CLOSED"

def test_retry_with_backoff():
    attempts = 0
    @retry_with_backoff(max_attempts=3, base_delay=0.01, jitter=False)
    def flaky_task():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ValueError("Transient error")
        return "success"

    result = flaky_task()
    assert result == "success"
    assert attempts == 3

def test_idempotency_cache():
    mgr = IdempotencyManager(ttl_seconds=10)
    key = "idem-tx-999"
    assert mgr.get(key) is None
    mgr.mark_in_flight(key)
    assert mgr.is_in_flight(key) is True
    mgr.set(key, {"message": "processed"})
    assert mgr.get(key) == {"message": "processed"}

def test_dead_letter_queue():
    dlq_inst = DeadLetterQueue(max_size=10)
    dlq_inst.push("job-101", "case-1", "src-1", "Parser fatal crash")
    assert dlq_inst.count() == 1
    items = dlq_inst.list_failed()
    assert items[0]["job_id"] == "job-101"
    assert dlq_inst.remove("job-101") is True
    assert dlq_inst.count() == 0
