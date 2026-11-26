import os
from pathlib import Path
from fastapi import HTTPException, status
from app.config import settings

def ensure_safe_path(target_path: Path, base_dir: Path = settings.UPLOAD_DIR) -> Path:
    """
    Ensure the target path is strictly within the allowed base directory,
    preventing directory traversal attacks (e.g. ../../etc/passwd).
    """
    try:
        resolved_target = target_path.resolve()
        resolved_base = base_dir.resolve()
        if not str(resolved_target).startswith(str(resolved_base)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Path traversal detected."
            )
        return resolved_target
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file path: {str(e)}"
        )
