import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "circuit_breaker" in data
    assert "active_jobs" in data

def test_case_lifecycle_and_upload():
    # 1. Create Case
    create_resp = client.post("/api/v1/cases", json={
        "title": "Industrial Turbine Investigation",
        "description": "Analyzing telemetry and inspection reports."
    })
    assert create_resp.status_code == 201
    case_data = create_resp.json()
    case_id = case_data["id"]
    assert case_data["title"] == "Industrial Turbine Investigation"

    # 2. Get Case
    get_resp = client.get(f"/api/v1/cases/{case_id}")
    assert get_resp.status_code == 200

    # 3. Upload Evidence (CSV)
    csv_content = (
        "Equipment,Parameter,Value,Unit,Time\n"
        "Boiler 1,Temperature,95,degC,2026-05-14 10:00:00\n"
        "Boiler 1,Temperature,203,degF,2026-05-14 10:05:00\n"
        "Reactor Alpha,Temperature,95,degC,2026-05-14 10:00:00\n"
        "Reactor Alpha,Temperature,78,degC,2026-05-14 10:02:00\n"
    ).encode("utf-8")

    upload_resp = client.post(
        f"/api/v1/cases/{case_id}/upload",
        files={"file": ("telemetry.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["status"] == "queued"
    assert "source_id" in upload_data

    # 4. Duplicate Upload check
    dup_resp = client.post(
        f"/api/v1/cases/{case_id}/upload",
        files={"file": ("telemetry_copy.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert dup_resp.status_code == 201
    assert dup_resp.json()["duplicate"] is True

    # 5. Graph endpoint
    graph_resp = client.get(f"/api/v1/cases/{case_id}/graph")
    assert graph_resp.status_code == 200
    assert "nodes" in graph_resp.json()
    assert "edges" in graph_resp.json()

    # 6. Timeline endpoint
    time_resp = client.get(f"/api/v1/cases/{case_id}/timeline")
    assert time_resp.status_code == 200
    assert "events" in time_resp.json()
