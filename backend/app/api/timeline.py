from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Case, Source, Claim, Conflict
from app.schemas.api_models import TimelineResponse, TimelineEvent
from app.fusion.timeline_builder import timeline_builder

router = APIRouter(tags=["Timeline"])

@router.get("/cases/{case_id}/timeline", response_model=TimelineResponse)
def get_case_timeline(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    sources = db.query(Source).filter(Source.case_id == case_id).all()
    claims = db.query(Claim).filter(Claim.case_id == case_id).all()
    conflicts = db.query(Conflict).filter(Conflict.case_id == case_id).all()

    src_dicts = [{"id": s.id, "filename": s.filename} for s in sources]
    clm_dicts = [
        {
            "id": c.id,
            "source_id": c.source_id,
            "entity": c.entity,
            "attribute": c.attribute,
            "value": c.value,
            "raw_value": c.raw_value,
            "unit": c.unit,
            "normalized_value": c.normalized_value,
            "normalized_unit": c.normalized_unit,
            "timestamp": c.timestamp,
            "page_number": c.page_number,
            "row_number": c.row_number,
            "original_text": c.original_text,
            "extraction_confidence": c.extraction_confidence,
            "created_at": c.created_at
        }
        for c in claims
    ]
    cnf_dicts = [
        {
            "claim_a_id": cf.claim_a_id,
            "claim_b_id": cf.claim_b_id,
            "conflict_type": cf.conflict_type
        }
        for cf in conflicts
    ]

    events = timeline_builder.build_timeline(case_id, clm_dicts, src_dicts, cnf_dicts)
    return TimelineResponse(case_id=case_id, events=events)
