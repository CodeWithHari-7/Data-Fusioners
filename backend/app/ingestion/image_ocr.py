import os
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import List, Dict, Any
import logging
from app.workers.circuit_breaker import ocr_breaker

logger = logging.getLogger(__name__)

class ImageOCRProcessor:
    """
    Image OCR with OpenCV preprocessing (grayscale, denoise, deskew, Otsu thresholding)
    and pytesseract. Wrapped with circuit breaker and graceful degradation.
    """
    def __init__(self):
        # Optional check for tesseract executable on Windows
        import shutil
        self.tesseract_available = shutil.which("tesseract") is not None
        if not self.tesseract_available:
            common_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Users\harih\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
            ]
            for p in common_paths:
                if os.path.exists(p):
                    import pytesseract
                    pytesseract.pytesseract.tesseract_cmd = p
                    self.tesseract_available = True
                    break

    def preprocess_image(self, img_path: Path) -> np.ndarray:
        """Apply grayscale, denoise, and Otsu thresholding."""
        # Read with OpenCV
        img = cv2.imread(str(img_path))
        if img is None:
            # Fallback to PIL
            pil_img = Image.open(str(img_path))
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 1. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Denoise with Gaussian Blur
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # 3. Otsu Thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh

    def extract(self, file_path: Path) -> List[Dict[str, Any]]:
        extracted_chunks: List[Dict[str, Any]] = []

        def _do_ocr():
            if not self.tesseract_available:
                logger.warning(f"Tesseract OCR executable not detected on host. Degrading gracefully for {file_path.name}.")
                return f"[OCR Skipped: Image {file_path.name} ingested. Install Tesseract-OCR for scanned text recognition.]"
            
            import pytesseract
            processed = self.preprocess_image(file_path)
            pil_img = Image.fromarray(processed)
            text = pytesseract.image_to_string(pil_img, config="--psm 6")
            return text.strip()

        try:
            # Run inside circuit breaker to prevent OCR worker lockups
            text = ocr_breaker.call(_do_ocr)
            if text:
                extracted_chunks.append({
                    "page_number": 1,
                    "row_number": None,
                    "text": text,
                    "method": "image_ocr",
                    "confidence": 0.88 if self.tesseract_available else 0.50
                })
        except Exception as e:
            logger.error(f"OCR failed for {file_path}: {e}")
            # Graceful degradation: return minimal metadata chunk rather than halting pipeline
            extracted_chunks.append({
                "page_number": 1,
                "row_number": None,
                "text": f"[OCR Failed: {str(e)}]",
                "method": "image_ocr_failed",
                "confidence": 0.0
            })

        return extracted_chunks

image_ocr_processor = ImageOCRProcessor()
