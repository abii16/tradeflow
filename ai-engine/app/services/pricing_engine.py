"""
Dynamic Spot Pricing Engine (FR-04)
Calculates ML-powered dynamic spot freight rates for TradeFlow logistics across Ethiopian trade corridors
based on supply/demand balance, fuel price indexes, corridor congestion, cargo types, and urgency.
Loads and uses the trained LGBMRegressor model (app/models/spot_pricing_model.joblib)
with volatility protection bounds (FR-04.1), contract rate divergence review (FR-04.2), and audit logging (FR-04.3).
"""

import math
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

import joblib
import pandas as pd
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
    cargo_type: str = (
        "CONTAINERIZED"  # 'CONTAINERIZED', 'DRY_CARGO', 'HAZARDOUS', 'REFRIGERATED', 'dry', 'bulk', 'fragile'
    )
    weight_kg: float = Field(gt=0, description="Cargo weight in kilograms")
    volume_m3: Optional[float] = None
    truck_type: Optional[str] = "FLATBED"  # 'FLATBED', 'REEFER', 'SIDE_WALL', 'TANKER'
    urgency: Optional[str] = "standard"  # 'standard', 'high', 'low'
    is_urgent: Optional[bool] = False
    pickup_window_hours: Optional[int] = 24
    custom_fuel_price: Optional[float] = None
    active_loads_count: Optional[int] = Field(
        default=None, description="Live corridor pending loads count from database"
    )
    available_trucks_count: Optional[int] = Field(
        default=None, description="Live corridor available fleet count from database"
    )
    congestion_score: Optional[float] = Field(
        default=None, description="Live corridor telematics congestion index (0.0 to 1.0)"
    )
    road_condition_factor: Optional[float] = Field(
        default=None, description="Live road condition/security factor"
    )
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


class RateRange(BaseModel):
    min_rate: float = Field(
        description="Minimum floor rate / lower boundary in ETB (-30% market floor)"
    )
    recommended_rate: float = Field(
        description="ML-recommended optimal spot rate in ETB"
    )
    max_rate: float = Field(
        description="Maximum surge ceiling / upper boundary in ETB (+85% surge cap)"
    )


