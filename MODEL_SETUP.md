# Model Setup Instructions

## Important: Model Conversion Required

The HR Dashboard requires the trained LightGBM model to be converted to ONNX format. Follow these steps:

## Step 1: Save Model from Notebook

In your Jupyter notebook, after training the final model, add this cell:

```python
# Save the model for ONNX conversion
final_model.booster_.save_model('lightgbm_model.txt')
print("Model saved successfully!")
```

## Step 2: Save Preprocessor (Optional but Recommended)

To get exact predictions matching the notebook, save the preprocessor:

```python
# Save preprocessor
import pickle
with open('preprocessor.pkl', 'wb') as f:
    pickle.dump(preprocessor, f)

# Save feature names
import json
feature_names = preprocessor.get_feature_names_out()
with open('feature_names.json', 'w') as f:
    json.dump(feature_names.tolist(), f)

print("Preprocessor saved!")
```

## Step 3: Convert to ONNX

### Option A: Using the Provided Script

1. Install required packages:
   ```bash
   pip install onnxmltools onnxconverter-common lightgbm
   ```

2. Run the conversion script:
   ```bash
   cd hr-dashboard/scripts
   python convert-model.py
   ```

### Option B: Manual Conversion

```python
import onnxmltools
from onnxconverter_common.data_types import FloatTensorType
from lightgbm import LGBMRegressor

# Load the model
model = LGBMRegressor()
model.booster_ = model.booster_.model_from_string(open('lightgbm_model.txt').read())

# Define input shape (adjust based on your feature count after encoding)
# Check the notebook to see how many features you have after OneHot encoding
initial_type = [('float_input', FloatTensorType([None, 50]))]  # Adjust 50 to your actual feature count

# Convert
onnx_model = onnxmltools.convert_lightgbm(model, initial_types=initial_type)

# Save
with open('hr-dashboard/public/models/burnout_model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())
```

## Step 4: Verify Model

Test that the ONNX model produces similar predictions:

```python
import onnxruntime as ort
import numpy as np

# Load ONNX model
session = ort.InferenceSession('hr-dashboard/public/models/burnout_model.onnx')

# Test with sample data (use preprocessed features from notebook)
test_input = np.array([[/* your preprocessed feature array */]], dtype=np.float32)
result = session.run(None, {session.get_inputs()[0].name: test_input})
print(f"Prediction: {result[0][0]}")

# Compare with original model prediction
original_pred = final_model.predict(test_input)
print(f"Original: {original_pred[0]}")
print(f"Difference: {abs(result[0][0] - original_pred[0])}")
```

## Step 5: Update Preprocessing

If you saved the preprocessor, you can:

1. Load it in TypeScript/JavaScript (requires a pickle loader)
2. Or manually implement the exact encoding logic

For now, the app uses a simplified preprocessing that should work but may not match exactly. For production accuracy, implement the exact preprocessing from the saved preprocessor.

## Troubleshooting

### "Input shape mismatch" error
- Check the number of features after preprocessing
- Update the `initial_type` in conversion script
- Verify feature count matches between notebook and app

### Predictions don't match notebook
- Ensure preprocessing matches exactly
- Check that feature order is the same
- Verify scaling parameters are correct

### Model file too large
- ONNX models can be large
- Consider model optimization
- Or use a separate model serving API

## Alternative: Use Python API

If ONNX conversion is problematic, you can:

1. Create a separate Python API (Flask/FastAPI)
2. Serve the model from Python
3. Call the API from Next.js

This is often easier for complex preprocessing pipelines.

