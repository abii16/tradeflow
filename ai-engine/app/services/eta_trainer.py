import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import joblib
from typing import List, Dict

# Reuse the model definition from the engine
from app.services.eta_engine import ETADeepModel, eta_engine

class ETATrainerService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.model_path = os.path.join(self.base_dir, 'models', 'eta_deep_model.pth')
        self.scaler_path = os.path.join(self.base_dir, 'models', 'scaler.pkl')
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def retrain_model(self, trip_data: List[Dict], epochs: int = 5, learning_rate: float = 1e-4) -> float:
        """
        Fine-tunes the ETA model with new historical trip data.
        Returns the final loss.
        """
        if not trip_data:
            raise ValueError("No trip data provided for retraining.")
            
        # 1. Parse and scale data
        X = []
        y = []
        for trip in trip_data:
            features = [
                trip['origin_latitude'],
                trip['origin_longitude'],
                trip['destination_latitude'],
                trip['destination_longitude'],
                trip['distance_km'],
                trip['corridor_leg'],
                trip['cargo_weight_tons'],
                trip['departure_hour'],
                trip['day_of_week'],
                trip['weather_condition'],
                trip['has_security_flag']
            ]
            X.append(features)
            y.append([trip['actual_travel_hours']])
            
        X = np.array(X, dtype=np.float32)
        y = np.array(y, dtype=np.float32)

        # Scale X using the existing scaler (or optionally fit if you want to update scaler)
        scaler = joblib.load(self.scaler_path) if os.path.exists(self.scaler_path) else None
        if scaler:
            X = scaler.transform(X)
            
        # Convert to tensors
        X_tensor = torch.tensor(X).to(self.device)
        y_tensor = torch.tensor(y).to(self.device)

        # 2. Load current model state
        model = ETADeepModel(input_size=11)
        if os.path.exists(self.model_path):
            state_dict = torch.load(self.model_path, map_location=self.device, weights_only=True)
            model.load_state_dict(state_dict)
        model.to(self.device)
        
        # BatchNorm1d requires >1 sample to compute variance in train mode.
        if X_tensor.size(0) > 1:
            model.train()
        else:
            model.eval() # Gradients still compute, but BN/Dropout act like inference

        # 3. Setup optimizer and loss
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        # 4. Training loop
        final_loss = 0.0
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            final_loss = loss.item()
            print(f"Retraining Epoch [{epoch+1}/{epochs}], Loss: {final_loss:.4f}")

        # 5. Save updated weights
        torch.save(model.state_dict(), self.model_path)
        print(f"Model saved successfully to {self.model_path}")
        
        # 6. Reload model in the live engine to serve new predictions immediately
        eta_engine.load_model()
        
        return final_loss

eta_trainer = ETATrainerService()
