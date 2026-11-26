import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Conflict, Claim, Source, Review, AuditLog
from app.schemas.api_models import ConflictResponse, ConflictResolveRequest, ClaimResponse

router = APIRouter(tags=["Conflicts & Corroboration"])

def build_claim_response(c: Claim, db: Session) -> ClaimResponse:
    src = db.query(Source).filter(Source.id == c.source_id).first()
    return ClaimResponse(
        id=c.id,
        case_id=c.case_id,
        source_id=c.source_id,
        source_filename=src.filename if src else "Unknown",
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

@router.get("/cases/{case_id}/conflicts", response_model=List[ConflictResponse])
def list_case_conflicts(
    case_id: str,
    status: Optional[str] = Query(None, description="Filter by status: detected, under_review, resolved, dismissed"),
    conflict_type: Optional[str] = Query(None, description="value_mismatch, corroboration, unit_incompatibility, etc."),
    db: Session = Depends(get_db)
):
    query = db.query(Conflict).filter(Conflict.case_id == case_id)
    if status:
        query = query.filter(Conflict.status == status)
    if conflict_type:
        query = query.filter(Conflict.conflict_type == conflict_type)

    conflicts = query.order_by(Conflict.created_at.desc()).all()
    results = []
    for c in conflicts:
        claim_a_obj = db.query(Claim).filter(Claim.id == c.claim_a_id).first()
        claim_b_obj = db.query(Claim).filter(Claim.id == c.claim_b_id).first()
        if claim_a_obj and claim_b_obj:
            results.append(ConflictResponse(
                id=c.id,
                case_id=c.case_id,
                entity=c.entity,
                attribute=c.attribute,
                conflict_type=c.conflict_type,
                severity=c.severity,
                status=c.status,
                explanation=c.explanation,
                tolerance_applied=c.tolerance_applied,
                value_a_normalized=c.value_a_normalized,
                value_b_normalized=c.value_b_normalized,
                unit_normalized=c.unit_normalized,
                claim_a=build_claim_response(claim_a_obj, db),
                claim_b=build_claim_response(claim_b_obj, db),
                created_at=c.created_at
            ))
    return results

@router.post("/conflicts/{conflict_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_conflict(
    conflict_id: str,
    resolve_in: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    conf = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conf.status = "resolved" if resolve_in.resolution in ("confirmed_conflict", "corroborated") else "dismissed"

    # Create review audit entry
    review_obj = Review(
        id=str(uuid.uuid4()),
        case_id=conf.case_id,
        target_type="conflict",
        target_id=conflict_id,
        resolution=resolve_in.resolution,
        analyst_note=resolve_in.analyst_note,
        analyst_id=resolve_in.analyst_id or "analyst-1"
    )
    db.add(review_obj)

    audit = AuditLog(
        case_id=conf.case_id,
        trace_id=str(uuid.uuid4())[:12],
        event_name="ConflictResolved",
        details_json=f'{{"conflict_id": "{conflict_id}", "resolution": "{resolve_in.resolution}"}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Conflict review successfully recorded.", "status": conf.status}
