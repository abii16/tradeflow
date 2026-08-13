import os
import joblib
from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

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
        
        return {
            "match_accepted": match_accepted,
            "confidence_score": confidence_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
