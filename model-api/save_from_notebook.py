"""
Run this in your Jupyter notebook after training to save the model

In your notebook, after training final_model:
    %run save_from_notebook.py
    save_model_and_preprocessor(final_model, preprocessor)
"""

import pickle
import json
from pathlib import Path
import sys

def save_model_and_preprocessor(final_model, preprocessor=None):
    """
    Save the trained model and preprocessor for the FastAPI server
    
    Args:
        final_model: The trained LightGBM model
        preprocessor: The ColumnTransformer preprocessor (optional)
    """
    # Get the parent directory (where lightgbm_model.txt should be)
    # This script is in hr-dashboard/model-api, so parent is hr-dashboard
    script_path = Path(__file__).parent
    base_path = script_path.parent  # hr-dashboard directory
    
    print(f"Saving files to: {base_path}")
    
    # Save model
    model_path = base_path / 'lightgbm_model.txt'
    try:
        final_model.booster_.save_model(str(model_path))
        print(f"✓ Model saved to: {model_path}")
    except Exception as e:
        print(f"✗ Error saving model: {e}")
        print(f"  Make sure final_model is a trained LightGBM model")
        return False
    
    # Save preprocessor if provided
    if preprocessor is not None:
        preprocessor_path = base_path / 'preprocessor.pkl'
        try:
            with open(preprocessor_path, 'wb') as f:
                pickle.dump(preprocessor, f)
            print(f"✓ Preprocessor saved to: {preprocessor_path}")
            
            # Save feature names for reference
            try:
                feature_names = preprocessor.get_feature_names_out()
                feature_names_path = base_path / 'feature_names.json'
                with open(feature_names_path, 'w') as f:
                    json.dump(feature_names.tolist() if hasattr(feature_names, 'tolist') else list(feature_names), f, indent=2)
                print(f"✓ Feature names saved to: {feature_names_path}")
                print(f"  Total features: {len(feature_names)}")
            except Exception as e:
                print(f"⚠ Could not save feature names: {e}")
        except Exception as e:
            print(f"✗ Error saving preprocessor: {e}")
    else:
        print("⚠ Preprocessor not provided - API will use simplified preprocessing")
        print("  For best results, save the preprocessor from your notebook")
    
    print("\n" + "="*60)
    print("Files saved successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start the API server:")
    print("   cd hr-dashboard/model-api")
    print("   python app.py")
    print("\n2. The .env.local file is already configured")
    print("="*60)
    
    return True

# Example usage in notebook:
# After training:
#   final_model = LGBMRegressor(...)
#   final_model.fit(X_train_final, y_train)
#   preprocessor = ColumnTransformer(...)
#   preprocessor.fit(X_train)
#
# Then run:
#   %run save_from_notebook.py
#   save_model_and_preprocessor(final_model, preprocessor)




