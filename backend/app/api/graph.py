from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Case, Source, Claim, Conflict
from app.schemas.api_models import GraphResponse
from app.fusion.graph_builder import evidence_graph_builder

router = APIRouter(tags=["Evidence Graph"])

@router.get("/cases/{case_id}/graph", response_model=GraphResponse)
def get_evidence_graph(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    sources = db.query(Source).filter(Source.case_id == case_id).all()
    claims = db.query(Claim).filter(Claim.case_id == case_id).all()
    conflicts = db.query(Conflict).filter(Conflict.case_id == case_id).all()

    case_dict = {"id": case.id, "title": case.title, "status": case.status}
    src_dicts = [{"id": s.id, "filename": s.filename, "file_type": s.file_type, "file_size": s.file_size} for s in sources]
    clm_dicts = [
        {
            "id": c.id,
            "source_id": c.source_id,
            "entity": c.entity,
            "attribute": c.attribute,
            "raw_value": c.raw_value,
            "unit": c.unit,
            "extraction_confidence": c.extraction_confidence,
            "page_number": c.page_number,
            "row_number": c.row_number
        }
        for c in claims
    ]
    cnf_dicts = [
        {
            "id": cf.id,
            "claim_a_id": cf.claim_a_id,
            "claim_b_id": cf.claim_b_id,
            "conflict_type": cf.conflict_type
        }
        for cf in conflicts
    ]

    graph_data = evidence_graph_builder.build_graph(case_dict, src_dicts, clm_dicts, cnf_dicts)
    return graph_data
