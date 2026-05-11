"""
FastAPI server for LightGBM burnout prediction model
This API serves the model directly without ONNX conversion
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import pickle
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from pathlib import Path
import os

# Global variables for model and preprocessor
model = None
preprocessor = None
feature_names = None

# Request/Response models
class PredictionRequest(BaseModel):
    employee_id: str
    date_of_joining: str
    gender: str
    company_type: str
    wfh_setup_available: bool
    designation: float
    resource_allocation: float
    mental_fatigue_score: float

class PredictionResponse(BaseModel):
    burn_rate: float
    risk_level: str
    success: bool
    message: str = ""

def get_risk_level(burn_rate: float) -> str:
    """Calculate risk level from burn rate"""
    if burn_rate < 0.3:
        return "Low"
    elif burn_rate < 0.6:
        return "Medium"
    elif burn_rate < 0.8:
        return "High"
    else:
        return "Critical"

def load_model_and_preprocessor():
    """Load the trained model and preprocessor"""
    global model, preprocessor, feature_names
    
    if model is not None:
        return  # Already loaded
    
    try:
        # Paths - files are in the parent directory of hr-dashboard
        # app.py is in hr-dashboard/model-api, so we need to go up 2 levels
        base_path = Path(__file__).parent.parent.parent
        model_path_txt = base_path / "lightgbm_model.txt"
        model_path_pkl = base_path / "lightgbm_model.pkl"
        preprocessor_path = base_path / "preprocessor.pkl"
        
        print(f"Looking for model files in: {base_path}")
        
        # Load model - try .txt first (LightGBM/XGBoost), then .pkl (other models)
        if model_path_txt.exists():
            # LightGBM/XGBoost model
            model = LGBMRegressor()
            model.booster_ = model.booster_.model_from_string(model_path_txt.read_text())
            print(f"✓ LightGBM model loaded from {model_path_txt}")
        elif model_path_pkl.exists():
            # Other models (Random Forest, XGBoost, etc.) saved with joblib
            import joblib
            model = joblib.load(model_path_pkl)
            print(f"✓ Model loaded from {model_path_pkl} (using joblib)")
        else:
            print(f"⚠ Model file not found at {model_path_txt} or {model_path_pkl}")
            print("Please save your model from the notebook")
            return
        
        # Load preprocessor (optional)
        if preprocessor_path.exists():
            with open(preprocessor_path, 'rb') as f:
                preprocessor = pickle.load(f)
            feature_names = preprocessor.get_feature_names_out()
            print(f"✓ Preprocessor loaded from {preprocessor_path}")
        else:
            print(f"⚠ Preprocessor not found at {preprocessor_path}")
            print("Model will work, but preprocessing may not match exactly")
        
    except Exception as e:
        print(f"Error loading model/preprocessor: {e}")
        raise

def preprocess_data(data: PredictionRequest) -> np.ndarray:
    """
    Preprocess employee data to match the training pipeline
    This replicates the feature engineering from the notebook
    """
    try:
        # Create a DataFrame with the input data
        df = pd.DataFrame([{
            'Employee ID': data.employee_id,
            'Date of Joining': pd.to_datetime(data.date_of_joining),
            'Gender': data.gender,
            'Company Type': data.company_type,
            'WFH Setup Available': 'Yes' if data.wfh_setup_available else 'No',
            'Designation': float(data.designation),
            'Resource Allocation': float(data.resource_allocation),
            'Mental Fatigue Score': float(data.mental_fatigue_score),
        }])
        
        # Feature engineering (matching notebook)
        current_date = pd.Timestamp('2024-01-01')
        df['Years_of_Service'] = (current_date - df['Date of Joining']).dt.days / 365.25
        df['Month_of_Joining'] = df['Date of Joining'].dt.month
        
        # Interaction features
        df['Gender_Company'] = df['Gender'] + '_' + df['Company Type']
        df['WFH_Company'] = df['WFH Setup Available'] + '_' + df['Company Type']
        df['Gender_WFH'] = df['Gender'] + '_' + df['WFH Setup Available']
        
        # Binning - handle edge cases
        try:
            df['Designation_Group'] = pd.cut(
                df['Designation'],
                bins=[-0.5, 1.5, 2.5, 5],
                labels=['Junior', 'Mid', 'Senior']
            )
        except:
            # Fallback if cut fails
            df['Designation_Group'] = pd.Series(['Mid'] * len(df), dtype='object')
        
        try:
            df['Fatigue_Group'] = pd.cut(
                df['Mental Fatigue Score'],
                bins=[0, 3, 6, 10],
                labels=['Low', 'Medium', 'High']
            )
        except:
            df['Fatigue_Group'] = pd.Series(['Medium'] * len(df), dtype='object')
        
        try:
            df['Resource_Group'] = pd.cut(
                df['Resource Allocation'],
                bins=[0, 3, 6, 10],
                labels=['Low', 'Medium', 'High']
            )
        except:
            df['Resource_Group'] = pd.Series(['Medium'] * len(df), dtype='object')
        
        # Select features (excluding Employee ID and Date of Joining)
        feature_cols = [
            'Gender', 'Company Type', 'WFH Setup Available',
            'Designation', 'Resource Allocation', 'Mental Fatigue Score',
            'Years_of_Service', 'Month_of_Joining',
            'Gender_Company', 'WFH_Company', 'Gender_WFH',
            'Designation_Group', 'Fatigue_Group', 'Resource_Group'
        ]
        
        X = df[feature_cols]
        
        # Apply preprocessor if available
        if preprocessor is not None:
            try:
                X_processed = preprocessor.transform(X)
                return X_processed.astype(np.float32)
            except Exception as e:
                print(f"⚠ Preprocessor error: {e}")
                print("⚠ Falling back to simplified preprocessing")
                # Fall through to simplified preprocessing
        else:
            print("⚠ Preprocessor not loaded, using simplified preprocessing")
        
        # Fallback: manual encoding (simplified)
        # This won't match exactly but will work
        return X.select_dtypes(include=[np.number]).values.astype(np.float32)
    
    except Exception as e:
        print(f"⚠ Preprocessing error: {e}")
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup"""
    load_model_and_preprocessor()
    yield
    # Cleanup if needed

app = FastAPI(title="Employee Burnout Prediction API", lifespan=lifespan)

# Enable CORS for Next.js frontend
# Allow localhost and ngrok URLs
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Add ngrok URLs if provided via environment variable
ngrok_url = os.getenv("NGROK_URL")
if ngrok_url:
    allowed_origins.append(ngrok_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict employee burnout risk
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please ensure model file exists."
        )
    
    try:
        # Preprocess data
        processed_data = preprocess_data(request)
        
        # Make prediction
        prediction = model.predict(processed_data)[0]
        
        # Clamp to [0, 1]
        burn_rate = float(np.clip(prediction, 0, 1))
        risk_level = get_risk_level(burn_rate)
        
        return PredictionResponse(
            burn_rate=burn_rate,
            risk_level=risk_level,
            success=True,
            message="Prediction successful"
        )
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Prediction error details:\n{error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )

@app.post("/predict-batch")
async def predict_batch(requests: list[PredictionRequest]):
    """
    Predict burnout risk for multiple employees at once
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )
    
    try:
        results = []
        for request in requests:
            processed_data = preprocess_data(request)
            prediction = model.predict(processed_data)[0]
            burn_rate = float(np.clip(prediction, 0, 1))
            risk_level = get_risk_level(burn_rate)
            
            results.append({
                "employee_id": request.employee_id,
                "burn_rate": burn_rate,
                "risk_level": risk_level
            })
        
        return {"results": results, "count": len(results)}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
