import asyncio
import uuid
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.schema import ProcessingJob, Source, Claim, Entity, Conflict, Anomaly, AuditLog
from app.ingestion.router import ingestion_router
from app.intelligence.claims_extractor import claims_extractor
from app.intelligence.anomaly_detector import anomaly_detector
from app.fusion.conflict_engine import conflict_engine
from app.workers.dlq import dlq
from app.config import settings

logger = logging.getLogger(__name__)

class BackgroundJobQueue:
    """
    Tracen Trail Topics 15 & 19: Message Queues, DLQ, and Eventual Consistency.
    Asynchronously executes extraction, claim structuring, anomaly detection, and conflict fusion.
    Updates progress checkpoints and routes poison tasks to the Dead Letter Queue.
    """
    def __init__(self, max_concurrency: int = settings.MAX_WORKER_CONCURRENCY):
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.active_jobs: Dict[str, asyncio.Task] = {}

    def enqueue_processing(self, job_id: str, case_id: str, source_id: str, file_path: Path, file_type: str):
        task = asyncio.create_task(
            self._process_source_job(job_id, case_id, source_id, file_path, file_type)
        )
        self.active_jobs[job_id] = task

    async def _process_source_job(self, job_id: str, case_id: str, source_id: str, file_path: Path, file_type: str):
        async with self.semaphore:
            db: Session = SessionLocal()
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if not job:
                db.close()
                return

            trace_id = str(uuid.uuid4())[:12]

            try:
                # Stage 1: Validation
                job.status = "processing"
                job.stage = "validating"
                job.progress = 15
                db.commit()

                # Stage 2: Multimodal Extraction
                job.stage = "extracting"
                job.progress = 35
                db.commit()
                
                # Run CPU-bound extraction in threadpool
                chunks = await asyncio.to_thread(ingestion_router.route_and_extract, file_path, file_type)

                # Stage 3: Claims Extraction & Normalization
                job.stage = "claims"
                job.progress = 60
                db.commit()

                all_claims = []
                for chunk in chunks:
                    claims = await asyncio.to_thread(claims_extractor.extract_from_chunk, chunk, case_id, source_id)
                    for c_data in claims:
                        claim_record = Claim(
                            id=str(uuid.uuid4()),
                            case_id=case_id,
                            source_id=source_id,
                            entity=c_data["entity"],
                            attribute=c_data["attribute"],
                            value=c_data.get("value"),
                            raw_value=c_data["raw_value"],
                            unit=c_data.get("unit"),
                            normalized_value=c_data.get("normalized_value"),
                            normalized_unit=c_data.get("normalized_unit"),
                            timestamp=c_data.get("timestamp"),
                            page_number=c_data.get("page_number"),
                            row_number=c_data.get("row_number"),
                            original_text=c_data["original_text"],
                            extraction_method=c_data["extraction_method"],
                            extraction_confidence=c_data["extraction_confidence"]
                        )
                        db.add(claim_record)
                        all_claims.append(claim_record)

                # Register discovered entities
                seen_entities = set()
                for c in all_claims:
                    if c.entity not in seen_entities:
                        seen_entities.add(c.entity)
                        existing_ent = db.query(Entity).filter(
                            Entity.case_id == case_id,
                            Entity.canonical_name == c.entity
                        ).first()
                        if not existing_ent:
                            ent_obj = Entity(
                                id=str(uuid.uuid4()),
                                case_id=case_id,
                                canonical_name=c.entity,
                                entity_type="ASSET"
                            )
                            db.add(ent_obj)

                db.commit()

                # Stage 4: Conflict Engine & Evidence Fusion
                job.stage = "fusion"
                job.progress = 85
                db.commit()

                # Load all existing claims for this case to cross-compare
                case_claims = db.query(Claim).filter(Claim.case_id == case_id).all()
                claims_dict_list = [
                    {
                        "id": c.id,
                        "case_id": c.case_id,
                        "source_id": c.source_id,
                        "entity": c.entity,
                        "attribute": c.attribute,
                        "value": c.value,
                        "raw_value": c.raw_value,
                        "unit": c.unit,
                        "normalized_value": c.normalized_value,
                        "normalized_unit": c.normalized_unit,
                        "timestamp": c.timestamp,
                        "original_text": c.original_text
                    }
                    for c in case_claims
                ]

                # Run layered conflict evaluation
                findings = await asyncio.to_thread(conflict_engine.evaluate_all, claims_dict_list)
                for f in findings:
                    # Check if conflict pair already registered
                    existing = db.query(Conflict).filter(
                        Conflict.case_id == case_id,
                        Conflict.claim_a_id == f["claim_a_id"],
                        Conflict.claim_b_id == f["claim_b_id"]
                    ).first()
                    if not existing:
                        conf_rec = Conflict(
                            id=str(uuid.uuid4()),
                            case_id=case_id,
                            entity=f["entity"],
                            attribute=f["attribute"],
                            claim_a_id=f["claim_a_id"],
                            claim_b_id=f["claim_b_id"],
                            conflict_type=f["conflict_type"],
                            severity=f["severity"],
                            status=f["status"],
                            explanation=f["explanation"],
                            tolerance_applied=f["tolerance_applied"],
                            value_a_normalized=f.get("value_a_normalized"),
                            value_b_normalized=f.get("value_b_normalized"),
                            unit_normalized=f.get("unit_normalized")
                        )
                        db.add(conf_rec)

                # Run Anomaly Detection
                anomalies = await asyncio.to_thread(anomaly_detector.detect_anomalies, claims_dict_list)
                for a in anomalies:
                    existing_anom = db.query(Anomaly).filter(
                        Anomaly.case_id == case_id,
                        Anomaly.claim_id == a["claim_id"]
                    ).first()
                    if not existing_anom:
                        anom_rec = Anomaly(
                            id=str(uuid.uuid4()),
                            case_id=case_id,
                            claim_id=a["claim_id"],
                            entity=a["entity"],
                            attribute=a["attribute"],
                            z_score=a["z_score"],
                            mean_value=a["mean_value"],
                            std_dev=a["std_dev"],
                            claim_value=a["claim_value"],
                            unit=a.get("unit"),
                            explanation=a["explanation"],
                            status="flagged"
                        )
                        db.add(anom_rec)

                # Mark source and job as completed
                source = db.query(Source).filter(Source.id == source_id).first()
                if source:
                    source.status = "processed"

                job.status = "completed"
                job.stage = "completed"
                job.progress = 100
                job.updated_at = datetime.now(timezone.utc)

                # Audit log event
                audit = AuditLog(
                    case_id=case_id,
                    trace_id=trace_id,
                    event_name="EvidenceProcessed",
                    details_json=f'{{"claims_extracted": {len(all_claims)}, "findings": {len(findings)}}}'
                )
                db.add(audit)
                db.commit()

            except Exception as e:
                logger.error(f"[Worker] Job {job_id} failed: {e}", exc_info=True)
                job.retries += 1
                job.error_log = str(e)
                if job.retries >= job.max_retries:
                    job.status = "dlq"
                    # Push to Dead Letter Queue
                    dlq.push(
                        job_id=job_id,
                        case_id=case_id,
                        source_id=source_id,
                        error_message=str(e),
                        details={"file_path": str(file_path), "file_type": file_type}
                    )
                else:
                    job.status = "failed"
                
                source = db.query(Source).filter(Source.id == source_id).first()
                if source:
                    source.status = "failed"
                    source.error_message = str(e)

                db.commit()
            finally:
                db.close()
                self.active_jobs.pop(job_id, None)

job_queue = BackgroundJobQueue()
