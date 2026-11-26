from pathlib import Path
from typing import List, Dict, Any
from app.ingestion.pdf_processor import pdf_processor
from app.ingestion.image_ocr import image_ocr_processor
from app.ingestion.tabular_processor import tabular_processor
from app.ingestion.text_processor import text_processor

class IngestionRouter:
    """
    Directs uploaded files to the appropriate multimodal parser based on verified file_type.
    """
    def route_and_extract(self, file_path: Path, file_type: str) -> List[Dict[str, Any]]:
        ft = file_type.lower()
        if ft == "pdf":
            return pdf_processor.extract(file_path)
        elif ft == "image":
            return image_ocr_processor.extract(file_path)
        elif ft in ("csv", "excel"):
            return tabular_processor.extract(file_path, ft)
        elif ft == "txt":
            return text_processor.extract(file_path)
        else:
            raise ValueError(f"No registered extractor for file type: {file_type}")

ingestion_router = IngestionRouter()
