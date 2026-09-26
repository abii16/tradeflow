import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import joblib  # type: ignore
from fastapi import APIRouter, Depends, HTTPException, Security  # type: ignore
from fastapi.security import APIKeyHeader  # type: ignore
from pydantic import BaseModel  # type: ignore

from app.services.routing_engine import routing_engine

router = APIRouter(prefix="/route", tags=["Route Optimizer (FR-05)"])

logger = logging.getLogger("ai_engine_audit")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


def get_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("AI_API_KEY", "tradeflow-default-key")
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    return api_key


# Resolve model path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "route_optimizer.pkl")

# Load model
try:
    if os.path.exists(MODEL_PATH):
        route_model = joblib.load(MODEL_PATH)
    else:
        route_model = None
        print(f"[WARNING] Route optimization model not found at {MODEL_PATH}")
except Exception as e:
    print(f"[WARNING] Failed to load route optimizer model. Error: {e}")
    route_model = None


class OptimizeRouteRequest(BaseModel):
    current_lat: float
    current_lng: float
    destination_lat: float
    destination_lng: float
    vehicle_weight: float
    fuel_level: float


class IncidentReport(BaseModel):
    incidentType: str
    latitude: float
    longitude: float
    severity: str
    notes: Optional[str] = None


@router.post("/optimize", dependencies=[Depends(get_api_key)])
async def optimize_route(data: OptimizeRouteRequest):
    try:
        # FR-05.1: Predict optimal route minimizing cost (distance, time, fuel, risk)
        result = routing_engine.get_optimal_route(
            start_lat=data.current_lat,
            start_lng=data.current_lng,
            dest_lat=data.destination_lat,
            dest_lng=data.destination_lng,
            vehicle_weight=data.vehicle_weight,
            fuel_level=data.fuel_level,
        )

        better_route_found = len(result["path"]) > 1
        cost_savings = result["savings"]

        # NFR 5.4 Security: Full audit logging of routing decisions
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "ROUTE_OPTIMIZATION",
            "inputs": data.dict() if hasattr(data, "dict") else {},
            "outputs": {
                "better_route_found": better_route_found,
                "cost_savings_percentage": cost_savings,
                "recommended_path": result["path"],
            },
        }
        logger.info(json.dumps(audit_entry))

        return {
            "better_route_found": better_route_found,
            "cost_savings_percentage": cost_savings,
            "recommended_path": result["path"],
            "message": "Optimization successful",
        }
    except Exception as e:
        logger.error(f"Route optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/incident", dependencies=[Depends(get_api_key)])
async def report_incident(data: IncidentReport):
    try:
        # FR-05.2: Near real-time model state update
        updated, status_msg = routing_engine.update_incident(
            lat=data.latitude,
            lng=data.longitude,
            incident_type=data.incidentType,
            severity=data.severity,
        )

        # NFR 5.4 Security: Full audit logging of incidents
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "INCIDENT_REPORTED",
            "inputs": data.dict() if hasattr(data, "dict") else {},
            "status": status_msg,
        }
        logger.info(json.dumps(audit_entry))

        return {"status": "success" if updated else "ignored", "message": status_msg}
    except Exception as e:
        logger.error(f"Incident update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
