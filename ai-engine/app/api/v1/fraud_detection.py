from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.v1.route_optimizer import get_api_key

router = APIRouter(prefix="/fraud", tags=["Fraud Detection (Security)"])

class BidEvaluationRequest(BaseModel):
    transporter_id: str
    load_id: str
    bid_amount: float
    current_market_rate: float
    user_bids_last_hour: int

class FraudEvaluationResponse(BaseModel):
    is_suspicious: bool
    risk_score: float  # 0.0 to 1.0
    flags: list[str]

@router.post("/evaluate-bid", response_model=FraudEvaluationResponse, dependencies=[Depends(get_api_key)])
async def evaluate_bid(data: BidEvaluationRequest):
    """
    Rule-based & Statistical Fraud Detection for Bidding.
    """
    flags = []
    risk_score = 0.0

    # Rule 1: Bid is suspiciously low (price dumping) - e.g., > 30% below market rate
    if data.bid_amount < (data.current_market_rate * 0.70):
        flags.append("SUSPICIOUSLY_LOW_BID")
        risk_score += 0.4

    # Rule 2: Bid is suspiciously high (price gouging) - e.g., > 50% above market rate
    if data.bid_amount > (data.current_market_rate * 1.50):
        flags.append("SUSPICIOUSLY_HIGH_BID")
        risk_score += 0.3

    # Rule 3: High frequency bidding (bot activity)
    if data.user_bids_last_hour > 20:
        flags.append("HIGH_FREQUENCY_BIDDING")
        risk_score += 0.5

    # Cap risk score at 1.0
    risk_score = min(1.0, risk_score)
    is_suspicious = risk_score >= 0.5

    return FraudEvaluationResponse(
        is_suspicious=is_suspicious,
        risk_score=risk_score,
        flags=flags
    )
