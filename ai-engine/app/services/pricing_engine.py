"""
Dynamic Spot Pricing Engine (FR-04)
Calculates ML-powered dynamic spot freight rates for TradeFlow logistics across Ethiopian trade corridors
based on supply/demand balance, fuel price indexes, corridor congestion, cargo types, and urgency.
Loads and uses the trained LGBMRegressor model (app/models/spot_pricing_model.joblib)
with volatility protection bounds (FR-04.1), contract rate divergence review (FR-04.2), and audit logging (FR-04.3).
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import math
import lightgbm
import joblib
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Pydantic Schemas for Domain Models & API Contracts
# ---------------------------------------------------------

class Location(BaseModel):
    name: Optional[str] = None
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class CorridorBenchmark(BaseModel):
    id: str
    name: str
    origin_city: str
    destination_city: str
    distance_km: float
    base_rate_etb: float
    baseline_diesel_etb_per_liter: float = 95.50
    current_diesel_etb_per_liter: float = 95.50
    active_loads_count: int = 50
    available_trucks_count: int = 50
    congestion_score: float = 0.15
    road_condition_factor: float = 1.00
    seasonality_index: float = 1.00
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SpotPriceRequest(BaseModel):
    origin: Location
    destination: Location
    cargo_type: str = "CONTAINERIZED"  # 'CONTAINERIZED', 'DRY_CARGO', 'HAZARDOUS', 'REFRIGERATED', 'dry', 'bulk', 'fragile'
    weight_kg: float = Field(gt=0, description="Cargo weight in kilograms")
    volume_m3: Optional[float] = None
    truck_type: Optional[str] = "FLATBED"  # 'FLATBED', 'REEFER', 'SIDE_WALL', 'TANKER'
    urgency: Optional[str] = "standard"  # 'standard', 'high', 'low'
    is_urgent: Optional[bool] = False
    pickup_window_hours: Optional[int] = 24
    custom_fuel_price: Optional[float] = None
    currency: str = "ETB"
    shipper_id: Optional[str] = None
    load_id: Optional[str] = None


class PriceBreakdown(BaseModel):
    base_corridor_rate: float
    distance_km: float
    weight_tons: float
    supply_demand_ratio: float
    demand_multiplier: float
    fuel_price_index: float
    fuel_multiplier: float
    congestion_level: float
    congestion_multiplier: float
    cargo_type: str
    cargo_type_multiplier: float
    urgency: str
    urgency_multiplier: float
    model_prediction: float
    raw_calculated_price: float
    price_floor: float
    price_ceiling: float
    is_clamped: bool
    clamp_reason: Optional[str] = None
    final_spot_price: float
    rate_per_kg: float
    rate_per_ton_km: float
    currency: str


class SpotPriceResponse(BaseModel):
    calculation_id: str
    timestamp: datetime
    corridor_matched: Optional[str]
    spot_price: float
    currency: str
    rate_per_kg: float
    rate_per_ton_km: float
    model_confidence_r2: float
    breakdown: PriceBreakdown
    validity_minutes: int = 60
    expires_at: datetime


class ContractEvaluationRequest(BaseModel):
    contract_id: Optional[str] = None
    shipper_id: Optional[str] = None
    contract_rate: float = Field(gt=0, description="Existing locked contract rate in ETB")
    currency: str = "ETB"
    origin: Location
    destination: Location
    cargo_type: str = "CONTAINERIZED"
    weight_kg: float = 20000.0
    urgency: str = "standard"
    divergence_threshold_percent: float = 15.0  # FR-04.2 threshold


class ContractEvaluationResponse(BaseModel):
    contract_rate: float
    prevailing_spot_rate: float
    currency: str
    divergence_percent: float
    divergence_direction: str  # PREMIUM, DISCOUNT, AT_PAR
    is_renegotiation_recommended: bool
    severity: str  # ALIGNED, MODERATE_DIVERGENCE, CRITICAL_RENEGOTIATION_REQUIRED
    message: str
    evaluation_id: str
    timestamp: datetime
    spot_quote_summary: SpotPriceResponse


class AuditLogRecord(BaseModel):
    calculation_id: str
    timestamp: datetime
    request: SpotPriceRequest
    response: SpotPriceResponse


# ---------------------------------------------------------
# Dynamic Spot Pricing Engine Implementation
# ---------------------------------------------------------

class DynamicSpotPricingEngine:
    """
    ML-Driven Dynamic Spot Pricing Engine implementing FR-04.1, FR-04.2, and FR-04.3.
    """

    DEFAULT_MODEL_PATH = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "models",
        "spot_pricing_model.joblib"
    )

    ORIGIN_COL_MAP = {
        "adama": "origin_Adama Logistics Hub",
        "adama logistics hub": "origin_Adama Logistics Hub",
        "djibouti": "origin_Djibouti Port",
        "djibouti port": "origin_Djibouti Port",
        "gondar": "origin_Gondar Logistics Center",
        "gondar logistics center": "origin_Gondar Logistics Center",
        "hawassa": "origin_Hawassa Industrial Park",
        "hawassa industrial park": "origin_Hawassa Industrial Park",
        "kombolcha": "origin_Kombolcha Industrial Park",
        "kombolcha industrial park": "origin_Kombolcha Industrial Park",
        "modjo": "origin_Modjo Dry Port",
        "modjo dry port": "origin_Modjo Dry Port",
        "addis ababa": "origin_Modjo Dry Port",
        "addis": "origin_Modjo Dry Port",
    }

    DEST_COL_MAP = {
        "dire dawa": "destination_Dire Dawa Dry Port",
        "dire dawa dry port": "destination_Dire Dawa Dry Port",
        "djibouti": "destination_Djibouti Port",
        "djibouti port": "destination_Djibouti Port",
        "dukem": "destination_Dukem Industry Zone",
        "dukem industry zone": "destination_Dukem Industry Zone",
        "kality": "destination_Kality Container Depot",
        "kality container depot": "destination_Kality Container Depot",
        "addis ababa": "destination_Kality Container Depot",
        "addis": "destination_Kality Container Depot",
        "mekelle": "destination_Mekelle Dry Port",
        "mekelle dry port": "destination_Mekelle Dry Port",
        "modjo": "destination_Modjo Dry Port",
        "modjo dry port": "destination_Modjo Dry Port",
    }

    CARGO_COL_MAP = {
        "containerized": "cargo_type_CONTAINERIZED",
        "container": "cargo_type_CONTAINERIZED",
        "dry": "cargo_type_DRY_CARGO",
        "dry_cargo": "cargo_type_DRY_CARGO",
        "general": "cargo_type_DRY_CARGO",
        "bulk": "cargo_type_DRY_CARGO",
        "hazardous": "cargo_type_HAZARDOUS",
        "hazmat": "cargo_type_HAZARDOUS",
        "refrigerated": "cargo_type_REFRIGERATED",
        "perishable": "cargo_type_REFRIGERATED",
        "reefer": "cargo_type_REFRIGERATED",
    }

    TRUCK_COL_MAP = {
        "flatbed": "truck_type_required_FLATBED",
        "flatbed_trailer": "truck_type_required_FLATBED",
        "reefer": "truck_type_required_REEFER",
        "reefer_truck": "truck_type_required_REEFER",
        "side_wall": "truck_type_required_SIDE_WALL",
        "box_truck": "truck_type_required_SIDE_WALL",
        "tanker": "truck_type_required_TANKER",
    }

    # Volatility protection thresholds (Section 8.3)
    FLOOR_MULTIPLIER = 0.70   # Maximum allowed downward market fluctuation (30% floor)
    CEILING_MULTIPLIER = 1.85 # Maximum allowed upward surge fluctuation (85% ceiling)
    FUEL_COST_WEIGHT = 0.40   # 40% fuel expense share in Ethiopian trucking operations

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or self.DEFAULT_MODEL_PATH
        self.model = None
        self.feature_names = []
        self.metrics = {"r2": 0.9991, "mae": 764.20}
        self.corridors: Dict[str, CorridorBenchmark] = self._seed_corridors()
        self.audit_logs: Dict[str, AuditLogRecord] = {}
        self._load_ml_model()

    def _load_ml_model(self):
        """Loads trained LGBMRegressor model and feature definitions."""
        if os.path.exists(self.model_path):
            try:
                bundle = joblib.load(self.model_path)
                if isinstance(bundle, dict):
                    self.model = bundle.get("model")
                    self.feature_names = bundle.get("feature_names", [])
                    print(f"[INFO] Loaded TradeFlow Spot Pricing ML Model from {self.model_path} with {len(self.feature_names)} features.")
                else:
                    self.model = bundle
                    print(f"[INFO] Loaded raw model from {self.model_path}")
            except Exception as e:
                print(f"[WARNING] Could not load ML model from {self.model_path}: {e}. Falling back to analytical formula.")
        else:
            print(f"[NOTICE] Model file not found at {self.model_path}. Using calibrated analytical pricing.")

    def _seed_corridors(self) -> Dict[str, CorridorBenchmark]:
        """Seeds benchmark profiles for Ethiopia's principal logistics corridors."""
        return {
            "DJIBOUTI_MODJO": CorridorBenchmark(
                id="DJIBOUTI_MODJO",
                name="Djibouti Port -> Modjo Dry Port",
                origin_city="Djibouti",
                destination_city="Modjo",
                distance_km=810.0,
                base_rate_etb=280000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=65,
                available_trucks_count=45,
                congestion_score=0.15,
                road_condition_factor=1.00,
                seasonality_index=1.00,
            ),
            "MODJO_ADDIS": CorridorBenchmark(
                id="MODJO_ADDIS",
                name="Modjo Dry Port -> Addis Ababa Hub",
                origin_city="Modjo",
                destination_city="Addis Ababa",
                distance_km=75.0,
                base_rate_etb=45000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=90,
                available_trucks_count=80,
                congestion_score=0.25,
                road_condition_factor=1.00,
                seasonality_index=1.00,
            ),
            "DJIBOUTI_DIREDAWA": CorridorBenchmark(
                id="DJIBOUTI_DIREDAWA",
                name="Djibouti Port -> Dire Dawa",
                origin_city="Djibouti",
                destination_city="Dire Dawa",
                distance_km=360.0,
                base_rate_etb=140000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=40,
                available_trucks_count=35,
                congestion_score=0.10,
                road_condition_factor=1.00,
                seasonality_index=1.00,
            ),
            "ADDIS_HAWASSA": CorridorBenchmark(
                id="ADDIS_HAWASSA",
                name="Addis Ababa -> Hawassa Industrial Park",
                origin_city="Addis Ababa",
                destination_city="Hawassa",
                distance_km=275.0,
                base_rate_etb=105000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=30,
                available_trucks_count=40,
                congestion_score=0.05,
                road_condition_factor=1.00,
                seasonality_index=1.00,
            ),
            "DJIBOUTI_MEKELLE": CorridorBenchmark(
                id="DJIBOUTI_MEKELLE",
                name="Djibouti Port -> Mekelle via Semera",
                origin_city="Djibouti",
                destination_city="Mekelle",
                distance_km=780.0,
                base_rate_etb=310000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=98.00,
                active_loads_count=25,
                available_trucks_count=20,
                congestion_score=0.20,
                road_condition_factor=1.10,
                seasonality_index=1.00,
            ),
            "ADDIS_ADAMA": CorridorBenchmark(
                id="ADDIS_ADAMA",
                name="Addis Ababa -> Adama Expressway",
                origin_city="Addis Ababa",
                destination_city="Adama",
                distance_km=90.0,
                base_rate_etb=48000.0,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=70,
                available_trucks_count=70,
                congestion_score=0.10,
                road_condition_factor=1.00,
                seasonality_index=1.00,
            ),
        }

    def _match_corridor(self, origin_city: str, dest_city: str) -> Optional[CorridorBenchmark]:
        """Matches predefined corridor benchmark."""
        orig = origin_city.strip().lower()
        dest = dest_city.strip().lower()
        for corridor in self.corridors.values():
            if (corridor.origin_city.lower() in orig or orig in corridor.origin_city.lower()) and \
               (corridor.destination_city.lower() in dest or dest in corridor.destination_city.lower()):
                return corridor
        return None

    def _calculate_distance_km(self, origin: Location, destination: Location, matched_corridor: Optional[CorridorBenchmark]) -> float:
        """Calculates distance in km with Haversine formula and highway curvature factor."""
        if matched_corridor:
            return matched_corridor.distance_km
        if origin.lat and origin.lng and destination.lat and destination.lng:
            r = 6371.0
            d_lat = math.radians(destination.lat - origin.lat)
            d_lng = math.radians(destination.lng - origin.lng)
            a = math.sin(d_lat / 2)**2 + math.cos(math.radians(origin.lat)) * math.cos(math.radians(destination.lat)) * math.sin(d_lng / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return max(25.0, round(r * c * 1.32, 1))
        return 450.0

    def calculate_spot_price(self, request: SpotPriceRequest) -> SpotPriceResponse:
        """
        Calculates dynamic spot rate using the trained ML model with volatility bounding and breakdown.
        """
        calc_id = f"QTE-{uuid.uuid4().hex[:10].upper()}"
        now = datetime.now(timezone.utc)

        matched_corridor = self._match_corridor(request.origin.city, request.destination.city)
        corridor_id = matched_corridor.id if matched_corridor else None

        distance_km = self._calculate_distance_km(request.origin, request.destination, matched_corridor)
        weight_tons = max(0.5, round(request.weight_kg / 1000.0, 2))

        # Corridor telematics metrics
        if matched_corridor:
            base_corridor_rate = matched_corridor.base_rate_etb
            active_loads = matched_corridor.active_loads_count
            available_trucks = max(1, matched_corridor.available_trucks_count)
            baseline_diesel = matched_corridor.baseline_diesel_etb_per_liter
            current_diesel = request.custom_fuel_price or matched_corridor.current_diesel_etb_per_liter
            congestion_level = matched_corridor.congestion_score
            road_factor = matched_corridor.road_condition_factor
            seasonality = matched_corridor.seasonality_index
        else:
            base_corridor_rate = distance_km * 20.0 * 3.85
            active_loads = 50
            available_trucks = 50
            baseline_diesel = 95.50
            current_diesel = request.custom_fuel_price or 95.50
            congestion_level = 0.15
            road_factor = 1.00
            seasonality = 1.00

        # Feature derivations
        sd_ratio = round(active_loads / available_trucks, 2)
        fuel_price_index = round(current_diesel / baseline_diesel, 4)

        # Urgency numeric level
        is_high_urgency = request.is_urgent or (request.pickup_window_hours and request.pickup_window_hours <= 6) or (request.urgency and request.urgency.lower() in ['high', 'urgent', 'express'])
        is_low_urgency = request.urgency and request.urgency.lower() in ['low', 'economy', 'flexible']
        urgency_level = 1.20 if is_high_urgency else (0.85 if is_low_urgency else 1.00)
        urgency_name = "high" if is_high_urgency else ("low" if is_low_urgency else "standard")

        # Multipliers for transparency
        demand_mult = 1.0 + 0.35 * math.log2(max(0.5, sd_ratio) + 0.1) if sd_ratio >= 1.0 else max(0.75, 1.0 - 0.25 * (1.0 - sd_ratio))
        fuel_mult = 1.0 + (self.FUEL_COST_WEIGHT * (fuel_price_index - 1.0))
        congestion_mult = 1.0 + (congestion_level * 0.20)
        cargo_mult = 1.35 if "refrig" in request.cargo_type.lower() or "perish" in request.cargo_type.lower() else (1.45 if "haz" in request.cargo_type.lower() else 1.0)

        # 2. Execute ML Model Prediction if available
        model_prediction = None
        if self.model and self.feature_names:
            try:
                row = {f: 0 for f in self.feature_names}
                row["distance_km"] = distance_km
                row["cargo_weight_tons"] = weight_tons
                row["fuel_price_etb"] = current_diesel
                row["base_corridor_rate"] = base_corridor_rate
                row["seasonality_index"] = seasonality
                row["road_condition_factor"] = road_factor
                row["available_trucks"] = available_trucks
                row["pending_loads"] = active_loads
                row["supply_demand_ratio"] = sd_ratio
                row["urgency_level"] = urgency_level

                # Set One-Hot Columns
                orig_col = self.ORIGIN_COL_MAP.get(request.origin.city.strip().lower(), "origin_Modjo Dry Port")
                dest_col = self.DEST_COL_MAP.get(request.destination.city.strip().lower(), "destination_Kality Container Depot")
                cargo_col = self.CARGO_COL_MAP.get(request.cargo_type.strip().lower(), "cargo_type_DRY_CARGO")
                truck_col = self.TRUCK_COL_MAP.get((request.truck_type or "flatbed").strip().lower(), "truck_type_required_FLATBED")

                if orig_col in row:
                    row[orig_col] = 1
                if dest_col in row:
                    row[dest_col] = 1
                if cargo_col in row:
                    row[cargo_col] = 1
                if truck_col in row:
                    row[truck_col] = 1

                df = pd.DataFrame([row])[self.feature_names]
                pred = float(self.model.predict(df)[0])
                model_prediction = max(1000.0, pred)
            except Exception as e:
                print(f"[WARNING] ML inference error: {e}. Falling back to analytical model.")

        if model_prediction is None:
            weight_factor = (weight_tons / 20.0) if weight_tons <= 20.0 else (1.0 + (weight_tons - 20.0) * 0.045)
            model_prediction = base_corridor_rate * weight_factor * demand_mult * fuel_mult * congestion_mult * cargo_mult * urgency_level

        raw_price = model_prediction

        # 3. Volatility Floor & Ceiling Protection Bounds (Section 8.3)
        weight_scale = (weight_tons / 20.0) if weight_tons <= 20.0 else (1.0 + (weight_tons - 20.0) * 0.045)
        scaled_base = base_corridor_rate * weight_scale * cargo_mult
        price_floor = round(scaled_base * self.FLOOR_MULTIPLIER, 2)
        price_ceiling = round(scaled_base * self.CEILING_MULTIPLIER, 2)

        is_clamped = False
        clamp_reason = None
        final_price = raw_price

        if raw_price < price_floor:
            final_price = price_floor
            is_clamped = True
            clamp_reason = f"Rate clamped to volatility floor minimum ({request.currency} {price_floor:,.2f})"
        elif raw_price > price_ceiling:
            final_price = price_ceiling
            is_clamped = True
            clamp_reason = f"Rate clamped to surge protection ceiling maximum ({request.currency} {price_ceiling:,.2f})"

        final_price = round(final_price, 2)
        rate_per_kg = round(final_price / max(1.0, request.weight_kg), 4)
        rate_per_ton_km = round(final_price / (max(0.1, weight_tons) * max(1.0, distance_km)), 4)

        breakdown = PriceBreakdown(
            base_corridor_rate=round(base_corridor_rate, 2),
            distance_km=round(distance_km, 1),
            weight_tons=weight_tons,
            supply_demand_ratio=sd_ratio,
            demand_multiplier=round(demand_mult, 4),
            fuel_price_index=fuel_price_index,
            fuel_multiplier=round(fuel_mult, 4),
            congestion_level=round(congestion_level, 2),
            congestion_multiplier=round(congestion_mult, 4),
            cargo_type=request.cargo_type,
            cargo_type_multiplier=round(cargo_mult, 2),
            urgency=urgency_name,
            urgency_multiplier=round(urgency_level, 2),
            model_prediction=round(model_prediction, 2),
            raw_calculated_price=round(raw_price, 2),
            price_floor=price_floor,
            price_ceiling=price_ceiling,
            is_clamped=is_clamped,
            clamp_reason=clamp_reason,
            final_spot_price=final_price,
            rate_per_kg=rate_per_kg,
            rate_per_ton_km=rate_per_ton_km,
            currency=request.currency,
        )

        expires_at = datetime.fromtimestamp(now.timestamp() + 3600, tz=timezone.utc)

        response = SpotPriceResponse(
            calculation_id=calc_id,
            timestamp=now,
            corridor_matched=corridor_id,
            spot_price=final_price,
            currency=request.currency,
            rate_per_kg=rate_per_kg,
            rate_per_ton_km=rate_per_ton_km,
            model_confidence_r2=float(self.metrics.get("r2", 0.9991)),
            breakdown=breakdown,
            validity_minutes=60,
            expires_at=expires_at,
        )

        # 4. Audit Trail Logging (FR-04.3)
        self.audit_logs[calc_id] = AuditLogRecord(
            calculation_id=calc_id,
            timestamp=now,
            request=request,
            response=response,
        )

        return response

    def evaluate_contract_rate(self, request: ContractEvaluationRequest) -> ContractEvaluationResponse:
        """
        Evaluates a locked contract rate against prevailing spot rate (FR-04.2).
        Flags material divergence (> threshold %) for renegotiation review.
        """
        eval_id = f"REV-{uuid.uuid4().hex[:10].upper()}"
        now = datetime.now(timezone.utc)

        # 1. Compute prevailing spot rate for identical shipment parameters
        spot_req = SpotPriceRequest(
            origin=request.origin,
            destination=request.destination,
            cargo_type=request.cargo_type,
            weight_kg=request.weight_kg,
            urgency=request.urgency,
            currency=request.currency,
            shipper_id=request.shipper_id,
        )
        spot_quote = self.calculate_spot_price(spot_req)
        prevailing_spot = spot_quote.spot_price

        # 2. Compute Divergence Percentage
        delta = prevailing_spot - request.contract_rate
        divergence_percent = round((delta / request.contract_rate) * 100.0, 2)

        if divergence_percent > 0.5:
            direction = "PREMIUM"
        elif divergence_percent < -0.5:
            direction = "DISCOUNT"
        else:
            direction = "AT_PAR"

        abs_divergence = abs(divergence_percent)
        threshold = request.divergence_threshold_percent
        is_renegotiation = abs_divergence >= threshold

        if abs_divergence < 5.0:
            severity = "ALIGNED"
            message = f"Contract rate ({request.currency} {request.contract_rate:,.2f}) is closely aligned with prevailing spot market ({request.currency} {prevailing_spot:,.2f}, diff: {divergence_percent:+0.1f}%)."
        elif abs_divergence < threshold:
            severity = "MODERATE_DIVERGENCE"
            message = f"Contract rate shows normal variance ({divergence_percent:+0.1f}% vs spot rate {request.currency} {prevailing_spot:,.2f}). Within acceptable threshold (+/-{threshold}%)."
        else:
            severity = "CRITICAL_RENEGOTIATION_REQUIRED"
            if direction == "PREMIUM":
                message = (
                    f"CRITICAL: Prevailing spot rate ({request.currency} {prevailing_spot:,.2f}) is {divergence_percent:+0.1f}% higher than contract rate "
                    f"({request.currency} {request.contract_rate:,.2f}), exceeding the {threshold}% threshold. High risk of transporter refusal. Renegotiation recommended."
                )
            else:
                message = (
                    f"CRITICAL: Prevailing spot rate ({request.currency} {prevailing_spot:,.2f}) is {divergence_percent:+0.1f}% lower than contract rate "
                    f"({request.currency} {request.contract_rate:,.2f}), exceeding the {threshold}% threshold. Shipper is significantly overpaying relative to spot market. Renegotiation recommended."
                )

        return ContractEvaluationResponse(
            contract_rate=round(request.contract_rate, 2),
            prevailing_spot_rate=round(prevailing_spot, 2),
            currency=request.currency,
            divergence_percent=divergence_percent,
            divergence_direction=direction,
            is_renegotiation_recommended=is_renegotiation,
            severity=severity,
            message=message,
            evaluation_id=eval_id,
            timestamp=now,
            spot_quote_summary=spot_quote,
        )

    def get_corridors(self) -> List[CorridorBenchmark]:
        """Returns active corridor benchmark states."""
        return list(self.corridors.values())

    def update_corridor_metrics(
        self,
        corridor_id: str,
        current_diesel_price: Optional[float] = None,
        active_loads_count: Optional[int] = None,
        available_trucks_count: Optional[int] = None,
        congestion_score: Optional[float] = None,
        road_condition_factor: Optional[float] = None,
    ) -> Optional[CorridorBenchmark]:
        """Updates real-time corridor telematics and market indicators."""
        corridor = self.corridors.get(corridor_id.upper())
        if not corridor:
            return None

        if current_diesel_price is not None:
            corridor.current_diesel_etb_per_liter = current_diesel_price
        if active_loads_count is not None:
            corridor.active_loads_count = active_loads_count
        if available_trucks_count is not None:
            corridor.available_trucks_count = available_trucks_count
        if congestion_score is not None:
            corridor.congestion_score = max(0.0, min(1.0, congestion_score))
        if road_condition_factor is not None:
            corridor.road_condition_factor = max(0.8, min(2.0, road_condition_factor))

        corridor.last_updated = datetime.now(timezone.utc)
        return corridor

    def get_audit_record(self, calculation_id: str) -> Optional[AuditLogRecord]:
        """Fetches audit record by ID (FR-04.3)."""
        return self.audit_logs.get(calculation_id)

    def list_audit_records(self, limit: int = 50) -> List[AuditLogRecord]:
        """Lists recent calculation audit records (FR-04.3)."""
        records = list(self.audit_logs.values())
        records.sort(key=lambda r: r.timestamp, reverse=True)
        return records[:limit]


# Global pricing engine instance
pricing_engine = DynamicSpotPricingEngine()
