from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import os
from app.services.eta_engine import eta_engine
from app.services.eta_trainer import eta_trainer

router = APIRouter(prefix="/predict-eta", tags=["ETA Prediction"])

class ETARequest(BaseModel):
    origin_latitude: float = Field(..., description="Latitude of the trip origin or current location")
    origin_longitude: float = Field(..., description="Longitude of the trip origin or current location")
    destination_latitude: float = Field(..., description="Latitude of the trip destination")
    destination_longitude: float = Field(..., description="Longitude of the trip destination")
    distance_km: float = Field(..., description="Total or remaining distance in kilometers")
    corridor_leg: int = Field(..., description="Categorical ID of the corridor leg (e.g., 0 for Djibouti-Modjo)")
    cargo_weight_tons: float = Field(..., description="Weight of the cargo in tons")
    departure_hour: int = Field(..., ge=0, le=23, description="Hour of the day for departure (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0=Monday, 6=Sunday)")
    weather_condition: int = Field(..., description="Categorical ID for weather condition (0=Clear, 1=Rain, etc.)")
    has_security_flag: int = Field(..., description="Binary flag indicating known security/conflict risks on route (1=Yes, 0=No)")

class ETAResponse(BaseModel):
    predicted_travel_hours: float
    predicted_eta_minutes: float
    status: str
    metadata: Optional[dict] = None

@router.post("/", response_model=ETAResponse)
async def predict_eta(request: ETARequest):
    """
    Predicts the Estimated Time of Arrival (ETA) based on live GPS, route, and historical features.
    (FR-03 Shipment Tracking & ETA Prediction)
    """
    try:
        predicted_hours = eta_engine.predict_eta(
            origin_latitude=request.origin_latitude,
            origin_longitude=request.origin_longitude,
            destination_latitude=request.destination_latitude,
            destination_longitude=request.destination_longitude,
            distance_km=request.distance_km,
            corridor_leg=request.corridor_leg,
            cargo_weight_tons=request.cargo_weight_tons,
            departure_hour=request.departure_hour,
            day_of_week=request.day_of_week,
            weather_condition=request.weather_condition,
            has_security_flag=request.has_security_flag
        )
        
        return ETAResponse(
            predicted_travel_hours=round(predicted_hours, 2),
            predicted_eta_minutes=round(predicted_hours * 60, 2),
            status="success",
            metadata={
                "model_version": "v1_deep_learning"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate ETA: {str(e)}")

class ETATripData(ETARequest):
    actual_travel_hours: float = Field(..., description="The actual time it took for the trip to complete (in hours)")

class ETARetrainRequest(BaseModel):
    trips: List[ETATripData] = Field(..., description="List of historical trips to train the model on")
    epochs: int = Field(5, description="Number of epochs to train")
    learning_rate: float = Field(1e-4, description="Learning rate for the optimizer")
    force_retrain: bool = Field(False, description="If true, ignores the 5000 limit and trains immediately")

class ETARetrainResponse(BaseModel):
    status: str
    message: str
    final_loss: Optional[float] = None
    trips_buffered: int
    retrained: bool

BUFFER_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "trip_buffer.json")
RETRAIN_THRESHOLD = 5000

@router.post("/retrain", response_model=ETARetrainResponse)
async def retrain_eta_model(request: ETARetrainRequest):
    """
    Buffers new historical trip data. If buffer >= 5000 (or force_retrain=True),
    fine-tunes the ETA PyTorch model.
    """
    try:
        # Ensure data directory exists
        os.makedirs(os.path.dirname(BUFFER_FILE), exist_ok=True)
        
        # Load existing buffer
        buffered_trips = []
        if os.path.exists(BUFFER_FILE):
            with open(BUFFER_FILE, "r") as f:
                buffered_trips = json.load(f)
                
        # Append new trips
        new_trips = [trip.dict() for trip in request.trips]
        buffered_trips.extend(new_trips)
        
        # Check if we should retrain
        if len(buffered_trips) >= RETRAIN_THRESHOLD or request.force_retrain:
            # Trigger retraining
            final_loss = eta_trainer.retrain_model(
                trip_data=buffered_trips,
                epochs=request.epochs,
                learning_rate=request.learning_rate
            )
            
            # Clear buffer after successful retraining
            with open(BUFFER_FILE, "w") as f:
                json.dump([], f)
                
            return ETARetrainResponse(
                status="success",
                message="Threshold reached. Model successfully retrained and reloaded into memory.",
                final_loss=round(final_loss, 4),
                trips_buffered=0,
                retrained=True
            )
        else:
            # Save updated buffer and wait for more data
            with open(BUFFER_FILE, "w") as f:
                json.dump(buffered_trips, f)
                
            return ETARetrainResponse(
                status="success",
                message=f"Trips buffered. Need {RETRAIN_THRESHOLD - len(buffered_trips)} more to trigger retraining.",
                trips_buffered=len(buffered_trips),
                retrained=False
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to buffer/retrain ETA model: {str(e)}")
