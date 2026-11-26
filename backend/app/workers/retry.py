import time
import random
import functools
import logging
from typing import Callable, Type, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

def retry_with_backoff(
    max_attempts: int = settings.MAX_RETRIES,
    base_delay: float = settings.RETRY_BASE_DELAY,
    max_delay: float = settings.RETRY_MAX_DELAY,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Tracen Trail Topics 12 & 13: Retries with Exponential Backoff + Jitter.
    Only retries transient faults. Adds randomized jitter to avoid thundering herd.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            while attempt < max_attempts:
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(f"[Retry] Function {func.__name__} failed after {attempt} attempts: {e}")
                        raise e
                    
                    # Exponential backoff calculation: base * 2^(attempt-1)
                    delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
                    if jitter:
                        delay += random.uniform(0.1, 0.5 * delay)
                        
                    logger.warning(
                        f"[Retry] Transient failure in {func.__name__} (attempt {attempt}/{max_attempts}): {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    time.sleep(delay)
        return wrapper
    return decorator
