import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TabularProcessor:
    """
    Extracts tabular data row-by-row from CSV, XLSX, and XLS spreadsheets.
    Preserves exact row index provenance and formatted key-value pairs.
    """
    def extract(self, file_path: Path, file_type: str) -> List[Dict[str, Any]]:
        extracted_chunks: List[Dict[str, Any]] = []
        try:
            if file_type == "csv":
                df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
            elif file_type == "excel":
                # Read all sheets or first sheet
                excel_file = pd.ExcelFile(file_path)
                df = excel_file.parse(excel_file.sheet_names[0], dtype=str, keep_default_na=False)
            else:
                raise ValueError(f"Unsupported tabular file type: {file_type}")

            # Clean column names
            df.columns = [str(col).strip() for col in df.columns]

            for idx, row in df.iterrows():
                row_num = idx + 2  # 1-based index with header as row 1
                row_items = []
                for col in df.columns:
                    val = str(row[col]).strip()
                    if val and val.lower() != "nan":
                        row_items.append(f"{col}: {val}")
                
                if row_items:
                    row_text = "; ".join(row_items)
                    extracted_chunks.append({
                        "page_number": None,
                        "row_number": row_num,
                        "text": row_text,
                        "method": "tabular",
                        "confidence": 0.99
                    })

        except Exception as e:
            logger.error(f"Error extracting tabular file {file_path}: {e}")
            raise e

        return extracted_chunks

tabular_processor = TabularProcessor()
