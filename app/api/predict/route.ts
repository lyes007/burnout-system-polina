import { NextRequest, NextResponse } from 'next/server';
import { PredictionRequest, PredictionResponse } from '@/types';

// Use Python API if available, otherwise fall back to ONNX
const USE_PYTHON_API = process.env.USE_PYTHON_API === 'true';
const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';

/**
 * POST /api/predict
 * Predict burnout risk for an employee
 * 
 * Can use either:
 * 1. Python FastAPI server (recommended) - set USE_PYTHON_API=true
 * 2. ONNX model directly (fallback)
 */
export async function POST(request: NextRequest) {
  try {
    const body: PredictionRequest = await request.json();

    // Validate required fields
    if (
      !body.gender ||
      !body.company_type ||
      body.wfh_setup_available === undefined ||
      body.designation === undefined ||
      body.resource_allocation === undefined ||
      body.mental_fatigue_score === undefined ||
      !body.date_of_joining
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Python API if enabled
    if (USE_PYTHON_API) {
      try {
        const response = await fetch(`${MODEL_API_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: body.employee_id || 'temp',
            date_of_joining: body.date_of_joining,
            gender: body.gender,
            company_type: body.company_type,
            wfh_setup_available: body.wfh_setup_available,
            designation: parseFloat(body.designation.toString()),
            resource_allocation: parseFloat(body.resource_allocation.toString()),
            mental_fatigue_score: parseFloat(body.mental_fatigue_score.toString()),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result: PredictionResponse = await response.json();
        return NextResponse.json({
          burn_rate: result.burn_rate,
          risk_level: result.risk_level,
        });
      } catch (apiError: any) {
        console.error('Python API error, falling back to ONNX:', apiError);
        // Fall through to ONNX fallback
      }
    }

    // Fallback to ONNX (if Python API not available or failed)
    const { predict } = await import('@/lib/model/onnx-predictor');
    const prediction = await predict(body);
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to make prediction' },
      { status: 500 }
    );
  }
}

