from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Review
from app.schemas.api_models import ReviewResponse

router = APIRouter(tags=["Reviews & Audit"])

@router.get("/cases/{case_id}/reviews", response_model=List[ReviewResponse])
def list_case_reviews(case_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.case_id == case_id).order_by(Review.created_at.desc()).all()
    return reviews
