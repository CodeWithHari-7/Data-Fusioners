from typing import List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import ProcessingJob, Source
from app.schemas.api_models import JobStatusResponse
from app.workers.dlq import dlq
from app.workers.queue import job_queue

router = APIRouter(tags=["Processing Jobs & DLQ"])

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return job

@router.post("/jobs/{job_id}/retry", response_model=JobStatusResponse)
def retry_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    source = db.query(Source).filter(Source.id == job.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Associated source file not found")

    # Reset job state
    job.status = "queued"
    job.stage = "queued"
    job.progress = 0
    job.retries = 0
    job.error_log = None
    db.commit()

    # Remove from DLQ if it was parked there
    dlq.remove(job_id)

    # Re-dispatch
    job_queue.enqueue_processing(
        job_id=job.id,
        case_id=job.case_id,
        source_id=job.source_id,
        file_path=Path(source.file_path),
        file_type=source.file_type
    )

    return job

@router.get("/dlq", response_model=List[Dict[str, Any]])
def list_dlq_jobs():
    """Tracen Trail Topic 15: Dead Letter Queue Inspection."""
    return dlq.list_failed()
