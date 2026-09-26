import logging
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends # type: ignore
from pydantic import BaseModel
from typing import Optional
from app.api.v1.route_optimizer import get_api_key
from app.services.ocr_engine import ocr_engine, OCR_AVAILABLE

router = APIRouter(prefix="/document", tags=["Digital Customs Documentation (FR-06)"])
logger = logging.getLogger("ai_engine_audit")

class DocumentValidationRequest(BaseModel):
    document_url: str
    expected_quantity: float
    expected_value: Optional[float] = None
    document_type: str = "COMMERCIAL_INVOICE" # or PACKING_LIST, BILL_OF_LADING

class DocumentValidationResponse(BaseModel):
    is_valid: bool
    status_message: str
    matched_quantity: bool
    matched_value: bool
    extracted_preview: str

@router.post("/validate", response_model=DocumentValidationResponse, dependencies=[Depends(get_api_key)])
async def validate_document(data: DocumentValidationRequest):
    """
    FR-06.2: Automated validation checks for completeness and consistency 
    (matching quantities/values across documents) using OCR.
    """
    if not OCR_AVAILABLE:
        raise HTTPException(status_code=501, detail="OCR engine is not installed (easyocr missing). Run 'pip install easyocr opencv-python'")
        
    try:
        # 1. Extract text from image
        extracted_text = ocr_engine.extract_text(data.document_url, is_url=True)
        
        if not extracted_text or extracted_text.startswith("OCR module not loaded"):
            raise HTTPException(status_code=500, detail="Failed to extract text from document.")
            
        # 2. Validate against expected values
        validation_result = ocr_engine.validate_document(
            text=extracted_text,
            expected_quantity=data.expected_quantity,
            expected_value=data.expected_value
        )
        
        # 3. Audit Logging
        status_msg = "Document validation passed." if validation_result["is_valid"] else "Document validation failed: mismatched values."
        
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "DOCUMENT_VALIDATION",
            "document_type": data.document_type,
            "is_valid": validation_result["is_valid"]
        }
        logger.info(json.dumps(audit_entry))
        
        return DocumentValidationResponse(
            is_valid=validation_result["is_valid"],
            status_message=status_msg,
            matched_quantity=validation_result["matched_quantity"],
            matched_value=validation_result["matched_value"],
            extracted_preview=validation_result["extracted_text_preview"]
        )
        
    except Exception as e:
        logger.error(f"Document validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
