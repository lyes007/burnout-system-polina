"""
Helper script to run in the Jupyter notebook after training
This saves the model and preprocessor for use in the Next.js app
"""

import pickle
import json
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

# Run this in the notebook after training the final model

def save_model_and_preprocessor(final_model, preprocessor, X_train_final, feature_names):
    """
    Save the trained model and preprocessor
    
    Args:
        final_model: The trained LightGBM model
        preprocessor: The ColumnTransformer used for preprocessing
        X_train_final: Final processed training features (for reference)
        feature_names: Feature names after preprocessing
    """
    
    # 1. Save LightGBM model in text format (for ONNX conversion)
    final_model.booster_.save_model('lightgbm_model.txt')
    print("✓ LightGBM model saved to lightgbm_model.txt")
    
    # 2. Save preprocessor
    with open('preprocessor.pkl', 'wb') as f:
        pickle.dump(preprocessor, f)
    print("✓ Preprocessor saved to preprocessor.pkl")
    
    # 3. Save feature names
    with open('feature_names.json', 'w') as f:
        json.dump(feature_names.tolist() if hasattr(feature_names, 'tolist') else list(feature_names), f)
    print("✓ Feature names saved to feature_names.json")
    
    # 4. Save preprocessing metadata
    metadata = {
        'categorical_features': preprocessor.transformers_[0][2] if hasattr(preprocessor, 'transformers_') else [],
        'numerical_features': preprocessor.transformers_[1][2] if len(preprocessor.transformers_) > 1 else [],
        'feature_count': len(feature_names),
    }
    
    with open('preprocessing_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print("✓ Preprocessing metadata saved")
    
    # 5. Save scaler parameters (for manual implementation if needed)
    if len(preprocessor.transformers_) > 1:
        scaler = preprocessor.transformers_[1][1]
        if hasattr(scaler, 'mean_') and hasattr(scaler, 'scale_'):
            scaler_params = {
                'mean': scaler.mean_.tolist(),
                'std': scaler.scale_.tolist(),
                'feature_names': preprocessor.transformers_[1][2]
            }
            with open('scaler_params.json', 'w') as f:
                json.dump(scaler_params, f, indent=2)
            print("✓ Scaler parameters saved to scaler_params.json")
    
    print("\n" + "="*60)
    print("All files saved successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Convert lightgbm_model.txt to ONNX using convert-model.py")
    print("2. Copy the ONNX model to hr-dashboard/public/models/")
    print("3. Use preprocessor.pkl or implement preprocessing in TypeScript")
    print("="*60)

# Usage in notebook:
# After training final_model and creating preprocessor, run:
# save_model_and_preprocessor(final_model, preprocessor, X_train_final, feature_names)




