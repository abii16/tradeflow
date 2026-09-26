import logging
import urllib.request

logger = logging.getLogger("ai_engine_audit")

# Optional: Try to import easyocr. If not installed, gracefully fallback.
try:
    import easyocr

    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning(
        "EasyOCR is not installed. Run 'pip install easyocr opencv-python' to enable real OCR."
    )


class OCREngine:
    def __init__(self):
        self.reader = None
        if OCR_AVAILABLE:
            try:
                # Load English model. Can add more languages like ['en', 'am'] if Amharic model is supported/needed.
                self.reader = easyocr.Reader(["en"], gpu=False)
                logger.info("EasyOCR model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load EasyOCR model: {e}")

    def _download_image(self, image_url: str) -> bytes:
        # Downloads image bytes from URL
        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as response:
            return response.read()

    def extract_text(self, image_source: str, is_url: bool = True) -> str:
        """Extracts text from an image (URL or local path)"""
        if not OCR_AVAILABLE or not self.reader:
            return "OCR module not loaded. Please install easyocr."

        try:
            if is_url:
                image_bytes = self._download_image(image_source)
                result = self.reader.readtext(image_bytes, detail=0)
            else:
                result = self.reader.readtext(image_source, detail=0)

            return " ".join(result)
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""

    def validate_document(
        self, text: str, expected_quantity: float, expected_value: float = None
    ) -> dict:
        """
        Validates if expected numbers exist in the OCR text.
        Simple heuristic: check if the exact string of the number exists in the extracted text.
        """
        text_lower = text.lower()

        # Check quantity
        qty_str = (
            str(int(expected_quantity))
            if expected_quantity.is_integer()
            else str(expected_quantity)
        )
        has_qty = qty_str in text_lower

        # Check value if provided
        has_val = True
        if expected_value is not None:
            val_str = (
                str(int(expected_value))
                if expected_value.is_integer()
                else str(expected_value)
            )
            has_val = val_str in text_lower

        is_valid = has_qty and has_val

        return {
            "is_valid": is_valid,
            "extracted_text_preview": text[:200] + "..." if len(text) > 200 else text,
            "matched_quantity": has_qty,
            "matched_value": has_val,
        }


ocr_engine = OCREngine()
