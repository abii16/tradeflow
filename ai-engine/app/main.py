from fastapi import FastAPI # type: ignore
from app.api.v1.spot_pricing import router as spot_pricing_router
from app.api.v1.eta_prediction import router as eta_prediction_router
from app.api.v1.freight_matching import router as freight_matching_router
from app.api.v1.route_optimizer import router as route_optimizer_router

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
app.include_router(eta_prediction_router, prefix="/api/v1")
app.include_router(route_optimizer_router, prefix="/api/v1")
app.include_router(freight_matching_router) # Not prefixed with /api/v1 to keep backward compatibility
