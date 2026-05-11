# Setup Guide for HR Dashboard

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.local.example` to `.env.local` (if exists)
   - Or create `.env.local` with:
     ```env
     DATABASE_URL="your-neon-database-url"
     ```

3. **Initialize database**:
   - Start the dev server: `npm run dev`
   - Visit: `http://localhost:3000/api/init-db`
   - This creates the necessary tables

4. **Set up the ML model**:
   - See `scripts/notebook-helper.py` for instructions
   - Convert model to ONNX (see `scripts/convert-model.py`)
   - Place ONNX model in `public/models/burnout_model.onnx`

5. **Run the app**:
   ```bash
   npm run dev
   ```

## Model Setup (Important!)

The app requires the trained LightGBM model in ONNX format. To set this up:

### Option 1: Use the Notebook Helper

1. In your Jupyter notebook, after training the model, run:
   ```python
   # Copy the code from scripts/notebook-helper.py
   # This will save the model and preprocessor
   ```

2. Convert to ONNX:
   ```bash
   cd scripts
   python convert-model.py
   ```

3. Copy the ONNX model to the app:
   ```bash
   cp burnout_model.onnx ../public/models/
   ```

### Option 2: Manual Setup

1. Save the model from notebook:
   ```python
   final_model.booster_.save_model('lightgbm_model.txt')
   ```

2. Use the conversion script or convert manually using onnxmltools

## Database Setup

The app uses Neon PostgreSQL. Make sure:

1. Database URL is correct in `.env.local`
2. Database is accessible
3. Run `/api/init-db` to create tables

## Troubleshooting

### "Model not found" error
- Ensure `public/models/burnout_model.onnx` exists
- Check file permissions

### Database connection errors
- Verify DATABASE_URL in `.env.local`
- Check Neon database is running
- Test connection with a simple query

### Preprocessing errors
- The preprocessing is simplified - for production, use the saved preprocessor from the notebook
- See `scripts/save-preprocessor.py` for saving the exact preprocessor

## Next Steps

1. Test adding an employee
2. Verify predictions work
3. Check analytics page loads data
4. Review alerts page




