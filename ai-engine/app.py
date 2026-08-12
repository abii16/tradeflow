import os
import pickle
from fastapi import FastAPI, HTTPException, Security, Depends # type: ignore
from fastapi.security import APIKeyHeader # type: ignore
from pydantic import BaseModel # type: ignore

app = FastAPI(title="TradeFlow AI Engine")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("AI_API_KEY", "tradeflow-default-key")
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    return api_key


# Resolve model paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "tradeflow_ai_engine.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "tradeflow_scaler.pkl")

# Load model and scaler
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
except Exception as e:
    raise RuntimeError(f"Failed to load model or scaler. Ensure {MODEL_PATH} and {SCALER_PATH} exist. Error: {e}")

class FreightInput(BaseModel):
    required_weight_tons: float
    transporter_capacity_tons: float
    trip_distance_km: float
    proximity_distance_km: float
    proposed_cost_etb: float
    historical_reliability_score: float
    fuel_efficiency_score: float

@app.post("/predict-match", dependencies=[Depends(get_api_key)])
async def predict_match(data: FreightInput):
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
