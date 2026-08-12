"""
TradeFlow Spot Pricing Model Live Prediction Demo & Inspection Script.
Demonstrates live ML model inference and breakdown across realistic Ethiopian logistics corridors.
"""

from app.services.pricing_engine import (
    pricing_engine,
    SpotPriceRequest,
    ContractEvaluationRequest,
    Location,
)


def print_separator(title=""):
    print("\n" + "=" * 80)
    if title:
        print(f" {title.upper()} ".center(80, "="))
        print("=" * 80)


def display_spot_quote(title: str, request: SpotPriceRequest):
    print_separator(title)
    print(" [INPUT SHIPMENT PARAMETERS]")
    print(f"  • Route:              {request.origin.city} -> {request.destination.city}")
    print(f"  • Cargo Type:         {request.cargo_type}")
    print(f"  • Cargo Weight:       {request.weight_kg:,.0f} kg ({request.weight_kg/1000.0:.1f} Metric Tons)")
    print(f"  • Urgency Level:      {request.urgency.upper()} (Urgent flag: {request.is_urgent})")
    print(f"  • Custom Diesel:      {request.custom_fuel_price or 'Baseline Market Rate (95.50 ETB/L)'}")
    print(f"  • Currency:           {request.currency}")

    quote = pricing_engine.calculate_spot_price(request)
    bd = quote.breakdown

    print("\n [MACHINE LEARNING PREDICTION & MARKET BREAKDOWN]")
    print(f"  • Corridor Matched:       {quote.corridor_matched or 'Generic Highway Network'}")
    print(f"  • Corridor Distance:      {bd.distance_km:.1f} km")
    print(f"  • Base Corridor Rate:     {bd.base_corridor_rate:,.2f} {bd.currency}")
    print(f"  • Supply / Demand Ratio:  {bd.supply_demand_ratio:.2f} (Demand Multiplier: x{bd.demand_multiplier:.4f})")
    print(f"  • Fuel Price Index:       {bd.fuel_price_index:.4f} (Fuel Multiplier: x{bd.fuel_multiplier:.4f})")
    print(f"  • Congestion Score:       {bd.congestion_level:.2f} (Congestion Multiplier: x{bd.congestion_multiplier:.4f})")
    print(f"  • Cargo Multiplier:       x{bd.cargo_type_multiplier:.2f} ({bd.cargo_type})")
    print(f"  • Urgency Multiplier:     x{bd.urgency_multiplier:.2f} ({bd.urgency})")
    print(f"  • ML Model Raw Output:    {bd.model_prediction:,.2f} {bd.currency}")

    print("\n [VOLATILITY PROTECTION BOUNDS (FR-04.1)]")
    print(f"  • Market Floor (-30%):    {bd.price_floor:,.2f} {bd.currency}")
    print(f"  • Market Ceiling (+85%):  {bd.price_ceiling:,.2f} {bd.currency}")
    print(f"  • Clamped to Bounds?:     {'YES - ' + str(bd.clamp_reason) if bd.is_clamped else 'NO (Within safe volatility envelope)'}")

    print("\n [FINAL QUOTE SUMMARY]")
    print("  ========================================================")
    print(f"   FINAL SPOT PRICE:        {quote.currency} {quote.spot_price:,.2f}")
    print(f"   Unit Rate:               {quote.rate_per_kg:.4f} {quote.currency} / kg")
    print(f"   Ton-Km Freight Index:    {quote.rate_per_ton_km:.4f} {quote.currency} / ton-km")
    print(f"   Quote Calculation ID:    {quote.calculation_id}")
    print(f"   Valid For:               {quote.validity_minutes} minutes (Expires: {quote.expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')})")
    print("  ========================================================")
    return quote


def display_contract_evaluation(title: str, request: ContractEvaluationRequest):
    print_separator(title)
    print(" [LOCKED CONTRACT VS PREVAILING SPOT MARKET (FR-04.2)]")
    print(f"  • Locked Contract Rate:       {request.currency} {request.contract_rate:,.2f}")
    print(f"  • Corridor:                   {request.origin.city} -> {request.destination.city}")
    print(f"  • Cargo:                      {request.cargo_type} ({request.weight_kg/1000:.1f} tons)")
    print(f"  • Renegotiation Threshold:    ±{request.divergence_threshold_percent:.1f}%")

    eval_res = pricing_engine.evaluate_contract_rate(request)

    print("\n [EVALUATION RESULT]")
    print(f"  • Prevailing Spot Rate:       {eval_res.currency} {eval_res.prevailing_spot_rate:,.2f}")
    print(f"  • Divergence Delta:           {eval_res.divergence_percent:+0.2f}% ({eval_res.divergence_direction})")
    print(f"  • Severity Status:            {eval_res.severity}")
    print(f"  • Renegotiation Recommended?: {'YES - Action Required' if eval_res.is_renegotiation_recommended else 'NO - Market Aligned'}")
    print(f"  • Recommendation Message:     {eval_res.message}")


if __name__ == "__main__":
    print("\n TRADEFLOW AI SPOT PRICING ENGINE - LIVE PREDICTION TEST RUN ")
    print(f" Model Path:    {pricing_engine.model_path}")
    print(f" Model Loaded:  {pricing_engine.model is not None}")
    print(f" Features:      {len(pricing_engine.feature_names)} features configured")

    # Scenario 1: Standard Container Import Djibouti -> Modjo
    display_spot_quote(
        "Scenario 1: Standard Containerized Import (Djibouti Port -> Modjo Dry Port)",
        SpotPriceRequest(
            origin=Location(city="Djibouti", lat=11.588, lng=43.145),
            destination=Location(city="Modjo", lat=8.592, lng=39.123),
            cargo_type="CONTAINERIZED",
            weight_kg=24000.0,
            truck_type="FLATBED",
            urgency="standard",
            currency="ETB",
        ),
    )

    # Scenario 2: Urgent Perishable Reefer Cargo Hawassa -> Addis Ababa with Fuel Spike
    display_spot_quote(
        "Scenario 2: High-Urgency Refrigerated Cargo with Fuel Surcharge (Hawassa -> Addis Ababa)",
        SpotPriceRequest(
            origin=Location(city="Hawassa", lat=7.062, lng=38.476),
            destination=Location(city="Addis Ababa", lat=9.010, lng=38.761),
            cargo_type="REFRIGERATED",
            weight_kg=15000.0,
            truck_type="REEFER",
            urgency="high",
            is_urgent=True,
            pickup_window_hours=4,
            custom_fuel_price=118.50,
            currency="ETB",
        ),
    )

    # Scenario 3: Heavy Hazardous Cargo Djibouti -> Dire Dawa
    display_spot_quote(
        "Scenario 3: Heavy Hazardous Tanker/Cargo (Djibouti -> Dire Dawa)",
        SpotPriceRequest(
            origin=Location(city="Djibouti", lat=11.588, lng=43.145),
            destination=Location(city="Dire Dawa", lat=9.593, lng=41.866),
            cargo_type="HAZARDOUS",
            weight_kg=32000.0,
            truck_type="TANKER",
            urgency="standard",
            currency="ETB",
        ),
    )

    # Scenario 4: Contract Rate Evaluation (Outdated Rate vs Market Spot)
    display_contract_evaluation(
        "Scenario 4: Outdated Contract Rate Divergence Review",
        ContractEvaluationRequest(
            contract_rate=150000.0,
            currency="ETB",
            origin=Location(city="Djibouti"),
            destination=Location(city="Modjo"),
            cargo_type="CONTAINERIZED",
            weight_kg=24000.0,
            divergence_threshold_percent=15.0,
        ),
    )
