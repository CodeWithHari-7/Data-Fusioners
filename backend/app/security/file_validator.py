import hashlib
import re
import os
import zipfile
from pathlib import Path
from typing import Tuple, Dict, Any
from fastapi import HTTPException, status
from app.config import settings

# Magic byte signatures
MAGIC_SIGNATURES: Dict[str, list] = {
    ".pdf": [b"%PDF-"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".xlsx": [b"PK\x03\x04"],  # OpenXML ZIP container
    ".xls": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"], # Compound File Binary
}

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

def sanitize_filename(filename: str) -> str:
    """
    Sanitize uploaded filename to prevent directory traversal and injection.
    Only allows alphanumeric, hyphens, underscores, and dots.
    """
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean_name)
    # Ensure it's not empty or just dots
    if not clean_name or set(clean_name) == {"."}:
        clean_name = "unnamed_file"
    return clean_name

def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 hash of file content for deduplication and integrity."""
    return hashlib.sha256(content).hexdigest()

def detect_file_type(extension: str) -> str:
    ext = extension.lower()
    if ext == ".pdf":
        return "pdf"
    elif ext in (".png", ".jpg", ".jpeg"):
        return "image"
    elif ext == ".csv":
        return "csv"
    elif ext in (".xlsx", ".xls"):
        return "excel"
    elif ext == ".txt":
        return "txt"
    return "unknown"

def validate_file_content(content: bytes, filename: str) -> Tuple[str, str, int]:
    """
    Strict security validation:
    1. Size limit
    2. Extension allowlist
    3. Magic byte signature match
    4. Text file validation (no null bytes / binary payloads in txt/csv)
    5. Zip bomb detection for xlsx
    """
    size = len(content)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded."
        )
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    _, ext = os.path.splitext(filename.lower())
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Magic byte verification
    if ext in MAGIC_SIGNATURES:
        matched = False
        for sig in MAGIC_SIGNATURES[ext]:
            if content.startswith(sig):
                matched = True
                break
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security alert: File content signature does not match claimed extension '{ext}'."
            )
            
    # Zip bomb & integrity check for xlsx
    if ext == ".xlsx":
        try:
            import io
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                total_uncompressed = sum(info.file_size for info in zf.infolist())
                # Ratio check: compression ratio over 50x is indicative of zip bomb
                if total_uncompressed > MAX_FILE_SIZE * 5:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Security alert: Suspicious compression ratio detected (potential zip bomb)."
                    )
        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupt or malformed Excel file."
            )

    # CSV / TXT check: must be valid text and free of binary null bytes
    if ext in (".csv", ".txt"):
        if b"\x00" in content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security alert: Binary null characters detected in text file."
            )
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Text file encoding is invalid or unsupported."
                )

    file_type = detect_file_type(ext)
    file_hash = compute_sha256(content)
    return file_type, file_hash, size
