import os
import joblib
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Security, Depends # type: ignore
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional

# Configure JSON Audit Logger
logger = logging.getLogger("ai_engine_audit")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    logger.addHandler(handler)


router = APIRouter(tags=["Freight Matching"])

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("AI_API_KEY", "tradeflow-default-key")
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    return api_key

# Resolve model paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "tradeflow_ai_engine.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "tradeflow_scaler.pkl")

# Load model and scaler
try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
except Exception as e:
    # Print error but don't crash the server during startup so other routes work
    print(f"[WARNING] Failed to load freight matching model or scaler. Ensure {MODEL_PATH} and {SCALER_PATH} exist. Error: {e}")
    model = None
    scaler = None

class FreightInput(BaseModel):
    required_weight_tons: float
    transporter_capacity_tons: float
    trip_distance_km: float
    proximity_distance_km: float
    proposed_cost_etb: float
    historical_reliability_score: float
    fuel_efficiency_score: float

class TransporterCandidate(BaseModel):
    transporter_id: str
    capacity_tons: float
    proximity_distance_km: float
    proposed_cost_etb: float
    historical_reliability_score: float
    fuel_efficiency_score: float

class RankMatchesRequest(BaseModel):
    required_weight_tons: float
    trip_distance_km: float
    candidates: List[TransporterCandidate]
    preference: str = "balanced"  # 'balanced', 'cost_optimized', 'speed_optimized', 'reliability_optimized'

class RankedTransporter(BaseModel):
    transporter_id: str
    match_score: float
    confidence_score: float
    model_accepted: bool

class RankMatchesResponse(BaseModel):
    ranked_candidates: List[RankedTransporter]

@router.post("/predict-match", dependencies=[Depends(get_api_key)])
async def predict_match(data: FreightInput):
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
        
    try:
        # Prepare data for prediction
        input_data = [[
            data.required_weight_tons,
            data.transporter_capacity_tons,
            data.trip_distance_km,
            data.proximity_distance_km,
            data.proposed_cost_etb,
            data.historical_reliability_score,
            data.fuel_efficiency_score
        ]]
        
        # Scale the data
        scaled_data = scaler.transform(input_data)
        
        # Make prediction
        prediction = model.predict(scaled_data)
        
        # Get probability if available
        confidence_score = 0.0
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(scaled_data)
            confidence_score = float(max(probabilities[0]))
        else:
            # Fallback if probability not supported
            confidence_score = 1.0 if prediction[0] else 0.0

        match_accepted = bool(prediction[0])
        
        # 5.4 Security: Full audit logging of pricing decisions
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "MATCH_PREDICTION",
            "inputs": data.model_dump() if hasattr(data, "model_dump") else data.dict(),
            "outputs": {
                "match_accepted": match_accepted,
                "confidence_score": confidence_score
            }
        }
        logger.info(json.dumps(audit_entry))
        
        return {
            "match_accepted": match_accepted,
            "confidence_score": confidence_score
        }
    except Exception as e:
        logger.error(json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "MATCH_PREDICTION_ERROR",
            "error": str(e)
        }))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rank-matches", response_model=RankMatchesResponse, dependencies=[Depends(get_api_key)])
async def rank_matches(data: RankMatchesRequest):
    """
    FR-02.2: Matching engine ranks eligible transporters by a weighted score of cost, 
    historical reliability, fuel efficiency, and proximity/availability.
    """
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
        
    try:
        results = []
        for candidate in data.candidates:
            # Prepare data for ML model
            input_data = [[
                data.required_weight_tons,
                candidate.capacity_tons,
                data.trip_distance_km,
                candidate.proximity_distance_km,
                candidate.proposed_cost_etb,
                candidate.historical_reliability_score,
                candidate.fuel_efficiency_score
            ]]
            
            scaled_data = scaler.transform(input_data)
            prediction = model.predict(scaled_data)
            
            confidence_score = 0.0
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(scaled_data)
                # Fallback in case of binary classification
                if probabilities.shape[1] > 1:
                    confidence_score = float(probabilities[0][1])
                else:
                    confidence_score = float(max(probabilities[0]))
            else:
                confidence_score = 1.0 if prediction[0] else 0.0
                
            model_accepted = bool(prediction[0])
            
            # Multi-objective scoring heuristics
            # Assuming max acceptable cost is 50 ETB/km for normalization
            norm_cost = max(0.0, 1.0 - (candidate.proposed_cost_etb / max(1.0, data.trip_distance_km * 50.0)))
            norm_proximity = max(0.0, 1.0 - (candidate.proximity_distance_km / 500.0))
            norm_reliability = min(1.0, candidate.historical_reliability_score / 100.0)
            norm_fuel = min(1.0, candidate.fuel_efficiency_score / 100.0)
            
            # Configurable weights per shipper preference (FR-02.2)
            weights = {"cost": 0.25, "reliability": 0.25, "proximity": 0.25, "fuel": 0.25}
            if data.preference == "cost_optimized":
                weights = {"cost": 0.5, "reliability": 0.2, "proximity": 0.1, "fuel": 0.2}
            elif data.preference == "speed_optimized":
                weights = {"cost": 0.1, "reliability": 0.3, "proximity": 0.5, "fuel": 0.1}
            elif data.preference == "reliability_optimized":
                weights = {"cost": 0.1, "reliability": 0.6, "proximity": 0.2, "fuel": 0.1}
                
            match_score = (
                weights["cost"] * norm_cost +
                weights["reliability"] * norm_reliability +
                weights["proximity"] * norm_proximity +
                weights["fuel"] * norm_fuel
            ) * 100.0
            
            # Boost score based on ML model's confidence
            if model_accepted:
                match_score += (confidence_score * 20.0)
                
            results.append(RankedTransporter(
                transporter_id=candidate.transporter_id,
                match_score=round(min(100.0, match_score), 2),
                confidence_score=round(confidence_score, 4),
                model_accepted=model_accepted
            ))
            
        # Rank the shortlist
        results.sort(key=lambda x: x.match_score, reverse=True)
        
        # FR-04.3 / 5.4: Audit Logging
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "RANK_MATCHES",
            "inputs": {"preference": data.preference, "candidate_count": len(data.candidates)},
            "outputs": {"top_candidate": results[0].transporter_id if results else None}
        }
        logger.info(json.dumps(audit_entry))
        
        return RankMatchesResponse(ranked_candidates=results)
        
    except Exception as e:
        logger.error(json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event": "RANK_MATCHES_ERROR",
            "error": str(e)
        }))
        raise HTTPException(status_code=500, detail=str(e))
