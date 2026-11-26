import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Case, Source, ProcessingJob
from app.schemas.api_models import SourceResponse, SourceUploadResponse
from app.security.file_validator import sanitize_filename, validate_file_content
from app.security.sanitization import ensure_safe_path
from app.workers.idempotency import idempotency_manager
from app.workers.queue import job_queue
from app.config import settings

router = APIRouter(tags=["Sources & Upload"])

@router.post("/cases/{case_id}/upload", response_model=SourceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    # Verify Case exists
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")

    # Idempotency check (Tracen Topic 14)
    if idempotency_key:
        cached = idempotency_manager.get(idempotency_key)
        if cached:
            return cached
        if idempotency_manager.is_in_flight(idempotency_key):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A request with this Idempotency-Key is currently being processed."
            )
        idempotency_manager.mark_in_flight(idempotency_key)

    # Read uploaded content into memory for validation
    content = await file.read()
    safe_name = sanitize_filename(file.filename or "uploaded_file")
    
    # Strict security & magic byte validation
    file_type, file_hash, file_size = validate_file_content(content, safe_name)

    # SHA-256 Deduplication check
    existing_source = db.query(Source).filter(
        Source.case_id == case_id,
        Source.file_hash == file_hash
    ).first()
    if existing_source:
        resp = SourceUploadResponse(
            source_id=existing_source.id,
            filename=existing_source.filename,
            file_hash=file_hash,
            job_id="existing",
            status=existing_source.status,
            duplicate=True,
            message="Identical file previously uploaded and verified. Reusing processed evidence."
        )
        if idempotency_key:
            idempotency_manager.set(idempotency_key, resp)
        return resp

    # Generate isolated physical file path
    unique_filename = f"{uuid.uuid4()}_{safe_name}"
    target_path = settings.UPLOAD_DIR / unique_filename
    ensure_safe_path(target_path)

    # Save to disk
    with open(target_path, "wb") as f:
        f.write(content)

    # Create Source record
    source_obj = Source(
        id=str(uuid.uuid4()),
        case_id=case_id,
        filename=safe_name,
        file_path=str(target_path),
        file_hash=file_hash,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_type=file_type,
        status="uploaded"
    )
    db.add(source_obj)

    # Create background processing job
    job_obj = ProcessingJob(
        id=str(uuid.uuid4()),
        case_id=case_id,
        source_id=source_obj.id,
        stage="queued",
        status="queued",
        progress=0,
        idempotency_key=idempotency_key
    )
    db.add(job_obj)
    db.commit()

    # Enqueue background pipeline worker
    job_queue.enqueue_processing(
        job_id=job_obj.id,
        case_id=case_id,
        source_id=source_obj.id,
        file_path=target_path,
        file_type=file_type
    )

    resp = SourceUploadResponse(
        source_id=source_obj.id,
        filename=source_obj.filename,
        file_hash=file_hash,
        job_id=job_obj.id,
        status="queued",
        duplicate=False,
        message="Evidence securely uploaded. Background extraction pipeline dispatched."
    )

    if idempotency_key:
        idempotency_manager.set(idempotency_key, resp)

    return resp

@router.get("/cases/{case_id}/sources", response_model=List[SourceResponse])
def list_case_sources(case_id: str, db: Session = Depends(get_db)):
    sources = db.query(Source).filter(Source.case_id == case_id).order_by(Source.created_at.desc()).all()
    return sources

@router.get("/sources/{source_id}", response_model=SourceResponse)
def get_source(source_id: str, db: Session = Depends(get_db)):
    src = db.query(Source).filter(Source.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source file not found")
    return src

@router.get("/sources/{source_id}/download")
def download_source(source_id: str, db: Session = Depends(get_db)):
    src = db.query(Source).filter(Source.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source file not found")
    
    path = ensure_safe_path(Path(src.file_path))
    if not path.exists():
        raise HTTPException(status_code=404, detail="Underlying file missing from storage")

    return FileResponse(
        path=str(path),
        filename=src.filename,
        media_type=src.mime_type
    )

@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: str, db: Session = Depends(get_db)):
    src = db.query(Source).filter(Source.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source file not found")
    
    # Remove file from disk
    try:
        path = ensure_safe_path(Path(src.file_path))
        if path.exists():
            os.remove(path)
    except Exception:
        pass

    db.delete(src)
    db.commit()
    return None
