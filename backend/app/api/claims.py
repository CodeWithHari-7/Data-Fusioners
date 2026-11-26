from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Claim, Source
from app.schemas.api_models import ClaimResponse

router = APIRouter(tags=["Claims"])

@router.get("/cases/{case_id}/claims", response_model=List[ClaimResponse])
def list_case_claims(
    case_id: str,
    entity: Optional[str] = Query(None, description="Filter by entity canonical name"),
    attribute: Optional[str] = Query(None, description="Filter by attribute"),
    search: Optional[str] = Query(None, description="Search text in claim or original excerpt"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Claim).filter(Claim.case_id == case_id)

    if entity:
        query = query.filter(Claim.entity.ilike(f"%{entity}%"))
    if attribute:
        query = query.filter(Claim.attribute.ilike(f"%{attribute}%"))
    if search:
        query = query.filter(
            (Claim.entity.ilike(f"%{search}%")) |
            (Claim.attribute.ilike(f"%{search}%")) |
            (Claim.original_text.ilike(f"%{search}%"))
        )

    claims = query.order_by(Claim.created_at.desc()).offset(offset).limit(limit).all()

    # Pre-fetch sources for filename resolution
    sources = {s.id: s.filename for s in db.query(Source).filter(Source.case_id == case_id).all()}

    results = []
    for c in claims:
        results.append(ClaimResponse(
            id=c.id,
            case_id=c.case_id,
            source_id=c.source_id,
            source_filename=sources.get(c.source_id, "Unknown Source"),
            entity=c.entity,
            attribute=c.attribute,
            value=c.value,
            raw_value=c.raw_value,
            unit=c.unit,
            normalized_value=c.normalized_value,
            normalized_unit=c.normalized_unit,
            timestamp=c.timestamp,
            page_number=c.page_number,
            row_number=c.row_number,
            original_text=c.original_text,
            extraction_method=c.extraction_method,
            extraction_confidence=c.extraction_confidence,
            created_at=c.created_at
        ))
    return results

@router.get("/claims/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")
    src = db.query(Source).filter(Source.id == c.source_id).first()
    return ClaimResponse(
        id=c.id,
        case_id=c.case_id,
        source_id=c.source_id,
        source_filename=src.filename if src else "Unknown Source",
        entity=c.entity,
        attribute=c.attribute,
        value=c.value,
        raw_value=c.raw_value,
        unit=c.unit,
        normalized_value=c.normalized_value,
        normalized_unit=c.normalized_unit,
        timestamp=c.timestamp,
        page_number=c.page_number,
        row_number=c.row_number,
        original_text=c.original_text,
        extraction_method=c.extraction_method,
        extraction_confidence=c.extraction_confidence,
        created_at=c.created_at
    )
