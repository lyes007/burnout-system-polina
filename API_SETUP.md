# Using Python API Instead of ONNX

This guide shows you how to use a Python FastAPI server to serve your LightGBM model instead of converting it to ONNX.

## Why Use Python API?

✅ **No ONNX conversion needed** - Use your model directly  
✅ **Exact preprocessing** - Use the same preprocessor from your notebook  
✅ **Easier to maintain** - Update model without conversion  
✅ **More flexible** - Handle complex preprocessing easily  

## Quick Start

### Step 1: Save Model from Notebook

In your Jupyter notebook, after training:

```python
# Copy the code from model-api/save-model-from-notebook.py
# Or run this:

from pathlib import Path
import pickle

# Save model
final_model.booster_.save_model('../lightgbm_model.txt')

# Save preprocessor (recommended)
with open('../preprocessor.pkl', 'wb') as f:
    pickle.dump(preprocessor, f)

print("Model and preprocessor saved!")
```

### Step 2: Start the API Server

```bash
cd hr-dashboard/model-api
pip install -r requirements.txt
python app.py
```

The API will run on `http://localhost:8000`

### Step 3: Update Next.js to Use API

1. **Update `.env.local`**:
   ```env
   USE_PYTHON_API=true
   MODEL_API_URL=http://localhost:8000
   DATABASE_URL=your-database-url
   ```

2. **Restart Next.js dev server**:
   ```bash
   npm run dev
   ```

That's it! The Next.js app will now call the Python API instead of using ONNX.

## File Structure

After setup, your structure should look like:

```
hr-dashboard/
├── lightgbm_model.txt          # Your saved model (from notebook)
├── preprocessor.pkl             # Your saved preprocessor (from notebook)
├── model-api/
│   ├── app.py                   # FastAPI server
│   ├── requirements.txt
│   └── README.md
├── app/
│   └── api/
│       └── predict/
│           └── route.ts        # Updated to use API
└── .env.local                   # With USE_PYTHON_API=true
```

## Testing the API

### Test with curl:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "date_of_joining": "2020-01-15",
    "gender": "Male",
    "company_type": "Service",
    "wfh_setup_available": true,
    "designation": 2.0,
    "resource_allocation": 5.0,
    "mental_fatigue_score": 6.5
  }'
```

### Test in Next.js:

Just use the app normally - predictions will automatically use the API if `USE_PYTHON_API=true`.

## Production Deployment

### Option 1: Run Both on Same Server

1. Run Python API as a service (systemd, PM2, etc.)
2. Update `MODEL_API_URL` in production `.env` to point to the API
3. Both Next.js and API can run on the same server

### Option 2: Separate Servers

1. Deploy Python API to a cloud service (Railway, Render, Heroku)
2. Update `MODEL_API_URL` to the deployed API URL
3. Make sure CORS is configured for your frontend domain

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  api:
    build: ./model-api
    ports:
      - "8000:8000"
    volumes:
      - ../lightgbm_model.txt:/app/lightgbm_model.txt
      - ../preprocessor.pkl:/app/preprocessor.pkl
  
  nextjs:
    build: ./hr-dashboard
    ports:
      - "3000:3000"
    environment:
      - USE_PYTHON_API=true
      - MODEL_API_URL=http://api:8000
    depends_on:
      - api
```

## Advantages

1. **No conversion step** - Just save and use
2. **Exact preprocessing** - Matches notebook exactly
3. **Easy updates** - Replace model file and restart
4. **Better debugging** - Can inspect model and data easily
5. **More features** - Can add logging, caching, etc.

## Troubleshooting

### API not starting
- Check that `lightgbm_model.txt` exists in parent directory
- Verify Python dependencies are installed
- Check port 8000 is not in use

### Predictions not working
- Check API is running: `curl http://localhost:8000/health`
- Verify `USE_PYTHON_API=true` in `.env.local`
- Check browser console for errors

### CORS errors
- Update `allow_origins` in `model-api/app.py`
- Add your frontend URL to the list

## Switching Back to ONNX

If you want to use ONNX instead:

1. Set `USE_PYTHON_API=false` (or remove it)
2. Ensure `public/models/burnout_model.onnx` exists
3. Restart Next.js

The code automatically falls back to ONNX if the API is not available.