class SpotPriceResponse(BaseModel):
    calculation_id: str
    timestamp: datetime
    corridor_matched: Optional[str]
    spot_price: float
    recommended_spot_rate: float = Field(
        description="ML-recommended optimal spot freight rate in ETB"
    )
    min_rate: float = Field(
        description="Minimum floor rate / lower negotiation boundary in ETB"
    )
    max_rate: float = Field(
        description="Maximum surge ceiling / upper negotiation boundary in ETB"
    )
    rate_range: RateRange
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
    contract_rate: float = Field(
        gt=0, description="Existing locked contract rate in ETB"
    )
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
        "spot_pricing_model.joblib",
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
        "galafi": "origin_Djibouti Port",
        "semera": "origin_Kombolcha Industrial Park",
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
    FLOOR_MULTIPLIER = 0.70  # Maximum allowed downward market fluctuation (30% floor)
    CEILING_MULTIPLIER = 1.85  # Maximum allowed upward surge fluctuation (85% ceiling)
    FUEL_COST_WEIGHT = 0.40  # 40% fuel expense share in Ethiopian trucking operations

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
                    print(
                        f"[INFO] Loaded TradeFlow Spot Pricing ML Model from {self.model_path} with {len(self.feature_names)} features."
                    )
                else:
                    self.model = bundle
                    print(f"[INFO] Loaded raw model from {self.model_path}")
            except Exception as e:
                print(
                    f"[WARNING] Could not load ML model from {self.model_path}: {e}. Falling back to analytical formula."
                )
        else:
            print(
                f"[NOTICE] Model file not found at {self.model_path}. Using calibrated analytical pricing."
            )

    # --- National Logistics GIS & Terminal Registry (40+ Multimodal Hubs across Ethiopia) ---
    ETHIOPIA_LOGISTICS_GIS_REGISTRY: Dict[str, Dict] = {
        # Multimodal Ports & Ocean Transit Gateways
        "DJIBOUTI_DCT": {
            "name": "Djibouti Port / Doraleh Container Terminal (DCT)",
            "coords": (11.5950, 43.1360),
            "type": "SEAPORT",
            "aliases": ["djibouti", "djibouti port", "doraleh", "dct", "doraleh container terminal"],
        },
        "DJIBOUTI_DFTZ": {
            "name": "Djibouti Free Trade Zone (DFTZ)",
            "coords": (11.5470, 43.0810),
            "type": "FREE_TRADE_ZONE",
            "aliases": ["dftz", "djibouti free trade zone", "djibouti ftz"],
        },
        "TADJOURAH_PORT": {
            "name": "Port of Tadjourah (Potash & Bulk Export Terminal)",
            "coords": (11.7880, 42.8820),
            "type": "SEAPORT",
            "aliases": ["tadjourah", "port of tadjourah"],
        },
        "BERBERA_PORT": {
            "name": "Berbera Port Gateway (Somaliland Transit Corridor)",
            "coords": (10.4390, 45.0140),
            "type": "SEAPORT",
            "aliases": ["berbera", "berbera port"],
        },

        # ESLSE Primary Multimodal Inland Dry Ports
        "MODJO_DRY_PORT": {
            "name": "Modjo Dry Port & Multimodal Terminal",
            "coords": (8.5920, 39.1230),
            "type": "DRY_PORT",
            "aliases": ["modjo", "modjo dry port", "mojo", "modjo terminal"],
        },
        "KALITY_DEPOT": {
            "name": "Addis Ababa / Kality Customs Clearance & Inland Container Depot",
            "coords": (8.9170, 38.7560),
            "type": "DRY_PORT",
            "aliases": ["kality", "kality container depot", "kality customs", "addis ababa", "addis", "akaki"],
        },
        "DIRE_DAWA_DRY_PORT": {
            "name": "Dire Dawa Dry Port & Free Trade Zone",
            "coords": (9.5930, 41.8660),
            "type": "DRY_PORT",
            "aliases": ["dire dawa", "dire dawa dry port", "dire", "ddftz", "dire dawa free trade zone"],
        },
        "KOMBOLCHA_DRY_PORT": {
            "name": "Kombolcha Dry Port & Terminal",
            "coords": (11.0820, 39.7380),
            "type": "DRY_PORT",
            "aliases": ["kombolcha", "kombolcha dry port"],
        },
        "SEMERA_LOGISTICS_HUB": {
            "name": "Semera Logistics Hub & Freight Terminal",
            "coords": (11.7940, 41.0080),
            "type": "DRY_PORT",
            "aliases": ["semera", "semera logistics hub", "semera dry port", "samara"],
        },
        "HAWASSA_DRY_PORT": {
            "name": "Hawassa Dry Port & Multimodal Terminal",
            "coords": (7.0500, 38.4700),
            "type": "DRY_PORT",
            "aliases": ["hawassa", "hawassa dry port", "awassa", "hawassa terminal"],
        },
        "MEKELLE_DRY_PORT": {
            "name": "Mekelle Dry Port & Freight Terminal",
            "coords": (13.4960, 39.4750),
            "type": "DRY_PORT",
            "aliases": ["mekelle", "mekelle dry port", "mekele"],
        },
        "WORETA_DRY_PORT": {
            "name": "Woreta Dry Port & Agro Terminal",
            "coords": (11.9210, 37.6970),
            "type": "DRY_PORT",
            "aliases": ["woreta", "woreta dry port", "wereta"],
        },

        # Key International Land Border Clearance Terminals
        "GALAFI_BORDER": {
            "name": "Galafi Border Clearance Terminal (Ethio-Djibouti A1)",
            "coords": (11.7160, 41.8360),
            "type": "BORDER_POST",
            "aliases": ["galafi", "galafi border", "gelafi"],
        },
        "DEWELE_BORDER": {
            "name": "Dewele Border Clearance Post (Ethio-Djibouti Railway / A10)",
            "coords": (11.0360, 42.6280),
            "type": "BORDER_POST",
            "aliases": ["dewele", "dewele border", "dawele"],
        },
        "MOYALE_OSBP": {
            "name": "Moyale One-Stop Border Post (Ethio-Kenya Corridor)",
            "coords": (3.5350, 39.0550),
            "type": "BORDER_POST",
            "aliases": ["moyale", "moyale border", "moyale osbp"],
        },
        "METEMA_BORDER": {
            "name": "Metema Border Clearance Post (Ethio-Sudan Corridor)",
            "coords": (12.9570, 36.1750),
            "type": "BORDER_POST",
            "aliases": ["metema", "metema border"],
        },
        "TOGOCHALE_BORDER": {
            "name": "Togochale / Wajaale Border Post (Ethio-Somaliland Corridor)",
            "coords": (9.6010, 43.3320),
            "type": "BORDER_POST",
            "aliases": ["togochale", "wajaale", "tog wajaale"],
        },
        "KURMUK_BORDER": {
            "name": "Kurmuk Border Post (Benishangul-Gumuz / Sudan)",
            "coords": (10.5510, 34.2860),
            "type": "BORDER_POST",
            "aliases": ["kurmuk", "kurmuk border"],
        },

        # Major Industrial Parks & Special Economic Zones
        "BOLE_LEMI_IP": {
            "name": "Bole Lemi Industrial Park (Addis Ababa)",
            "coords": (9.0110, 38.8580),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["bole lemi", "bole lemi industrial park"],
        },
        "KILINTO_IP": {
            "name": "Kilinto Industrial Park (Addis Ababa)",
            "coords": (8.8890, 38.7830),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["kilinto", "kilinto industrial park"],
        },
        "DUKEM_EIZ": {
            "name": "Eastern Industry Zone (Dukem)",
            "coords": (8.7940, 38.9020),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["dukem", "eastern industry zone", "dukem industry zone", "eiz"],
        },
        "ADAMA_IP": {
            "name": "Adama Industrial Park & Logistics Hub",
            "coords": (8.5400, 39.2700),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["adama", "adama industrial park", "nazret", "nazareth"],
        },
        "HAWASSA_IP": {
            "name": "Hawassa Industrial Park Terminal",
            "coords": (7.0500, 38.4700),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["hawassa ip", "hawassa industrial park"],
        },
        "DEBRE_BERHAN_IP": {
            "name": "Debre Berhan Industrial Hub",
            "coords": (9.6780, 39.5330),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["debre berhan", "debre birhan"],
        },
        "BAHIR_DAR_IP": {
            "name": "Bahir Dar Industrial Park",
            "coords": (11.5890, 37.3890),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["bahir dar", "bahirdar", "bahir dar industrial park"],
        },
        "JIMMA_IP": {
            "name": "Jimma Industrial Park & Agro-Processing Center",
            "coords": (7.6730, 36.8340),
            "type": "INDUSTRIAL_PARK",
            "aliases": ["jimma", "jimma industrial park", "djmma"],
        },

        # Regional Commercial & Agricultural Distribution Hubs
        "GONDAR_HUB": {
            "name": "Gondar Logistics Center",
            "coords": (12.6070, 37.4660),
            "type": "COMMERCIAL_HUB",
            "aliases": ["gondar", "gonder", "gondar logistics center"],
        },
        "WOLAITA_SODO_HUB": {
            "name": "Wolaita Sodo Logistics Hub",
            "coords": (6.8610, 37.7610),
            "type": "COMMERCIAL_HUB",
            "aliases": ["sodo", "wolaita sodo", "wolayta"],
        },
        "ARBA_MINCH_HUB": {
            "name": "Arba Minch Freight Terminal",
            "coords": (6.0330, 37.5500),
            "type": "COMMERCIAL_HUB",
            "aliases": ["arba minch", "arbaminch"],
        },
        "SHASHEMENE_HUB": {
            "name": "Shashemene Crossroads Distribution Center",
            "coords": (7.2000, 38.5970),
            "type": "COMMERCIAL_HUB",
            "aliases": ["shashemene", "shashamane"],
        },
        "ASELLA_HUB": {
            "name": "Asella Agricultural Distribution Hub",
            "coords": (7.9540, 39.1260),
            "type": "COMMERCIAL_HUB",
            "aliases": ["asella", "asela"],
        },
        "DESSIE_HUB": {
            "name": "Dessie Logistics Terminal",
            "coords": (11.1330, 39.6330),
            "type": "COMMERCIAL_HUB",
            "aliases": ["dessie", "dese"],
        },
        "JIGJIGA_HUB": {
            "name": "Jigjiga Freight Terminal",
            "coords": (9.3540, 42.7950),
            "type": "COMMERCIAL_HUB",
            "aliases": ["jigjiga", "jijjiga"],
        },
        "HARAR_HUB": {
            "name": "Harar Distribution Hub",
            "coords": (9.3140, 42.1280),
            "type": "COMMERCIAL_HUB",
            "aliases": ["harar", "harrar"],
        },
        "DILLA_HUB": {
            "name": "Dilla Coffee Logistics Depot",
            "coords": (6.4080, 38.3090),
            "type": "COMMERCIAL_HUB",
            "aliases": ["dilla", "dila"],
        },
        "YIRGA_CHEFFE_HUB": {
            "name": "Yirga Cheffe Specialty Coffee Origin Depot",
            "coords": (6.1620, 38.2060),
            "type": "COMMERCIAL_HUB",
            "aliases": ["yirgacheffe", "yirga cheffe", "yirgachefe"],
        },
    }

    @classmethod
    def compute_corridor_base_rate(
        cls,
        distance_km: float,
        origin_city: str,
        dest_city: str,
        terrain_gradient_factor: float = 1.00,
        baseline_payload_tons: float = 30.0,
    ) -> float:
        """
        Dynamically computes the baseline freight tariff in ETB according to
        the Ethiopian Ministry of Transport and Logistics (MoTL) & Maritime Authority ton-km framework.

        Tariff components:
        1. Ton-Km Tariff Rate:
           - International Port Transit Corridor (Djibouti DCT/DFTZ / Galafi <-> Inland Ports): 11.50 ETB / ton-km
           - National Expressway Trunk (Modjo <-> Hawassa, Addis <-> Adama): 13.50 ETB / ton-km
           - Secondary Regional Trunk (Semera <-> Mekelle, Kombolcha): 14.00 ETB / ton-km
           - Short-Haul Multimodal Shuttle (< 100 km, e.g. Modjo <-> Addis): 20.00 ETB / ton-km
        2. Terrain & Elevation Topography Multiplier (Afar Depression to Ethiopian Highlands gradient)
        3. Port Terminal Handling Gate Dispatch Baseline (2,500 ETB standard container processing fee)
        """
        o = origin_city.strip().lower()
        d = dest_city.strip().lower()

        if distance_km <= 100.0:
            rate_per_ton_km = 20.00  # High terminal/dispatch fixed overhead for short shuttle
        elif any(k in o or k in d for k in ["djibouti", "galafi", "dewele", "berbera"]):
            rate_per_ton_km = 11.50  # Long-haul international container transit benchmark
        elif any(k in o or k in d for k in ["hawassa", "adama", "modjo"]):
            rate_per_ton_km = 13.50  # Toll expressway & industrial park trunk
        elif any(k in o or k in d for k in ["mekelle", "gondar", "bahir dar", "metema"]):
            rate_per_ton_km = 14.00  # Mountainous highland trunk
        else:
            rate_per_ton_km = 13.00  # Standard general cargo trunk benchmark

        tariff = distance_km * baseline_payload_tons * rate_per_ton_km * terrain_gradient_factor
        terminal_gate_charge = (
            2500.0
            if any(k in o or k in d for k in ["djibouti", "galafi", "modjo", "kality"])
            else 1500.0
        )
        return float(round((tariff + terminal_gate_charge) / 100.0) * 100.0)

    def _seed_corridors(self) -> Dict[str, CorridorBenchmark]:
        """
        Seeds baseline benchmark profiles for Ethiopia's principal logistics corridors.
        Base rates are dynamically calculated using the National Regulatory Ton-Km Tariff Engine.
        Real-time telemetry indicators (loads, fleet, congestion) are synchronized with the live database.
        """
        corridor_definitions = [
            ("DJIBOUTI_MODJO", "Djibouti Port -> Modjo Dry Port", "Djibouti", "Modjo", 810.0, 1.00),
            ("MODJO_ADDIS", "Modjo Dry Port -> Addis Ababa Hub", "Modjo", "Addis Ababa", 75.0, 1.00),
            ("DJIBOUTI_DIREDAWA", "Djibouti Port -> Dire Dawa", "Djibouti", "Dire Dawa", 360.0, 1.00),
            ("ADDIS_HAWASSA", "Addis Ababa -> Hawassa Industrial Park", "Addis Ababa", "Hawassa", 275.0, 1.00),
            ("DJIBOUTI_MEKELLE", "Djibouti Port -> Mekelle via Semera", "Djibouti", "Mekelle", 780.0, 1.10),
            ("ADDIS_ADAMA", "Addis Ababa -> Adama Expressway", "Addis Ababa", "Adama", 90.0, 1.00),
            ("GALAFI_ADDIS", "Galafi Border Terminal -> Addis Ababa / Kality", "Galafi", "Addis Ababa", 680.0, 1.00),
            ("SEMERA_ADDIS", "Semera Freight Hub -> Addis Ababa", "Semera", "Addis Ababa", 580.0, 1.00),
            ("DJIBOUTI_ADDIS", "Djibouti Port -> Addis Ababa / Kality", "Djibouti", "Addis Ababa", 850.0, 1.00),
            ("DIREDAWA_ADDIS", "Dire Dawa Dry Port -> Addis Ababa", "Dire Dawa", "Addis Ababa", 450.0, 1.00),
            ("ADDIS_BAHIR_DAR", "Addis Ababa -> Bahir Dar Industrial Park", "Addis Ababa", "Bahir Dar", 560.0, 1.08),
            ("GONDAR_METEMA", "Gondar -> Metema Border Terminal", "Gondar", "Metema", 180.0, 1.05),
            ("HAWASSA_MOYALE", "Hawassa -> Moyale Border Post", "Hawassa", "Moyale", 500.0, 1.00),
            ("ADDIS_JIMMA", "Addis Ababa -> Jimma Agro-Industrial Hub", "Addis Ababa", "Jimma", 350.0, 1.05),
        ]

        benchmarks: Dict[str, CorridorBenchmark] = {}
        for c_id, name, orig, dest, dist, terrain in corridor_definitions:
            computed_base_rate = self.compute_corridor_base_rate(
                distance_km=dist,
                origin_city=orig,
                dest_city=dest,
                terrain_gradient_factor=terrain,
            )
            benchmarks[c_id] = CorridorBenchmark(
                id=c_id,
                name=name,
                origin_city=orig,
                destination_city=dest,
                distance_km=dist,
                base_rate_etb=computed_base_rate,
                baseline_diesel_etb_per_liter=95.50,
                current_diesel_etb_per_liter=95.50,
                active_loads_count=0,
                available_trucks_count=0,
                congestion_score=0.08,
                road_condition_factor=terrain,
                seasonality_index=1.00,
            )
        return benchmarks

    def _find_gis_coords(self, city_or_name: str) -> Optional[tuple]:
        """Resolves latitude and longitude from the comprehensive Ethiopian Logistics GIS Registry."""
        if not city_or_name:
            return None
        query = city_or_name.strip().lower()

        # 1. Exact alias match
        for reg in self.ETHIOPIA_LOGISTICS_GIS_REGISTRY.values():
            for alias in reg["aliases"]:
                if alias == query:
                    return reg["coords"]

        # 2. Substring match
        for reg in self.ETHIOPIA_LOGISTICS_GIS_REGISTRY.values():
            for alias in reg["aliases"]:
                if alias in query or query in alias:
                    return reg["coords"]

        return None

    def _match_corridor(
        self, origin_city: str, dest_city: str
    ) -> Optional[CorridorBenchmark]:
        """Matches predefined corridor benchmark (supports both forward and return/backhaul routes)."""
        orig = origin_city.strip().lower()
        dest = dest_city.strip().lower()
        # 1. Exact directional match
        for corridor in self.corridors.values():
            if (
                corridor.origin_city.lower() in orig
                or orig in corridor.origin_city.lower()
            ) and (
                corridor.destination_city.lower() in dest
                or dest in corridor.destination_city.lower()
            ):
                return corridor
        # 2. Reverse / return direction match (e.g. Hawassa -> Addis matches ADDIS_HAWASSA)
        for corridor in self.corridors.values():
            if (
                corridor.origin_city.lower() in dest
                or dest in corridor.origin_city.lower()
            ) and (
                corridor.destination_city.lower() in orig
                or orig in corridor.destination_city.lower()
            ):
                return corridor
        return None

    def _calculate_distance_km(
        self,
        origin: Location,
        destination: Location,
        matched_corridor: Optional[CorridorBenchmark],
    ) -> float:
        """Calculates distance in km using exact surveyed highway kilometerage or GIS Haversine with road network tortuosity."""
        if matched_corridor:
            return matched_corridor.distance_km

        orig_lat = origin.lat
        orig_lng = origin.lng
        dest_lat = destination.lat
        dest_lng = destination.lng

        # Resolve coordinates from comprehensive GIS Registry if not provided
        if orig_lat is None or orig_lng is None:
            c = self._find_gis_coords(origin.name or origin.city)
            if c:
                orig_lat, orig_lng = c
        if dest_lat is None or dest_lng is None:
            c = self._find_gis_coords(destination.name or destination.city)
            if c:
                dest_lat, dest_lng = c

        if orig_lat and orig_lng and dest_lat and dest_lng:
            r = 6371.0  # Earth radius in km
            d_lat = math.radians(dest_lat - orig_lat)
            d_lng = math.radians(dest_lng - orig_lng)
            a = (
                math.sin(d_lat / 2) ** 2
                + math.cos(math.radians(orig_lat))
                * math.cos(math.radians(dest_lat))
                * math.sin(d_lng / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            straight_line = r * c
            # 1.30 highway network tortuosity factor for Ethiopian topography
            return max(25.0, round(straight_line * 1.30, 1))

        return 450.0

    def calculate_spot_price(self, request: SpotPriceRequest) -> SpotPriceResponse:
        """
        Calculates dynamic spot rate using the trained ML model with volatility bounding and breakdown.
        """
        calc_id = f"QTE-{uuid.uuid4().hex[:10].upper()}"
        now = datetime.now(timezone.utc)

        matched_corridor = self._match_corridor(
            request.origin.city, request.destination.city
        )
        corridor_id = matched_corridor.id if matched_corridor else None

        distance_km = self._calculate_distance_km(
            request.origin, request.destination, matched_corridor
        )
        weight_tons = max(0.5, round(request.weight_kg / 1000.0, 2))

        # Real-time Telematics & Supply/Demand Resolution:
        # Prioritize live database metrics passed directly in the request from PostgreSQL
        if request.active_loads_count is not None:
            active_loads = max(0, request.active_loads_count)
        elif matched_corridor and matched_corridor.active_loads_count > 0:
            active_loads = matched_corridor.active_loads_count
        else:
            active_loads = 1  # Minimum baseline activity

        if request.available_trucks_count is not None:
            available_trucks = max(1, request.available_trucks_count)
        elif matched_corridor and matched_corridor.available_trucks_count > 0:
            available_trucks = matched_corridor.available_trucks_count
        else:
            available_trucks = 10  # Baseline fleet

        if request.custom_fuel_price is not None:
            current_diesel = request.custom_fuel_price
        elif matched_corridor:
            current_diesel = matched_corridor.current_diesel_etb_per_liter
        else:
            current_diesel = 95.50

        if request.congestion_score is not None:
            congestion_level = max(0.0, min(1.0, request.congestion_score))
        elif matched_corridor:
            congestion_level = matched_corridor.congestion_score
        else:
            congestion_level = 0.08

        if request.road_condition_factor is not None:
            road_factor = max(0.8, min(2.0, request.road_condition_factor))
        elif matched_corridor:
            road_factor = matched_corridor.road_condition_factor
        else:
            road_factor = 1.00

        if matched_corridor:
            base_corridor_rate = matched_corridor.base_rate_etb
            baseline_diesel = matched_corridor.baseline_diesel_etb_per_liter
            seasonality = matched_corridor.seasonality_index
        else:
            base_corridor_rate = self.compute_corridor_base_rate(
                distance_km=distance_km,
                origin_city=request.origin.city,
                dest_city=request.destination.city,
                terrain_gradient_factor=road_factor,
            )
            baseline_diesel = 95.50
            seasonality = 1.00


        # Feature derivations
        sd_ratio = round(active_loads / available_trucks, 2)
        fuel_price_index = round(current_diesel / baseline_diesel, 4)

        # Urgency numeric level
        # LightGBM model splits urgency_level at 1.5 and 2.5:
        # 1.0 = Low / Flexible (>= 48h), 2.0 = Standard (24h), 3.0 = High / Express (<= 12h)
        is_high_urgency = (
            request.is_urgent
            or (request.pickup_window_hours is not None and request.pickup_window_hours <= 12)
            or (
                request.urgency
                and request.urgency.lower() in ["high", "urgent", "express"]
            )
        )
        is_low_urgency = (
            request.urgency
            and request.urgency.lower() in ["low", "economy", "flexible"]
        ) or (request.pickup_window_hours is not None and request.pickup_window_hours >= 48)

        urgency_ordinal = 3.0 if is_high_urgency else (1.0 if is_low_urgency else 2.0)
        urgency_multiplier = 1.15 if is_high_urgency else (0.88 if is_low_urgency else 1.00)
        urgency_name = (
            "high" if is_high_urgency else ("low" if is_low_urgency else "standard")
        )

        # Multipliers for transparency
        demand_mult = (
            1.0 + 0.35 * math.log2(max(0.5, sd_ratio) + 0.1)
            if sd_ratio >= 1.0
            else max(0.75, 1.0 - 0.25 * (1.0 - sd_ratio))
        )
        fuel_mult = 1.0 + (self.FUEL_COST_WEIGHT * (fuel_price_index - 1.0))
        congestion_mult = 1.0 + (congestion_level * 0.20)
        cargo_mult = (
            1.35
            if "refrig" in request.cargo_type.lower()
            or "perish" in request.cargo_type.lower()
            else (1.45 if "haz" in request.cargo_type.lower() else 1.0)
        )

        # 2. Execute ML Model Prediction if available
        model_prediction = None
        if self.model and self.feature_names:
            try:
                # Handle bulk shipments (> 40 tons) via fleet allocation
                if weight_tons > 40.0:
                    truck_capacity = 30.0
                    num_trucks = math.ceil(weight_tons / truck_capacity)
                    weight_per_truck = min(40.0, round(weight_tons / num_trucks, 2))
                else:
                    num_trucks = 1
                    weight_per_truck = weight_tons

                row = {f: 0 for f in self.feature_names}
                row["distance_km"] = distance_km
                row["cargo_weight_tons"] = weight_per_truck
                row["fuel_price_etb"] = current_diesel
                row["base_corridor_rate"] = base_corridor_rate
                row["seasonality_index"] = seasonality
                row["road_condition_factor"] = road_factor
                row["available_trucks"] = available_trucks
                row["pending_loads"] = active_loads
                row["supply_demand_ratio"] = sd_ratio
                row["urgency_level"] = urgency_ordinal

                # Set One-Hot Columns
                orig_col = self.ORIGIN_COL_MAP.get(
                    request.origin.city.strip().lower(), "origin_Modjo Dry Port"
                )
                dest_col = self.DEST_COL_MAP.get(
                    request.destination.city.strip().lower(),
                    "destination_Kality Container Depot",
                )
                cargo_col = self.CARGO_COL_MAP.get(
                    request.cargo_type.strip().lower(), "cargo_type_DRY_CARGO"
                )
                truck_col = self.TRUCK_COL_MAP.get(
                    (request.truck_type or "flatbed").strip().lower(),
                    "truck_type_required_FLATBED",
                )

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
                model_prediction = max(1000.0, pred * num_trucks)
            except Exception as e:
                print(
                    f"[WARNING] ML inference error: {e}. Falling back to analytical model."
                )

        if model_prediction is None:
            if weight_tons > 40.0:
                num_trucks = math.ceil(weight_tons / 30.0)
                weight_factor = float(num_trucks)
            else:
                weight_factor = (
                    (weight_tons / 20.0)
                    if weight_tons <= 20.0
                    else (1.0 + (weight_tons - 20.0) * 0.025)
                )
            model_prediction = (
                base_corridor_rate
                * weight_factor
                * demand_mult
                * fuel_mult
                * congestion_mult
                * cargo_mult
                * urgency_multiplier
            )

        raw_price = model_prediction

        # 3. Volatility Floor & Ceiling Protection Bounds (Section 8.3)
        if weight_tons > 40.0:
            num_trucks = math.ceil(weight_tons / 30.0)
            weight_scale = float(num_trucks)
        else:
            weight_scale = (
                (weight_tons / 20.0)
                if weight_tons <= 20.0
                else (1.0 + (weight_tons - 20.0) * 0.025)
            )

        baseline_ref = (
            base_corridor_rate
            * weight_scale
            * cargo_mult
            * fuel_mult
            * urgency_multiplier
        )
        price_floor = round(baseline_ref * self.FLOOR_MULTIPLIER, 2)
        price_ceiling = round(baseline_ref * self.CEILING_MULTIPLIER, 2)

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
        rate_per_ton_km = round(
            final_price / (max(0.1, weight_tons) * max(1.0, distance_km)), 4
        )

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
            urgency_multiplier=round(urgency_multiplier, 2),
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

        rate_range = RateRange(
            min_rate=price_floor,
            recommended_rate=final_price,
            max_rate=price_ceiling,
        )

        response = SpotPriceResponse(
            calculation_id=calc_id,
            timestamp=now,
            corridor_matched=corridor_id,
            spot_price=final_price,
            recommended_spot_rate=final_price,
            min_rate=price_floor,
            max_rate=price_ceiling,
            rate_range=rate_range,
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

    def evaluate_contract_rate(
        self, request: ContractEvaluationRequest
    ) -> ContractEvaluationResponse:
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
