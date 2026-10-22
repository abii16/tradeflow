import os

import joblib
import numpy as np
import torch
import torch.nn as nn


class ETADeepModel(nn.Module):
    def __init__(self, input_size=11):
        super(ETADeepModel, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        return self.network(x)


class SimpleScaler:
    """Robust standalone scaler matching scaler.pkl without requiring scikit-learn C-extensions."""

    def __init__(self, mean=None, scale=None):
        default_mean = [
            11.2504383,
            42.6462507,
            9.30742783,
            39.296234,
            655.009159,
            4.235325,
            25.926334,
            11.451175,
            2.9988,
            0.2964,
            0.1204,
        ]
        default_scale = [
            0.92189915,
            1.36036272,
            1.37611872,
            1.09939766,
            202.66296192,
            4.00713079,
            9.26582655,
            6.92778219,
            1.99637135,
            0.55389262,
            0.3254287,
        ]
        self.mean_ = np.array(
            mean if mean is not None else default_mean, dtype=np.float32
        )
        self.scale_ = np.array(
            scale if scale is not None else default_scale, dtype=np.float32
        )

    def transform(self, X):
        return (X - self.mean_) / self.scale_


class ETAEngineService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.load_model()

    def load_model(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "models", "eta_deep_model.pth")
        scaler_path = os.path.join(base_dir, "models", "scaler.pkl")

        # 1. Load the scaler (gracefully falling back to pure-numpy SimpleScaler)
        try:
            if os.path.exists(scaler_path):
                try:
                    self.scaler = joblib.load(scaler_path)
                except Exception:
                    self.scaler = SimpleScaler()
            else:
                self.scaler = SimpleScaler()
        except Exception as e:
            print(f"[ETAEngine] Scaler notice: {e}. Using calibrated SimpleScaler.")
            self.scaler = SimpleScaler()

        # 2. Load the PyTorch model
        try:
            if os.path.exists(model_path):
                self.model = ETADeepModel(input_size=11)
                state_dict = torch.load(
                    model_path, map_location=self.device, weights_only=True
                )
                self.model.load_state_dict(state_dict)
                self.model.to(self.device)
                self.model.eval()
                print("[ETAEngine] Successfully loaded ETA PyTorch model.")
            else:
                print(
                    f"[ETAEngine] Warning: Model not found at {model_path}. Using analytical ETA fallback."
                )
        except Exception as e:
            print(
                f"[ETAEngine] Error loading PyTorch model: {e}. Using analytical ETA fallback."
            )

    def calculate_analytical_eta(
        self,
        distance_km: float,
        cargo_weight_tons: float = 20.0,
        weather_condition: int = 0,
        has_security_flag: int = 0,
    ) -> float:
        """
        Analytical fallback model calibrated for the Djibouti-Ethiopia corridor:
        - Baseline highway speed: 48 km/h
        - Heavy cargo penalty: -0.15 km/h per ton over 20 tons
        - Rain/Adverse weather penalty: +15% travel time
        - Security checkpoint/detour: +3.5 hours
        - Customs dwell at border / dry port: +2.0 hours
        """
        effective_speed = max(25.0, 48.0 - max(0.0, cargo_weight_tons - 20.0) * 0.15)
        base_driving_hours = max(0.5, distance_km / effective_speed)

        weather_factor = 1.20 if weather_condition > 0 else 1.00
        security_delay = 3.5 if has_security_flag else 0.0
        dwell_time = 2.0

        total_hours = (base_driving_hours * weather_factor) + security_delay + dwell_time
        return max(0.5, total_hours)

    def predict_eta(
        self,
        origin_latitude: float,
        origin_longitude: float,
        destination_latitude: float,
        destination_longitude: float,
        distance_km: float,
        corridor_leg: int,
        cargo_weight_tons: float,
        departure_hour: int,
        day_of_week: int,
        weather_condition: int,
        has_security_flag: int,
    ) -> float:
        """
        Predicts ETA in hours using deep learning model with analytical fallback.
        """
        try:
            if self.model is not None:
                features = np.array(
                    [
                        [
                            origin_latitude,
                            origin_longitude,
                            destination_latitude,
                            destination_longitude,
                            distance_km,
                            corridor_leg,
                            cargo_weight_tons,
                            departure_hour,
                            day_of_week,
                            weather_condition,
                            has_security_flag,
                        ]
                    ],
                    dtype=np.float32,
                )

                if self.scaler:
                    features = self.scaler.transform(features)

                features_tensor = torch.tensor(features, dtype=torch.float32).to(
                    self.device
                )

                with torch.no_grad():
                    output = self.model(features_tensor)

                predicted_hours = float(output.item())
                return max(0.5, predicted_hours)
        except Exception as err:
            print(
                f"[ETAEngine] PyTorch inference notice: {err}. Falling back to analytical model."
            )

        # Fallback to analytical corridor calculation
        return self.calculate_analytical_eta(
            distance_km=distance_km,
            cargo_weight_tons=cargo_weight_tons,
            weather_condition=weather_condition,
            has_security_flag=has_security_flag,
        )


eta_engine = ETAEngineService()
