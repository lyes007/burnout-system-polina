"""
Helper script to run in your Jupyter notebook
This saves the model and preprocessor for the API server
"""

# Run this in your notebook after training the final model

def save_model_for_api(final_model, preprocessor=None):
    """
    Save the trained model and preprocessor for the FastAPI server
    
    Args:
        final_model: The trained LightGBM model
        preprocessor: The ColumnTransformer preprocessor (optional)
    """
    import pickle
    import json
    from pathlib import Path
    
    # Get the parent directory (where model-api folder is)
    base_path = Path.cwd().parent
    
    # Save model
    model_path = base_path / 'lightgbm_model.txt'
    final_model.booster_.save_model(str(model_path))
    print(f"✓ Model saved to: {model_path}")
    
    # Save preprocessor if provided
    if preprocessor is not None:
        preprocessor_path = base_path / 'preprocessor.pkl'
        with open(preprocessor_path, 'wb') as f:
            pickle.dump(preprocessor, f)
        print(f"✓ Preprocessor saved to: {preprocessor_path}")
        
        # Save feature names for reference
        feature_names = preprocessor.get_feature_names_out()
        feature_names_path = base_path / 'feature_names.json'
        with open(feature_names_path, 'w') as f:
            json.dump(feature_names.tolist() if hasattr(feature_names, 'tolist') else list(feature_names), f, indent=2)
        print(f"✓ Feature names saved to: {feature_names_path}")
    else:
        print("⚠ Preprocessor not provided - API will use simplified preprocessing")
    
    print("\n" + "="*60)
    print("Files saved successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start the API server:")
    print("   cd hr-dashboard/model-api")
    print("   pip install -r requirements.txt")
    print("   python app.py")
    print("\n2. Update .env.local in hr-dashboard:")
    print("   USE_PYTHON_API=true")
    print("   MODEL_API_URL=http://localhost:8000")
    print("="*60)

# Usage in notebook:
# After training final_model and creating preprocessor:
# save_model_for_api(final_model, preprocessor)




