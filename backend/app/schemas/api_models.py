from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Case Schemas
class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Investigation title")
    description: Optional[str] = Field(None, description="Detailed case objective")

class CaseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    source_count: int = 0
    claim_count: int = 0
    conflict_count: int = 0
    anomaly_count: int = 0

    class Config:
        from_attributes = True

# Source Schemas
class SourceResponse(BaseModel):
    id: str
    case_id: str
    filename: str
    file_hash: str
    file_size: int
    mime_type: str
    file_type: str
    status: str
    error_message: Optional[str] = None
    metadata_json: Optional[str] = "{}"
    created_at: datetime

    class Config:
        from_attributes = True

class SourceUploadResponse(BaseModel):
    source_id: str
    filename: str
    file_hash: str
    job_id: str
    status: str
    duplicate: bool = False
    message: str

# Claim Schemas
class ClaimResponse(BaseModel):
    id: str
    case_id: str
    source_id: str
    source_filename: Optional[str] = None
    entity: str
    attribute: str
    value: Optional[float] = None
    raw_value: str
    unit: Optional[str] = None
    normalized_value: Optional[float] = None
    normalized_unit: Optional[str] = None
    timestamp: Optional[datetime] = None
    page_number: Optional[int] = None
    row_number: Optional[int] = None
    original_text: str
    extraction_method: str
    extraction_confidence: float
    created_at: datetime

    class Config:
        from_attributes = True

# Conflict Schemas
class ConflictResponse(BaseModel):
    id: str
    case_id: str
    entity: str
    attribute: str
    conflict_type: str
    severity: str
    status: str
    explanation: str
    tolerance_applied: float
    value_a_normalized: Optional[float] = None
    value_b_normalized: Optional[float] = None
    unit_normalized: Optional[str] = None
    claim_a: ClaimResponse
    claim_b: ClaimResponse
    created_at: datetime

    class Config:
        from_attributes = True

class ConflictResolveRequest(BaseModel):
    resolution: str = Field(..., description="'confirmed_conflict', 'false_positive', 'corroborated', 'dismissed'")
    analyst_note: Optional[str] = Field(None, description="Analyst justification and rationale")
    analyst_id: Optional[str] = Field("analyst-1", description="Reviewer identifier")

# Anomaly Schemas
class AnomalyResponse(BaseModel):
    id: str
    case_id: str
    claim_id: str
    entity: str
    attribute: str
    z_score: float
    mean_value: float
    std_dev: float
    claim_value: float
    unit: Optional[str] = None
    explanation: str
    status: str
    claim: ClaimResponse
    created_at: datetime

    class Config:
        from_attributes = True

# Graph Schemas
class GraphNode(BaseModel):
    id: str
    label: str
    type: str # CASE, SOURCE, ENTITY, CLAIM
    data: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str # CONTAINS, EXTRACTED_FROM, HAS_CLAIM, CONFLICTS_WITH, CORROBORATES
    confidence: float = 1.0

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# Timeline Schemas
class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    entity: str
    attribute: str
    value: Optional[float] = None
    raw_value: str
    unit: Optional[str] = None
    normalized_value: Optional[float] = None
    normalized_unit: Optional[str] = None
    source_filename: str
    page_number: Optional[int] = None
    row_number: Optional[int] = None
    original_text: str
    confidence: float
    status: str # corroborated, conflict, normal

class TimelineResponse(BaseModel):
    case_id: str
    events: List[TimelineEvent]

# Processing Job Schemas
class JobStatusResponse(BaseModel):
    id: str
    case_id: str
    source_id: str
    stage: str
    status: str
    progress: int
    retries: int
    max_retries: int
    error_log: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Review & Audit Schemas
class ReviewResponse(BaseModel):
    id: str
    case_id: str
    target_type: str
    target_id: str
    resolution: str
    analyst_note: Optional[str] = None
    analyst_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    trace_id: str
    event_name: str
    details: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

# System Health & Resilience
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    circuit_breaker: Dict[str, Any]
    active_jobs: int
    dlq_count: int
