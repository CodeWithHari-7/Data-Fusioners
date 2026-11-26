from fastapi import APIRouter
from app.api.cases import router as cases_router
from app.api.sources import router as sources_router
from app.api.claims import router as claims_router
from app.api.conflicts import router as conflicts_router
from app.api.anomalies import router as anomalies_router
from app.api.graph import router as graph_router
from app.api.timeline import router as timeline_router
from app.api.jobs import router as jobs_router
from app.api.reviews import router as reviews_router
from app.api.health import router as health_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(cases_router)
api_router.include_router(sources_router)
api_router.include_router(claims_router)
api_router.include_router(conflicts_router)
api_router.include_router(anomalies_router)
api_router.include_router(graph_router)
api_router.include_router(timeline_router)
api_router.include_router(jobs_router)
api_router.include_router(reviews_router)
api_router.include_router(health_router)

__all__ = ["api_router"]
