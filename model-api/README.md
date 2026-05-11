# Model API Server

A FastAPI server that serves the LightGBM burnout prediction model directly, without ONNX conversion.

## Why Use This?

- ✅ No ONNX conversion needed
- ✅ Use exact preprocessing from notebook
- ✅ Easy to update model
- ✅ Can use pickle files directly
- ✅ More flexible for complex pipelines

## Setup

1. **Install dependencies**:
   ```bash
   cd model-api
   pip install -r requirements.txt
   ```

2. **Save your model from the notebook**:
   
   In your Jupyter notebook, after training:
   ```python
   # Save the model
   final_model.booster_.save_model('../lightgbm_model.txt')
   
   # Save the preprocessor (recommended)
   import pickle
   with open('../preprocessor.pkl', 'wb') as f:
       pickle.dump(preprocessor, f)
   
   print("Model and preprocessor saved!")
   ```

3. **Place files in the parent directory**:
   ```
   hr-dashboard/
   ├── lightgbm_model.txt      # Your saved model
   ├── preprocessor.pkl         # Your saved preprocessor (optional)
   └── model-api/
       ├── app.py
       └── requirements.txt
   ```

4. **Run the API server**:
   ```bash
   cd model-api
   python app.py
   ```
   
   Or with uvicorn directly:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/
GET http://localhost:8000/health
```

### Single Prediction
```bash
POST http://localhost:8000/predict
Content-Type: application/json

{
  "employee_id": "EMP001",
  "date_of_joining": "2020-01-15",
  "gender": "Male",
  "company_type": "Service",
  "wfh_setup_available": true,
  "designation": 2.0,
  "resource_allocation": 5.0,
  "mental_fatigue_score": 6.5
}
```

Response:
```json
{
  "burn_rate": 0.45,
  "risk_level": "Medium",
  "success": true,
  "message": "Prediction successful"
}
```

### Batch Prediction
```bash
POST http://localhost:8000/predict-batch
Content-Type: application/json

[
  {
    "employee_id": "EMP001",
    "date_of_joining": "2020-01-15",
    "gender": "Male",
    "company_type": "Service",
    "wfh_setup_available": true,
    "designation": 2.0,
    "resource_allocation": 5.0,
    "mental_fatigue_score": 6.5
  },
  {
    "employee_id": "EMP002",
    ...
  }
]
```

## Integration with Next.js

Update your Next.js API route to call this Python API instead of using ONNX:

### Update `app/api/predict/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PredictionRequest, PredictionResponse } from '@/types';

const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const data: PredictionRequest = await request.json();

    // Call Python API
    const response = await fetch(`${MODEL_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Prediction API error');
    }

    const result: PredictionResponse = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Add to `.env.local`:
```env
MODEL_API_URL=http://localhost:8000
```

## Production Deployment

### Option 1: Run as a service
- Use systemd (Linux) or a process manager
- Or deploy to a cloud service (Heroku, Railway, Render, etc.)

### Option 2: Docker
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY ../lightgbm_model.txt .
COPY ../preprocessor.pkl .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 3: Same server as Next.js
- Run both on the same server
- Use a reverse proxy (nginx) to route requests
- Or use Next.js API routes as a proxy

## Advantages Over ONNX

1. **Exact preprocessing**: Use the exact same preprocessor from training
2. **No conversion step**: Just save and load the model
3. **Easier debugging**: Can inspect model and preprocessing easily
4. **More flexible**: Can add post-processing, logging, etc.
5. **Better for complex pipelines**: Handles complex feature engineering better

## Troubleshooting

### Model not found
- Check that `lightgbm_model.txt` is in the parent directory
- Verify the path in `app.py` matches your file structure

### Preprocessor not found
- The API will work without it, but predictions may not match exactly
- Save the preprocessor from your notebook for best results

### CORS errors
- Update `allow_origins` in `app.py` to include your frontend URL
- For production, set it to your actual domain

### Port already in use
- Change the port in `app.py` or use: `uvicorn app:app --port 8001`




