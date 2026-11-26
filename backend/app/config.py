import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CACHE_DIR = DATA_DIR / "cache"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Also ensure root ./data exists
Path("data").mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_PATH = (DATA_DIR / "fusioners.db").resolve().as_posix()

class Settings(BaseSettings):
    APP_NAME: str = "Data Fusioners"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Environment & Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    CACHE_DIR: Path = CACHE_DIR
    
    # Database (always absolute path for SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")
    USE_PGVECTOR: bool = os.getenv("USE_PGVECTOR", "false").lower() in ("true", "1", "yes")
    
    # Security & Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg", ".csv", ".xlsx", ".xls", ".txt"}
    RATE_LIMIT_PER_MINUTE: int = 120
    RATE_LIMIT_BURST: int = 30
    SECRET_KEY: str = os.getenv("SECRET_KEY", "df-prod-secret-key-super-secure-change-in-prod-2026")
    
    # Processing & Resilience
    MAX_WORKER_CONCURRENCY: int = 4
    MAX_RETRIES: int = 3
    RETRY_BASE_DELAY: float = 1.0
    RETRY_MAX_DELAY: float = 10.0
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 5
    CIRCUIT_BREAKER_RECOVERY_TIME: float = 30.0
    
    # Intelligence & Thresholds
    SIMILARITY_THRESHOLD: float = 0.82
    CONFLICT_TOLERANCE_PERCENT: float = 2.0  # 2% tolerance for numerical equivalence
    ANOMALY_ZSCORE_THRESHOLD: float = 2.5
    FUZZY_ENTITY_THRESHOLD: float = 85.0
    
    # Optional LLM Flag (strictly disabled by default)
    ENABLE_OPTIONAL_LLM: bool = False
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
