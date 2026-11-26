import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", index=True) # active, archived, closed
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    sources = relationship("Source", back_populates="case", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="case", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="case", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="case", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True) # SHA-256 for deduplication
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_type = Column(String(20), nullable=False) # pdf, image, csv, excel, txt
    status = Column(String(50), default="uploaded", index=True) # uploaded, processing, processed, failed
    error_message = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}") # page count, dimensions, sheet names
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="sources")
    claims = relationship("Claim", back_populates="source", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="source", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_source_case_hash", "case_id", "file_hash"),
    )

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    canonical_name = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(100), default="UNKNOWN") # EQUIPMENT, LOCATION, ORGANIZATION, METRIC, etc.
    aliases_json = Column(Text, default="[]") # JSON list of detected aliases
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="entities")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    entity = Column(String(255), nullable=False, index=True)
    attribute = Column(String(255), nullable=False, index=True)
    value = Column(Float, nullable=True) # Parsed float value for numeric comparisons
    raw_value = Column(String(255), nullable=False) # Original string representation
    unit = Column(String(50), nullable=True) # Raw extracted unit (e.g., "degC", "°F", "psi")
    normalized_value = Column(Float, nullable=True) # Standardized SI / canonical unit magnitude
    normalized_unit = Column(String(50), nullable=True) # Standardized unit name (e.g., "degree_Celsius")
    
    timestamp = Column(DateTime(timezone=True), nullable=True, index=True) # Time claim applies to
    page_number = Column(Integer, nullable=True) # 1-based page number for PDF/documents
    row_number = Column(Integer, nullable=True) # 1-based row number for tabular data
    
    original_text = Column(Text, nullable=False) # Exact excerpt from source
    extraction_method = Column(String(50), nullable=False) # pdf_text, ocr, tabular, nlp_rule
    extraction_confidence = Column(Float, default=1.0) # 0.0 - 1.0 calibrated confidence
    
    embedding_json = Column(Text, nullable=True) # Vector embedding serialization
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="claims")
    source = relationship("Source", back_populates="claims")

    __table_args__ = (
        Index("idx_claim_entity_attr", "case_id", "entity", "attribute"),
        Index("idx_claim_provenance", "source_id", "page_number", "row_number"),
    )

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    source_entity = Column(String(255), nullable=False, index=True)
    target_entity = Column(String(255), nullable=False, index=True)
    relation_type = Column(String(100), nullable=False) # CONNECTED_TO, LOCATED_IN, MEASURES, DEPENDS_ON
    confidence = Column(Float, default=1.0)
    provenance_claim_id = Column(String(36), ForeignKey("claims.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    entity = Column(String(255), nullable=False, index=True)
    attribute = Column(String(255), nullable=False, index=True)
    
    claim_a_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    claim_b_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    
    conflict_type = Column(String(50), nullable=False) # value_mismatch, unit_mismatch, temporal_conflict, corroborated
    severity = Column(String(20), nullable=False, default="medium") # high, medium, low, corroborated
    status = Column(String(50), default="detected", index=True) # detected, under_review, resolved, dismissed
    
    explanation = Column(Text, nullable=False)
    tolerance_applied = Column(Float, default=0.0)
    value_a_normalized = Column(Float, nullable=True)
    value_b_normalized = Column(Float, nullable=True)
    unit_normalized = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="conflicts")
    claim_a = relationship("Claim", foreign_keys=[claim_a_id])
    claim_b = relationship("Claim", foreign_keys=[claim_b_id])

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, index=True)
    
    entity = Column(String(255), nullable=False, index=True)
    attribute = Column(String(255), nullable=False, index=True)
    
    z_score = Column(Float, nullable=False)
    mean_value = Column(Float, nullable=False)
    std_dev = Column(Float, nullable=False)
    claim_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="flagged", index=True) # flagged, confirmed, dismissed
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="anomalies")
    claim = relationship("Claim")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage = Column(String(50), default="queued") # queued, validating, extracting, claims, fusion, completed, failed
    status = Column(String(50), default="queued", index=True) # queued, processing, completed, failed, dlq
    progress = Column(Integer, default=0) # 0 - 100%
    retries = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_log = Column(Text, nullable=True)
    idempotency_key = Column(String(255), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    source = relationship("Source", back_populates="jobs")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(50), nullable=False) # conflict, anomaly, claim
    target_id = Column(String(36), nullable=False, index=True)
    
    resolution = Column(String(50), nullable=False) # confirmed_conflict, false_positive, corroborated, dismissed
    analyst_note = Column(Text, nullable=True)
    analyst_id = Column(String(100), default="analyst-1")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="reviews")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True, index=True)
    trace_id = Column(String(64), nullable=False, index=True)
    event_name = Column(String(100), nullable=False, index=True) # EvidenceUploaded, ClaimsExtracted, etc.
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="audit_logs")
