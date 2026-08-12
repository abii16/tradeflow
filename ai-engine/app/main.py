from fastapi import FastAPI
from app.api.v1.spot_pricing import router as spot_pricing_router

app = FastAPI(
    title="TradeFlow AI Engine Microservice",
    description="Microservice providing AI Freight Matching, Dynamic Spot Pricing (FR-04), ETA Predictions, and Route Optimization",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TradeFlow AI Engine", "version": "0.1.0"}

# Register API v1 Routers
app.include_router(spot_pricing_router, prefix="/api/v1")
