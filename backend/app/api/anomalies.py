import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Anomaly, Claim, Source, Review, AuditLog
from app.schemas.api_models import AnomalyResponse, ConflictResolveRequest
from app.api.conflicts import build_claim_response

router = APIRouter(tags=["Anomalies"])

@router.get("/cases/{case_id}/anomalies", response_model=List[AnomalyResponse])
def list_case_anomalies(
    case_id: str,
    status: Optional[str] = Query(None, description="Filter by status: flagged, confirmed, dismissed"),
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly).filter(Anomaly.case_id == case_id)
    if status:
        query = query.filter(Anomaly.status == status)

    anomalies = query.order_by(Anomaly.z_score.desc()).all()
    results = []
    for a in anomalies:
        claim_obj = db.query(Claim).filter(Claim.id == a.claim_id).first()
        if claim_obj:
            results.append(AnomalyResponse(
                id=a.id,
                case_id=a.case_id,
                claim_id=a.claim_id,
                entity=a.entity,
                attribute=a.attribute,
                z_score=a.z_score,
                mean_value=a.mean_value,
                std_dev=a.std_dev,
                claim_value=a.claim_value,
                unit=a.unit,
                explanation=a.explanation,
                status=a.status,
                claim=build_claim_response(claim_obj, db),
                created_at=a.created_at
            ))
    return results

@router.post("/anomalies/{anomaly_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_anomaly(
    anomaly_id: str,
    resolve_in: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    anom = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anom.status = "confirmed" if resolve_in.resolution == "confirmed_conflict" else "dismissed"

    review_obj = Review(
        id=str(uuid.uuid4()),
        case_id=anom.case_id,
        target_type="anomaly",
        target_id=anomaly_id,
        resolution=resolve_in.resolution,
        analyst_note=resolve_in.analyst_note,
        analyst_id=resolve_in.analyst_id or "analyst-1"
    )
    db.add(review_obj)

    audit = AuditLog(
        case_id=anom.case_id,
        trace_id=str(uuid.uuid4())[:12],
        event_name="AnomalyReviewed",
        details_json=f'{{"anomaly_id": "{anomaly_id}", "resolution": "{resolve_in.resolution}"}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Anomaly review successfully recorded.", "status": anom.status}
