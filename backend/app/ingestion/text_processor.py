from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TextProcessor:
    """
    Extracts text chunks from plain .txt files with line number provenance.
    """
    def extract(self, file_path: Path) -> List[Dict[str, Any]]:
        extracted_chunks: List[Dict[str, Any]] = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()

            current_block = []
            block_start_line = 1

            for line_idx, line in enumerate(lines):
                stripped = line.strip()
                if stripped:
                    if not current_block:
                        block_start_line = line_idx + 1
                    current_block.append(stripped)
                else:
                    if current_block:
                        extracted_chunks.append({
                            "page_number": 1,
                            "row_number": block_start_line,
                            "text": " ".join(current_block),
                            "method": "plain_text",
                            "confidence": 1.0
                        })
                        current_block = []

            if current_block:
                extracted_chunks.append({
                    "page_number": 1,
                    "row_number": block_start_line,
                    "text": " ".join(current_block),
                    "method": "plain_text",
                    "confidence": 1.0
                })

        except Exception as e:
            logger.error(f"Error reading text file {file_path}: {e}")
            raise e

        return extracted_chunks

text_processor = TextProcessor()
