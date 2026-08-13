import os
import sys
import shutil
import logging
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RetrainModel")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_FILE = os.path.join(PROJECT_ROOT, "latest_training_data.csv")
MODEL_DIR = os.path.join(PROJECT_ROOT, "app", "models")
MODEL_FILE = os.path.join(MODEL_DIR, "tradeflow_ai_engine.pkl")
SCALER_FILE = os.path.join(MODEL_DIR, "tradeflow_scaler.pkl")
MODEL_BACKUP = os.path.join(MODEL_DIR, "tradeflow_ai_engine_backup.pkl")
SCALER_BACKUP = os.path.join(MODEL_DIR, "tradeflow_scaler_backup.pkl")

EXPECTED_FEATURES = [
    'required_weight_tons', 'transporter_capacity_tons', 'trip_distance_km', 
    'proximity_distance_km', 'proposed_cost_etb', 'historical_reliability_score', 
    'fuel_efficiency_score'
]
TARGET_COLUMN = 'match_accepted'

def preprocess_real_world_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Automated data cleaning function: handles missing values, duplicates, and outliers.
    """
    initial_shape = df.shape
    logger.info(f"Starting preprocessing. Initial data shape: {initial_shape}")
    
    # 1. Drop duplicates
    df = df.drop_duplicates()
    logger.info(f"Dropped duplicates. New shape: {df.shape}")
    
    # 2. Handle missing values
    if TARGET_COLUMN in df.columns:
        df = df.dropna(subset=[TARGET_COLUMN])
        
    for col in EXPECTED_FEATURES:
        if col in df.columns and df[col].isnull().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            logger.info(f"Filled missing values in {col} with median ({median_val:.2f}).")
            
    # 3. Handle outliers using IQR method for continuous variables
    outlier_candidates = ['proposed_cost_etb', 'trip_distance_km']
    for col in outlier_candidates:
        if col in df.columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Cap the outliers instead of dropping to retain training data
            df[col] = np.where(df[col] > upper_bound, upper_bound, df[col])
            df[col] = np.where(df[col] < lower_bound, lower_bound, df[col])
            logger.info(f"Capped outliers in {col} using IQR.")
            
    logger.info(f"Finished preprocessing. Final data shape: {df.shape}")
    return df

def perform_zero_downtime_deployment(temp_model_path: str, temp_scaler_path: str):
    """
    Backs up the old .pkl files and replaces the active files atomically.
    """
    logger.info("Performing zero-downtime deployment...")
    
    if os.path.exists(MODEL_FILE):
        shutil.copy2(MODEL_FILE, MODEL_BACKUP)
        logger.info(f"Backed up active model to {MODEL_BACKUP}")
        
    if os.path.exists(SCALER_FILE):
        shutil.copy2(SCALER_FILE, SCALER_BACKUP)
        logger.info(f"Backed up active scaler to {SCALER_BACKUP}")
        
    # os.replace provides atomic replacement on POSIX systems and acts exactly as expected for zero downtime
    os.replace(temp_model_path, MODEL_FILE)
    os.replace(temp_scaler_path, SCALER_FILE)
    
    logger.info("Successfully deployed new models with zero downtime!")

def main():
    if not os.path.exists(DATA_FILE):
        logger.error(f"Training data file not found: {DATA_FILE}")
        sys.exit(1)
        
    logger.info("Loading training data...")
    try:
        df = pd.read_csv(DATA_FILE)
    except Exception as e:
        logger.error(f"Failed to read data file: {e}")
        sys.exit(1)
    
    if df.empty:
        logger.error("Training data is empty. Aborting.")
        sys.exit(1)
        
    df = preprocess_real_world_data(df)
    
    missing_cols = [col for col in EXPECTED_FEATURES if col not in df.columns]
    if missing_cols:
        logger.error(f"Missing expected columns in data: {missing_cols}")
        sys.exit(1)
        
    if TARGET_COLUMN not in df.columns:
        logger.error(f"Target column '{TARGET_COLUMN}' missing in data.")
        sys.exit(1)

    X = df[EXPECTED_FEATURES]
    y = df[TARGET_COLUMN]

    logger.info("Scaling features...")
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    logger.info("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_scaled, y)
    
    score = model.score(X_scaled, y)
    logger.info(f"Model trained successfully. Accuracy on training set: {score:.4f}")
    
    temp_model_path = os.path.join(MODEL_DIR, "temp_tradeflow_ai_engine.pkl")
    temp_scaler_path = os.path.join(MODEL_DIR, "temp_tradeflow_scaler.pkl")
    
    logger.info("Saving new models to temporary files...")
    with open(temp_model_path, 'wb') as f:
        joblib.dump(model, f)
        
    with open(temp_scaler_path, 'wb') as f:
        joblib.dump(scaler, f)
        
    perform_zero_downtime_deployment(temp_model_path, temp_scaler_path)
    logger.info("Retraining process completed.")

if __name__ == "__main__":
    main()
