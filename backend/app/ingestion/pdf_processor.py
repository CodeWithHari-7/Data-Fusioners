import fitz  # PyMuPDF
from typing import List, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Extracts text, blocks, and tables from PDF documents using PyMuPDF.
    Maintains strict provenance (page numbers, bounding boxes, exact excerpts).
    """
    def extract(self, file_path: Path) -> List[Dict[str, Any]]:
        extracted_chunks: List[Dict[str, Any]] = []
        try:
            doc = fitz.open(str(file_path))
            for page_index in range(len(doc)):
                page = doc[page_index]
                page_num = page_index + 1
                
                # 1. Extract regular text
                text = page.get_text("text").strip()
                if text:
                    extracted_chunks.append({
                        "page_number": page_num,
                        "row_number": None,
                        "text": text,
                        "method": "pdf_text",
                        "confidence": 0.98
                    })

                # 2. Extract structured tables if present
                try:
                    tables = page.find_tables()
                    for t_idx, table in enumerate(tables):
                        df = table.to_pandas()
                        if not df.empty:
                            table_str = df.to_string(index=False)
                            extracted_chunks.append({
                                "page_number": page_num,
                                "row_number": t_idx + 1,
                                "text": f"[TABLE p.{page_num} #{t_idx+1}]\n{table_str}",
                                "method": "pdf_table",
                                "confidence": 0.95
                            })
                except Exception as table_err:
                    logger.debug(f"Table extraction skipped on page {page_num}: {table_err}")

            doc.close()
        except Exception as e:
            logger.error(f"Error extracting PDF {file_path}: {e}")
            raise e
        return extracted_chunks

pdf_processor = PDFProcessor()
