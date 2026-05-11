/**
 * ONNX Model Predictor
 * Handles loading and inference with the ONNX model
 */

import * as ort from 'onnxruntime-node';
import path from 'path';
import { preprocessEmployeeData, getRiskLevel } from './preprocessor';
import { PredictionRequest, PredictionResponse } from '@/types';

let session: ort.InferenceSession | null = null;

/**
 * Load ONNX model
 */
export async function loadModel(): Promise<ort.InferenceSession> {
  if (session) {
    return session;
  }

  try {
    const modelPath = path.join(process.cwd(), 'public', 'models', 'burnout_model.onnx');
    session = await ort.InferenceSession.create(modelPath);
    console.log('ONNX model loaded successfully');
    return session;
  } catch (error) {
    console.error('Error loading ONNX model:', error);
    throw new Error('Failed to load ONNX model');
  }
}

/**
 * Make prediction using ONNX model
 */
export async function predict(
  employeeData: PredictionRequest
): Promise<PredictionResponse> {
  try {
    // Load model if not already loaded
    const model = await loadModel();

    // Preprocess data
    const processed = preprocessEmployeeData(employeeData);

    // Prepare input tensor
    // ONNX expects Float32Array
    const inputTensor = new ort.Tensor('float32', new Float32Array(processed.features), [
      1,
      processed.features.length,
    ]);

    // Get input name from model
    const inputName = model.inputNames[0];

    // Run inference
    const results = await model.run({ [inputName]: inputTensor });

    // Get output (assuming single output)
    const outputName = model.outputNames[0];
    const output = results[outputName];

    // Extract prediction value
    const burnRate = Array.from(output.data as Float32Array)[0];

    // Clamp to valid range [0, 1]
    const clampedBurnRate = Math.max(0, Math.min(1, burnRate));

    // Calculate risk level
    const riskLevel = getRiskLevel(clampedBurnRate);

    return {
      burn_rate: clampedBurnRate,
      risk_level: riskLevel,
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw new Error('Failed to make prediction');
  }
}

/**
 * Get model info
 */
export async function getModelInfo() {
  try {
    const model = await loadModel();
    return {
      inputNames: model.inputNames,
      outputNames: model.outputNames,
      inputShapes: model.inputNames.map(() => undefined),
      outputShapes: model.outputNames.map(() => undefined),
    };
  } catch (error) {
    console.error('Error getting model info:', error);
    throw error;
  }
}

