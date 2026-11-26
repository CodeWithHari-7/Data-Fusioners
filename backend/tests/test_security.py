import pytest
from fastapi import HTTPException
from app.security.file_validator import sanitize_filename, validate_file_content
from app.security.rate_limiter import TokenBucket

def test_filename_sanitization():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32.dll") == "system32.dll"
    assert sanitize_filename("report_2026!@#$%^.pdf") == "report_2026______.pdf"

def test_file_magic_bytes_validation():
    # Valid PDF magic bytes
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj"
    file_type, f_hash, size = validate_file_content(pdf_bytes, "test.pdf")
    assert file_type == "pdf"
    assert size == len(pdf_bytes)

    # Fake PDF (executable disguised as PDF)
    fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00"
    with pytest.raises(HTTPException) as exc:
        validate_file_content(fake_pdf, "malicious.pdf")
    assert exc.value.status_code == 400
    assert "signature does not match" in str(exc.value.detail)

    # Valid PNG magic bytes
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    f_type, _, _ = validate_file_content(png_bytes, "image.png")
    assert f_type == "image"

def test_token_bucket_rate_limiter():
    bucket = TokenBucket(capacity=5, refill_rate_per_sec=1.0)
    for _ in range(5):
        allowed, _ = bucket.consume(1)
        assert allowed is True
    # 6th request must be rejected
    allowed, retry_after = bucket.consume(1)
    assert allowed is False
    assert retry_after > 0.0
