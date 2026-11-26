import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Case, Source, Claim, Conflict, Anomaly
from app.schemas.api_models import CaseCreate, CaseResponse

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    case_obj = Case(
        id=str(uuid.uuid4()),
        title=case_in.title,
        description=case_in.description
    )
    db.add(case_obj)
    db.commit()
    db.refresh(case_obj)
    return CaseResponse(
        id=case_obj.id,
        title=case_obj.title,
        description=case_obj.description,
        status=case_obj.status,
        created_at=case_obj.created_at,
        updated_at=case_obj.updated_at,
        source_count=0,
        claim_count=0,
        conflict_count=0,
        anomaly_count=0
    )

@router.get("", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    results = []
    for c in cases:
        src_cnt = db.query(Source).filter(Source.case_id == c.id).count()
        clm_cnt = db.query(Claim).filter(Claim.case_id == c.id).count()
        cnf_cnt = db.query(Conflict).filter(Conflict.case_id == c.id, Conflict.conflict_type != "corroboration").count()
        anm_cnt = db.query(Anomaly).filter(Anomaly.case_id == c.id).count()
        results.append(CaseResponse(
            id=c.id,
            title=c.title,
            description=c.description,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at,
            source_count=src_cnt,
            claim_count=clm_cnt,
            conflict_count=cnf_cnt,
            anomaly_count=anm_cnt
        ))
    return results

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    src_cnt = db.query(Source).filter(Source.case_id == c.id).count()
    clm_cnt = db.query(Claim).filter(Claim.case_id == c.id).count()
    cnf_cnt = db.query(Conflict).filter(Conflict.case_id == c.id, Conflict.conflict_type != "corroboration").count()
    anm_cnt = db.query(Anomaly).filter(Anomaly.case_id == c.id).count()
    return CaseResponse(
        id=c.id,
        title=c.title,
        description=c.description,
        status=c.status,
        created_at=c.created_at,
        updated_at=c.updated_at,
        source_count=src_cnt,
        claim_count=clm_cnt,
        conflict_count=cnf_cnt,
        anomaly_count=anm_cnt
    )

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    db.delete(c)
    db.commit()
    return None
