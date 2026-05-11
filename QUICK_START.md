# Quick Start Guide - Python API Setup

## ✅ Completed Steps

1. ✓ Python API dependencies installed
2. ✓ `.env.local` file created with configuration
3. ✓ Next.js updated to use Python API

## 📝 Remaining Step: Save Model from Notebook

You need to save your trained model from the Jupyter notebook. 

### Option 1: Quick Save (Recommended)

In your notebook, after training `final_model`, run:

```python
# Save model
final_model.booster_.save_model('../lightgbm_model.txt')

# Save preprocessor (if available)
import pickle
if 'preprocessor' in locals() or 'preprocessor' in globals():
    with open('../preprocessor.pkl', 'wb') as f:
        pickle.dump(preprocessor, f)
    print("✓ Model and preprocessor saved!")
else:
    print("✓ Model saved! (Preprocessor will use simplified version)")
```

### Option 2: Use Helper Script

1. Copy the code from `model-api/save_from_notebook.py`
2. Run it in your notebook after training

## 🚀 Start the API Server

Once the model is saved, start the API:

```bash
cd hr-dashboard/model-api
python app.py
```

The API will run on `http://localhost:8000`

## ✅ Verify Setup

1. Check API is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Start Next.js:
   ```bash
   cd hr-dashboard
   npm run dev
   ```

3. The app will automatically use the Python API (configured in `.env.local`)

## 📁 File Structure

After saving the model, you should have:

```
BURN OUT/
├── lightgbm_model.txt          # Your saved model (create this)
├── preprocessor.pkl            # Your saved preprocessor (optional)
└── hr-dashboard/
    ├── .env.local              # ✓ Already configured
    ├── model-api/
    │   ├── app.py              # ✓ API server ready
    │   └── requirements.txt     # ✓ Dependencies installed
    └── app/
        └── api/
            └── predict/
                └── route.ts    # ✓ Updated to use API
```

## 🎯 Next Steps

1. **Save model from notebook** (see above)
2. **Start API server**: `cd model-api && python app.py`
3. **Start Next.js**: `npm run dev`
4. **Test**: Visit `http://localhost:3000` and try adding an employee

## ⚠️ Troubleshooting

### "Model not found" error
- Make sure `lightgbm_model.txt` is in the parent directory (same level as `hr-dashboard/`)
- Check the file path in `model-api/app.py` matches your structure

### API won't start
- Check Python dependencies: `pip install -r model-api/requirements.txt`
- Check port 8000 is not in use

### Predictions not working
- Verify API is running: `curl http://localhost:8000/health`
- Check `.env.local` has `USE_PYTHON_API=true`
- Check browser console for errors




