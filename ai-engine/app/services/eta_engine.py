import os
import torch
import torch.nn as nn
import joblib
import numpy as np

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
            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.network(x)

class ETAEngineService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.load_model()

    def load_model(self):
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, 'models', 'eta_deep_model.pth')
            scaler_path = os.path.join(base_dir, 'models', 'scaler.pkl')

            # Load the scaler
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            else:
                print(f"Warning: Scaler not found at {scaler_path}. Prediction might be inaccurate.")

            # Load the PyTorch model
            if os.path.exists(model_path):
                self.model = ETADeepModel(input_size=11)
                state_dict = torch.load(model_path, map_location=self.device, weights_only=True)
                self.model.load_state_dict(state_dict)
                self.model.to(self.device)
                self.model.eval()  # Set model to evaluation mode
                print("Successfully loaded ETA PyTorch model.")
            else:
                print(f"Error: Model not found at {model_path}")
        
        except Exception as e:
            print(f"Error loading ETA model/scaler: {e}")

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
        has_security_flag: int
    ) -> float:
        """
        Predicts ETA in hours given the 11 feature inputs.
        """
        if not self.model:
            raise ValueError("ETA Model is not loaded. Cannot make predictions.")

        # Create input array matching the exact feature order used during training
        features = np.array([[
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
            has_security_flag
        ]], dtype=np.float32)

        # Scale features if scaler is available
        if self.scaler:
            features = self.scaler.transform(features)

        # Convert to PyTorch tensor
        features_tensor = torch.tensor(features, dtype=torch.float32).to(self.device)

        # Run inference
        with torch.no_grad():
            output = self.model(features_tensor)
            
        predicted_hours = output.item()
        
        # Ensure ETA is non-negative
        return max(0.0, predicted_hours)

eta_engine = ETAEngineService()
