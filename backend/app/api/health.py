from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.api_models import HealthResponse
from app.workers.circuit_breaker import ocr_breaker, embedding_breaker
from app.workers.queue import job_queue
from app.workers.dlq import dlq
from app.config import settings

router = APIRouter(tags=["Health & Metrics"])

@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    # Verify DB connectivity
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
        circuit_breaker={
            "ocr": ocr_breaker.get_status(),
            "embedding": embedding_breaker.get_status()
        },
        active_jobs=len(job_queue.active_jobs),
        dlq_count=dlq.count()
    )
