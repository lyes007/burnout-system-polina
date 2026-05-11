"""
Convert LightGBM model to ONNX format
This script loads the trained LightGBM model and converts it to ONNX
"""

import pickle
import numpy as np
from lightgbm import LGBMRegressor
import onnxmltools
from onnxconverter_common.data_types import FloatTensorType

def convert_lightgbm_to_onnx():
    """
    Convert LightGBM model to ONNX format
    Note: This requires the trained model file from the notebook
    """
    print("Loading LightGBM model...")
    
    # Try to load the model
    # Note: You'll need to save the model from the notebook first
    # In the notebook, add: final_model.booster_.save_model('lightgbm_model.txt')
    
    try:
        # Load LightGBM model
        model = LGBMRegressor()
        model.booster_ = model.booster_.model_from_string(open('lightgbm_model.txt').read())
        
        # Define input shape (number of features after preprocessing)
        # This should match the number of features after encoding
        # Based on the notebook: ~50-100 features after OneHot encoding
        initial_type = [('float_input', FloatTensorType([None, 50]))]  # Adjust based on actual feature count
        
        print("Converting to ONNX...")
        onnx_model = onnxmltools.convert_lightgbm(model, initial_types=initial_type)
        
        # Save ONNX model
        output_path = '../public/models/burnout_model.onnx'
        with open(output_path, 'wb') as f:
            f.write(onnx_model.SerializeToString())
        
        print(f"ONNX model saved to {output_path}")
        return True
        
    except FileNotFoundError:
        print("Error: Model file not found.")
        print("Please save the model from the notebook first:")
        print("  final_model.booster_.save_model('lightgbm_model.txt')")
        return False
    except Exception as e:
        print(f"Error converting model: {e}")
        return False

if __name__ == '__main__':
    convert_lightgbm_to_onnx()

