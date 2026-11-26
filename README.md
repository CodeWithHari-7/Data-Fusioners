# Data Fusioners — Multimodal Evidence Intelligence & Conflict Analysis Platform

[![CI/CD Pipeline](https://github.com/CodeWithHari-7/Data-Fusioners/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/CodeWithHari-7/Data-Fusioners/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10](https://img.shields.io/badge/Python-3.10-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-success.svg)](https://frontend-nine-livid-83.vercel.app)

A production-minded, multimodal evidence intelligence web application. Users upload multiple PDF, scanned images, Excel, CSV, and TXT files. The system extracts information, structures evidence into claims, connects related entities, detects contradictions and anomalies, and displays traceable results with zero fabricated conclusions.

- **Live Production (Vercel):** [https://frontend-nine-livid-83.vercel.app](https://frontend-nine-livid-83.vercel.app)
- **GitHub Repository:** [https://github.com/CodeWithHari-7/Data-Fusioners.git](https://github.com/CodeWithHari-7/Data-Fusioners.git)

---

## 1. System Architecture & Tracen Vibe Coding Principles

Designed in strict accordance with **"Tracen Vibe Coding Trail Book"** architectural principles:

```
[ Clients / Analyst Dashboard ]
               │
               ▼
   [ Nginx Reverse Proxy / Edge Rate Limiter ]  (Topic 1, 3, 4)
               │
        ┌──────┴──────┐
        ▼             ▼
 [ Next.js UI ]   [ FastAPI API Gateway ]       (Topic 5)
 (Times New Roman)    │
                      ├── [ Token Bucket Rate Limiter ] (Topic 1)
                      ├── [ Idempotency Tracker ]      (Topic 14)
                      ├── [ Circuit Breaker Machine ]  (Topic 10)
                      └── [ Async Job Queue ]          (Topic 15)
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     [ Multimodal ]    [ Conflict & ]   [ Dead Letter ]
     [ Extraction ]    [ Unit Engine]   [ Queue (DLQ) ] (Topic 15)
            │                │
            └───────┬────────┘
                    ▼
          [ PostgreSQL + pgvector ]             (Topic 2, 7)
          (Local SQLite Fallback)
```

### Core Reliability & Failure Handling Implementations:
1. **Edge & App Rate Limiting (Topic 1):** Token bucket algorithm with burst capacity returning `429 Too Many Requests` and `Retry-After` header.
2. **Circuit Breakers & Timeouts (Topic 10):** Three-state state machines (`CLOSED`, `OPEN`, `HALF-OPEN`) on CPU/memory intensive workers (OCR and embedding inference) to fast-fail and prevent cascading outages.
3. **Retries with Exponential Backoff & Jitter (Topics 12 & 13):** Transient 5xx and timeout errors retried with `delay = min(max_delay, base * 2^(attempt-1)) + jitter`. Never retries 4xx client errors.
4. **Idempotency Keys (Topic 14):** `Idempotency-Key` tracking on POST endpoints caches execution results, preventing duplicate file processing and charges.
5. **Message Queues & Dead Letter Queues (Topic 15):** Background asynchronous processing with bounded worker semaphores. Poison tasks failing after max retries are safely quarantined to DLQ for analyst inspection.
6. **Event-Driven Architecture & Distributed Tracing (Topic 17):** `X-Trace-ID` propagated through all pipeline stages; past-tense audit events recorded (`EvidenceUploaded`, `ClaimsExtracted`, `ConflictDetected`, `ReviewResolved`).
7. **Strict UTC Timezone Handling (Topic 20):** All timestamps converted to ISO UTC at ingestion; temporal interval comparisons occur strictly on normalized UTC time scales.

---

## 2. Multimodal Extraction & Conflict Resolution Pipeline

1. **Secure Ingestion:** Validates binary magic byte headers (`%PDF-`, PNG, JPEG, Excel PK ZIP), enforces 50MB size limits, sanitizes filenames against path traversal, and computes cryptographic SHA-256 for instant deduplication.
2. **Multimodal Routers:**
   - **PDF:** PyMuPDF (`fitz`) extracts raw page text and structured tables with bounding page numbers.
   - **Images & Scans:** OpenCV preprocessing (grayscale, Gaussian denoise, Otsu thresholding) + `pytesseract` OCR with graceful degradation fallback.
   - **Spreadsheets:** Pandas + OpenPyXL row extraction with header-value mapping.
   - **Text:** Plaintext parser with line offset tracking.
3. **Claims Extraction:** Structured tuples `(Entity, Attribute, Value, Unit, Timestamp, Source_ID, Page/Row, Excerpt, Confidence)`.
4. **Entity Resolution:** RapidFuzz token sort ratio + contextual normalization. Prevents merging distinct equipment (e.g. `Boiler 1` vs `Boiler 2` are never merged).
5. **Unit Normalization & Invariant Logic:**
   - Powered by `pint.UnitRegistry()`.
   - **Critical Verification 1:** `95°C` vs `203°F` &rarr; Pint normalizes both to `95.00°C` &rarr; classified as **Corroborated** (zero false conflict).
   - **Critical Verification 2:** Same entity/attribute/time with `95°C` vs `78°C` &rarr; difference exceeds tolerance &rarr; classified as **Potential Conflict**.
   - **Critical Verification 3:** Different entities or non-overlapping time windows do not automatically trigger conflict.
6. **Statistical Anomaly Detection:** Computes Z-scores for numerical attributes grouped by entity. Points with $|Z| \ge 2.5\sigma$ are flagged as empirical anomalies with explicit provenance.

---

## 3. UI / UX Design Specifications

- **Typography:** Times New Roman throughout (`font-family: 'Times New Roman', Times, serif` globally enforced).
- **Color Palette:** Pure white background (`#FFFFFF`), primary black text (`#111827`), with subtle accents:
  - Blue (`#1D4ED8`) for active states and links
  - Teal (`#0D9488`) for entities
  - Green (`#16A34A`) for corroboration
  - Red (`#DC2626`) for potential conflicts
  - Purple for statistical anomalies
- **12 Dedicated Application Views:**
  1. `Dashboard`
  2. `New Investigation`
  3. `Evidence Upload`
  4. `Evidence Explorer`
  5. `Structured Claims`
  6. `Conflict Center`
  7. `Anomaly Center`
  8. `Timeline & Trends` (Recharts interactive time-series)
  9. `Evidence Graph` (Interactive NetworkX topology)
  10. `Source Viewer` (Clickable excerpt and page/row inspection)
  11. `Review History` (Human analyst resolution audit logs)
  12. `System Settings` (Circuit breaker status, rate limits, thresholds)

---

## 4. Setup & Running Locally

### Option A: Quick Local Development (SQLite + Python + Next.js)

#### 1. Backend Setup:
```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest tests/ -v
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open Swagger API documentation at: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
Open dashboard at: `http://localhost:3000`

---

### Option B: Production Container Deployment (Docker Compose)

Starts PostgreSQL with pgvector, Backend, Frontend, and Nginx reverse proxy:
```bash
docker compose up --build -d
```
Access the application through the Nginx reverse proxy at: `http://localhost`

---

## 5. Automated Verification & Test Results

Run all 15 automated test suites:
```bash
python -m pytest backend/tests -v
```

```
collected 15 items

backend/tests/test_api.py::test_health_endpoint PASSED                    [ 6%]
backend/tests/test_api.py::test_case_lifecycle_and_upload PASSED          [13%]
backend/tests/test_conflict_engine.py::test_no_false_conflict_when_95c_equals_203f PASSED [20%]
backend/tests/test_conflict_engine.py::test_same_entity_attribute_time_95c_vs_78c_flags_potential_conflict PASSED [26%]
backend/tests/test_conflict_engine.py::test_different_entities_do_not_automatically_conflict PASSED [33%]
backend/tests/test_conflict_engine.py::test_non_overlapping_times_do_not_automatically_conflict PASSED [40%]
backend/tests/test_resilience.py::test_circuit_breaker_transitions PASSED  [46%]
backend/tests/test_resilience.py::test_retry_with_backoff PASSED          [53%]
backend/tests/test_resilience.py::test_idempotency_cache PASSED           [60%]
backend/tests/test_resilience.py::test_dead_letter_queue PASSED           [66%]
backend/tests/test_security.py::test_filename_sanitization PASSED         [73%]
backend/tests/test_security.py::test_file_magic_bytes_validation PASSED   [80%]
backend/tests/test_security.py::test_token_bucket_rate_limiter PASSED     [86%]
backend/tests/test_unit_conversion.py::test_temperature_conversion PASSED [93%]
backend/tests/test_unit_conversion.py::test_unit_comparison_and_tolerance PASSED [100%]

======================= 15 passed in 3.20s =======================
```

---

## 6. Security & Threat Model

| Threat | Defense Implementation |
|---|---|
| **Malicious Executable Disguised as PDF** | Binary magic byte verification (`%PDF-`), rejecting mismatches. |
| **Path Traversal Attacks (`../../etc/passwd`)** | Sanitizes names with regex, resolves paths strictly inside `UPLOAD_DIR`. |
| **Decompression Bomb (Zip Bomb XLSX)** | Zip infolist uncompressed ratio checks (>50x ratio rejected). |
| **DDoS / Resource Starvation** | Token bucket rate limiting (120 req/min, burst 30) + 50MB size caps. |
| **Cascading Dependency Outage** | Circuit Breakers on OCR and embeddings with automated fast-fail. |
| **IDOR / Data Tampering** | Case-level entity isolation and strict foreign key cascading. |
| **Duplicate Transaction / Processing** | `Idempotency-Key` headers + SHA-256 cryptographic deduplication. |

---

## 7. Vercel Deployment

Deploy frontend directly to Vercel:
```bash
cd frontend
vercel deploy --prod
```
Configured with `frontend/vercel.json` and standalone fallback data for seamless demonstration.
