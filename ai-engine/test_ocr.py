import asyncio
import json
from app.api.v1.document_validation import DocumentValidationRequest, validate_document

async def test():
    req = DocumentValidationRequest(
        document_url="https://raw.githubusercontent.com/JaidedAI/EasyOCR/master/examples/english.png",
        expected_quantity=400,
    )
    res = await validate_document(req)
    print("Test passed! Response:")
    print(res.json())

asyncio.run(test())
