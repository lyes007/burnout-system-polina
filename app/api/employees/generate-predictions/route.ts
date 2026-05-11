import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';

/**
 * POST /api/employees/generate-predictions
 * Generate predictions for employees that don't have them
 */
export async function POST(request: NextRequest) {
  try {
    // Find employees without predictions
    const employeesWithoutPredictions = await query(`
      SELECT e.*
      FROM employees e
      LEFT JOIN burnout_predictions bp ON e.id = bp.employee_id
      WHERE bp.id IS NULL
      LIMIT 100
    `);

    if (employeesWithoutPredictions.rows.length === 0) {
      return NextResponse.json({
        message: 'All employees already have predictions',
        generated: 0,
      });
    }

    let generated = 0;
    const errors: string[] = [];

    for (const employee of employeesWithoutPredictions.rows) {
      try {
        // Make prediction using Python API
        const response = await fetch(`${MODEL_API_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: employee.employee_id,
            date_of_joining: typeof employee.date_of_joining === 'string'
              ? employee.date_of_joining
              : employee.date_of_joining.toISOString().split('T')[0],
            gender: employee.gender,
            company_type: employee.company_type,
            wfh_setup_available: employee.wfh_setup_available,
            designation: parseFloat(employee.designation),
            resource_allocation: parseFloat(employee.resource_allocation),
            mental_fatigue_score: parseFloat(employee.mental_fatigue_score),
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const predictionResult = await response.json();

        // Save prediction
        await query(
          `
          INSERT INTO burnout_predictions (
            employee_id, burn_rate, risk_level, model_version
          )
          VALUES ($1, $2, $3, $4)
        `,
          [
            employee.id,
            predictionResult.burn_rate,
            predictionResult.risk_level,
            '1.0',
          ]
        );

        generated++;
      } catch (error: any) {
        errors.push(`Employee ${employee.employee_id}: ${error.message}`);
        console.error(`Error generating prediction for ${employee.employee_id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Generated ${generated} predictions`,
      generated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}




