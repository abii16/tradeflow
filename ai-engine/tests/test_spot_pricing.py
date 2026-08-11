"""
Unit and Integration Test Suite for TradeFlow Dynamic Spot Pricing Engine (FR-04).
Tests:
- ML Model Loading & Prediction Accuracy (LGBMRegressor)
- Supply/Demand Ratio Surge & Capacity Discount Mechanics
- Fuel Price Index Multipliers
- Congestion Surcharges & Cargo Type Handling
- Price Floor & Ceiling Volatility Protection Bounds (Section 8.3)
- Contract Rate Divergence Review & Renegotiation Flagging (FR-04.2)
- Audit Trail Logging & Retrieval (FR-04.3)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pricing_engine import pricing_engine

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_model_loaded():
    assert pricing_engine.model is not None, "ML model should be loaded"
    assert len(pricing_engine.feature_names) == 30, "Model should have 30 one-hot and continuous features"


def test_calculate_spot_price_standard_corridor():
    payload = {
        "origin": {"city": "Djibouti", "lat": 11.588, "lng": 43.145},
        "destination": {"city": "Modjo", "lat": 8.592, "lng": 39.123},
        "cargo_type": "CONTAINERIZED",
        "weight_kg": 20000.0,
        "urgency": "standard",
        "currency": "ETB"
    }
    response = client.post("/api/v1/pricing/calculate-spot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "calculation_id" in data
    assert data["calculation_id"].startswith("QTE-")
    assert data["corridor_matched"] == "DJIBOUTI_MODJO"
    assert data["spot_price"] > 50000.0
    assert data["currency"] == "ETB"
    assert data["rate_per_kg"] > 0
    assert data["rate_per_ton_km"] > 0
    assert "breakdown" in data
    assert data["breakdown"]["distance_km"] == 810.0
    assert data["breakdown"]["weight_tons"] == 20.0


def test_supply_demand_surge_vs_discount():
    req_base = {
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "cargo_type": "CONTAINERIZED",
        "weight_kg": 20000.0,
    }
    res_base = client.post("/api/v1/pricing/calculate-spot", json=req_base).json()

    # High demand, low supply (surge pricing)
    client.post("/api/v1/pricing/corridors/DJIBOUTI_MODJO/update", json={
        "active_loads_count": 150,
        "available_trucks_count": 30,
    })
    res_surge = client.post("/api/v1/pricing/calculate-spot", json=req_base).json()

    # Low demand, high supply (capacity surplus discount)
    client.post("/api/v1/pricing/corridors/DJIBOUTI_MODJO/update", json={
        "active_loads_count": 20,
        "available_trucks_count": 100,
    })
    res_discount = client.post("/api/v1/pricing/calculate-spot", json=req_base).json()

    assert res_surge["breakdown"]["demand_multiplier"] > res_discount["breakdown"]["demand_multiplier"]
    assert res_surge["spot_price"] > res_discount["spot_price"]

    # Reset corridor
    client.post("/api/v1/pricing/corridors/DJIBOUTI_MODJO/update", json={
        "active_loads_count": 65,
        "available_trucks_count": 45,
    })


def test_fuel_price_index_impact():
    payload_standard = {
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Dire Dawa"},
        "cargo_type": "DRY_CARGO",
        "weight_kg": 20000.0,
        "custom_fuel_price": 95.50
    }
    res_std = client.post("/api/v1/pricing/calculate-spot", json=payload_standard).json()

    payload_spike = {
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Dire Dawa"},
        "cargo_type": "DRY_CARGO",
        "weight_kg": 20000.0,
        "custom_fuel_price": 125.00
    }
    res_spike = client.post("/api/v1/pricing/calculate-spot", json=payload_spike).json()

    assert res_spike["breakdown"]["fuel_price_index"] > res_std["breakdown"]["fuel_price_index"]
    assert res_spike["breakdown"]["fuel_multiplier"] > res_std["breakdown"]["fuel_multiplier"]


def test_cargo_type_multiplier_impact():
    base_payload = {
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "weight_kg": 20000.0,
    }

    res_dry = client.post("/api/v1/pricing/calculate-spot", json={**base_payload, "cargo_type": "DRY_CARGO"}).json()
    res_reefer = client.post("/api/v1/pricing/calculate-spot", json={**base_payload, "cargo_type": "REFRIGERATED"}).json()
    res_hazmat = client.post("/api/v1/pricing/calculate-spot", json={**base_payload, "cargo_type": "HAZARDOUS"}).json()

    assert res_reefer["spot_price"] > res_dry["spot_price"]
    assert res_hazmat["spot_price"] > res_dry["spot_price"]


def test_volatility_bounding_floor_and_ceiling():
    payload = {
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "cargo_type": "DRY_CARGO",
        "weight_kg": 20000.0,
    }
    res = client.post("/api/v1/pricing/calculate-spot", json=payload).json()
    breakdown = res["breakdown"]

    assert breakdown["final_spot_price"] >= breakdown["price_floor"]
    assert breakdown["final_spot_price"] <= breakdown["price_ceiling"]


def test_contract_evaluation_aligned():
    spot_res = client.post("/api/v1/pricing/calculate-spot", json={
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "cargo_type": "CONTAINERIZED",
        "weight_kg": 20000.0,
    }).json()

    current_spot = spot_res["spot_price"]

    eval_payload = {
        "contract_rate": current_spot * 1.02,
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "cargo_type": "CONTAINERIZED",
        "weight_kg": 20000.0,
        "divergence_threshold_percent": 15.0
    }
    response = client.post("/api/v1/pricing/evaluate-contract", json=eval_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["severity"] == "ALIGNED"
    assert data["is_renegotiation_recommended"] is False
    assert abs(data["divergence_percent"]) < 5.0


def test_contract_evaluation_critical_divergence():
    eval_payload = {
        "contract_rate": 40000.0,
        "origin": {"city": "Djibouti"},
        "destination": {"city": "Modjo"},
        "cargo_type": "CONTAINERIZED",
        "weight_kg": 20000.0,
        "divergence_threshold_percent": 15.0
    }
    response = client.post("/api/v1/pricing/evaluate-contract", json=eval_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["severity"] == "CRITICAL_RENEGOTIATION_REQUIRED"
    assert data["is_renegotiation_recommended"] is True
    assert data["divergence_direction"] == "PREMIUM"
    assert data["divergence_percent"] > 15.0


def test_corridors_list_and_update():
    get_res = client.get("/api/v1/pricing/corridors")
    assert get_res.status_code == 200
    corridors = get_res.json()
    assert len(corridors) >= 5

    update_res = client.post("/api/v1/pricing/corridors/DJIBOUTI_MODJO/update", json={
        "congestion_score": 0.35,
        "current_diesel_price": 105.00
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["congestion_score"] == 0.35
    assert updated_data["current_diesel_etb_per_liter"] == 105.00


def test_audit_logging_and_retrieval():
    res_quote = client.post("/api/v1/pricing/calculate-spot", json={
        "origin": {"city": "Addis Ababa"},
        "destination": {"city": "Hawassa"},
        "cargo_type": "DRY_CARGO",
        "weight_kg": 15000.0,
    }).json()

    calc_id = res_quote["calculation_id"]

    res_audit = client.get(f"/api/v1/pricing/audit/{calc_id}")
    assert res_audit.status_code == 200
    audit_data = res_audit.json()
    assert audit_data["calculation_id"] == calc_id
    assert audit_data["response"]["spot_price"] == res_quote["spot_price"]

    res_list = client.get("/api/v1/pricing/audit?limit=10")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1
