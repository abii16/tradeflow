"""
Dynamic Spot Pricing API Router (FR-04)
Exposes REST endpoints for:
- Calculating dynamic spot rates using ML and real-time market features (FR-04.1)
- Evaluating contract rate divergence for renegotiation review (FR-04.2)
- Accessing and updating corridor benchmarks and live telematics indexes
- Retrieving calculation audit logs for dispute resolution (FR-04.3)
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status # type: ignore
from pydantic import BaseModel

from app.services.pricing_engine import (
    pricing_engine,
    SpotPriceRequest,
    SpotPriceResponse,
    ContractEvaluationRequest,
    ContractEvaluationResponse,
    CorridorBenchmark,
    AuditLogRecord,
)

router = APIRouter(prefix="/pricing", tags=["Dynamic Spot Pricing Engine (FR-04)"])


class CorridorUpdateRequest(BaseModel):
    current_diesel_price: Optional[float] = None
    active_loads_count: Optional[int] = None
    available_trucks_count: Optional[int] = None
    congestion_score: Optional[float] = None
    road_condition_factor: Optional[float] = None


@router.post(
    "/calculate-spot",
    response_model=SpotPriceResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Dynamic Spot Price Quote (FR-04.1)",
    description="Computes a dynamic freight rate based on ML regression, supply/demand ratio, fuel index, congestion, cargo type, and urgency.",
)
async def calculate_spot_price(request: SpotPriceRequest):
    try:
        quote = pricing_engine.calculate_spot_price(request)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate spot price: {str(e)}",
        )


@router.post(
    "/evaluate-contract",
    response_model=ContractEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Contract Rate Divergence (FR-04.2)",
    description="Compares a locked contract rate against the prevailing spot market and flags rates diverging by >15% for renegotiation review.",
)
async def evaluate_contract(request: ContractEvaluationRequest):
    try:
        evaluation = pricing_engine.evaluate_contract_rate(request)
        return evaluation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate contract rate: {str(e)}",
        )


@router.get(
    "/corridors",
    response_model=List[CorridorBenchmark],
    summary="List Active Trade Corridors & Benchmarks",
    description="Returns benchmark profiles, current diesel prices, congestion scores, and active truck/load counts across Ethiopian corridors.",
)
async def get_corridors():
    return pricing_engine.get_corridors()


@router.post(
    "/corridors/{corridor_id}/update",
    response_model=CorridorBenchmark,
    summary="Update Corridor Telematics & Fuel Index",
    description="Updates live market indicators for a specific trade corridor (e.g. diesel price change, traffic congestion, supply/demand).",
)
async def update_corridor(corridor_id: str, update: CorridorUpdateRequest):
    updated = pricing_engine.update_corridor_metrics(
        corridor_id=corridor_id,
        current_diesel_price=update.current_diesel_price,
        active_loads_count=update.active_loads_count,
        available_trucks_count=update.available_trucks_count,
        congestion_score=update.congestion_score,
        road_condition_factor=update.road_condition_factor,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corridor '{corridor_id}' not found",
        )
    return updated


@router.get(
    "/audit/{calculation_id}",
    response_model=AuditLogRecord,
    summary="Get Price Calculation Audit Record (FR-04.3)",
    description="Retrieves the immutable audit trail snapshot and breakdown inputs for a specific spot quote calculation.",
)
async def get_audit_record(calculation_id: str):
    record = pricing_engine.get_audit_record(calculation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit record '{calculation_id}' not found",
        )
    return record


@router.get(
    "/audit",
    response_model=List[AuditLogRecord],
    summary="List Recent Price Calculation Audit Records (FR-04.3)",
    description="Lists recent pricing audit records for platform transparency and dispute resolution.",
)
async def list_audit_records(limit: int = Query(default=50, ge=1, le=200)):
    return pricing_engine.list_audit_records(limit=limit)
