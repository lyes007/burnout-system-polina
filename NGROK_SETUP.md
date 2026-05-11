# Ngrok Setup Guide

This guide explains how to expose your HR Dashboard to the internet using ngrok.

## Prerequisites

✅ Ngrok is installed and authenticated (already done)

## Option 1: Expose Only Next.js (Recommended - Simpler)

This is the easiest setup. The Next.js app will be accessible via ngrok, and it will call the Python API on localhost (which works fine).

### Steps:

1. **Start the Python API** (Terminal 1):
   ```powershell
   cd hr-dashboard\model-api
   python app.py
   ```
   The API will run on `http://localhost:8000`

2. **Start Next.js** (Terminal 2):
   ```powershell
   cd hr-dashboard
   npm run dev
   ```
   Next.js will run on `http://localhost:3000`

3. **Start ngrok** (Terminal 3):
   ```powershell
   cd hr-dashboard
   .\start-ngrok.ps1
   ```
   Or manually:
   ```powershell
   ngrok http 3000
   ```

4. **Copy the ngrok URL**:
   - You'll see something like: `https://abc123.ngrok.io`
   - Copy the HTTPS URL (not the HTTP one)
   - Use this URL to access your dashboard from anywhere!

### How it works:
- Your dashboard is accessible at: `https://your-ngrok-url.ngrok.io`
- The ML model still works because Next.js calls `localhost:8000` internally
- No additional configuration needed!

---

## Option 2: Expose Both Next.js and Python API

Use this if you want the Python API to be accessible from outside your machine.

### Steps:

1. **Start the Python API** (Terminal 1):
   ```powershell
   cd hr-dashboard\model-api
   python app.py
   ```

2. **Start ngrok for Python API** (Terminal 2):
   ```powershell
   cd hr-dashboard
   .\start-ngrok-api.ps1
   ```
   Copy the ngrok URL (e.g., `https://xyz789.ngrok.io`)

3. **Update `.env.local`**:
   ```env
   MODEL_API_URL=https://xyz789.ngrok.io
   USE_PYTHON_API=true
   ```

4. **Update CORS in `model-api/app.py`** (if needed):
   The code already supports NGROK_URL environment variable:
   ```powershell
   $env:NGROK_URL="https://xyz789.ngrok.io"
   ```

5. **Start Next.js** (Terminal 3):
   ```powershell
   cd hr-dashboard
   npm run dev
   ```

6. **Start ngrok for Next.js** (Terminal 4):
   ```powershell
   cd hr-dashboard
   .\start-ngrok.ps1
   ```

---

## Important Notes

### Security
- ⚠️ **Ngrok URLs are public by default** - anyone with the URL can access your dashboard
- For production, consider:
  - Adding authentication to your Next.js app
  - Using ngrok's paid features for private tunnels
  - Setting up proper security measures

### Performance
- The ML model runs on your local machine
- Performance depends on your hardware
- Network latency may affect response times

### Model Files
- Model files (`lightgbm_model.pkl`, `preprocessor.pkl`) stay on your machine
- Ngrok only tunnels HTTP traffic, not file access
- The model will work exactly the same as localhost

### URL Changes
- Free ngrok URLs change each time you restart ngrok
- For a stable URL, consider ngrok's paid plans
- Or use ngrok's reserved domains feature

---

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Make sure the Python API is running
2. Check that `MODEL_API_URL` in `.env.local` matches your ngrok URL (if using Option 2)
3. Restart both the API and Next.js after changing environment variables

### Connection Refused
- Make sure both the Python API and Next.js are running
- Check that ports 3000 and 8000 are not blocked by firewall
- Verify ngrok is pointing to the correct port

### Model Not Loading
- Ensure model files exist in the parent directory
- Check Python API logs for errors
- Verify the model path in `model-api/app.py`

---

## Quick Start (Recommended)

```powershell
# Terminal 1: Python API
cd hr-dashboard\model-api
python app.py

# Terminal 2: Next.js
cd hr-dashboard
npm run dev

# Terminal 3: Ngrok
cd hr-dashboard
.\start-ngrok.ps1
```

Then use the ngrok HTTPS URL to access your dashboard! 🚀




