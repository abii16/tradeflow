from fastapi import FastAPI

app = FastAPI(
    title="TradeFlow AI Engine Microservice",
    description="Microservice providing AI Freight Matching, Dynamic Spot Pricing, ETA Predictions, and Route Optimization",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TradeFlow AI Engine", "version": "0.1.0"}
