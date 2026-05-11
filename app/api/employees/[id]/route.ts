import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/employees/[id]
 * Get single employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sqlQuery = `
      SELECT 
        e.*,
        bp.burn_rate,
        bp.risk_level,
        bp.prediction_date,
        bp.model_version
      FROM employees e
      LEFT JOIN LATERAL (
        SELECT burn_rate, risk_level, prediction_date, model_version
        FROM burnout_predictions
        WHERE employee_id = e.id
        ORDER BY prediction_date DESC
        LIMIT 1
      ) bp ON true
      WHERE e.id = $1
    `;

    const result = await query(sqlQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const employee = {
      id: row.id,
      employee_id: row.employee_id,
      name: row.name,
      email: row.email,
      gender: row.gender,
      company_type: row.company_type,
      wfh_setup_available: row.wfh_setup_available,
      designation: row.designation,
      resource_allocation: row.resource_allocation,
      mental_fatigue_score: row.mental_fatigue_score,
      date_of_joining: row.date_of_joining,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Flatten prediction data for easier access in frontend
      burn_rate: row.burn_rate || undefined,
      risk_level: row.risk_level || undefined,
      prediction_date: row.prediction_date || undefined,
      // Also keep nested structure for compatibility
      prediction: row.burn_rate
        ? {
            id: '',
            employee_id: row.id,
            burn_rate: row.burn_rate,
            risk_level: row.risk_level,
            prediction_date: row.prediction_date,
            model_version: row.model_version || '1.0',
          }
        : undefined,
    };

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/[id]
 * Update employee and re-predict
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      email,
      gender,
      company_type,
      wfh_setup_available,
      designation,
      resource_allocation,
      mental_fatigue_score,
      date_of_joining,
    } = body;

    // Update employee
    const updateQuery = `
      UPDATE employees
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        gender = COALESCE($3, gender),
        company_type = COALESCE($4, company_type),
        wfh_setup_available = COALESCE($5, wfh_setup_available),
        designation = COALESCE($6, designation),
        resource_allocation = COALESCE($7, resource_allocation),
        mental_fatigue_score = COALESCE($8, mental_fatigue_score),
        date_of_joining = COALESCE($9, date_of_joining),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const result = await query(updateQuery, [
      name,
      email,
      gender,
      company_type,
      wfh_setup_available,
      designation,
      resource_allocation,
      mental_fatigue_score,
      date_of_joining,
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = result.rows[0];

    // Re-predict if any prediction-related fields changed
    if (
      gender ||
      company_type ||
      wfh_setup_available !== undefined ||
      designation !== undefined ||
      resource_allocation !== undefined ||
      mental_fatigue_score !== undefined ||
      date_of_joining
    ) {
      // Make prediction using Python API
      const USE_PYTHON_API = process.env.USE_PYTHON_API === 'true';
      const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';
      
      let prediction;
      if (USE_PYTHON_API) {
        try {
          // Format date properly (handle Date objects from database)
          let dateOfJoining = employee.date_of_joining;
          if (dateOfJoining instanceof Date) {
            dateOfJoining = dateOfJoining.toISOString().split('T')[0];
          } else if (typeof dateOfJoining === 'string' && dateOfJoining.includes('T')) {
            dateOfJoining = dateOfJoining.split('T')[0];
          }

          const response = await fetch(`${MODEL_API_URL}/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employee_id: employee.employee_id,
              date_of_joining: dateOfJoining,
              gender: employee.gender,
              company_type: employee.company_type,
              wfh_setup_available: employee.wfh_setup_available,
              designation: parseFloat(employee.designation),
              resource_allocation: parseFloat(employee.resource_allocation),
              mental_fatigue_score: parseFloat(employee.mental_fatigue_score),
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const result = await response.json();
          prediction = {
            burn_rate: result.burn_rate,
            risk_level: result.risk_level,
          };
        } catch (apiError: any) {
          console.error('Python API error:', apiError);
          console.error('Error details:', apiError.message);
          throw new Error(`Failed to get prediction from API: ${apiError.message}`);
        }
      } else {
        // Fallback to ONNX (only if Python API is disabled)
        const { predict } = await import('@/lib/model/onnx-predictor');
        prediction = await predict({
          gender: employee.gender,
          company_type: employee.company_type,
          wfh_setup_available: employee.wfh_setup_available,
          designation: employee.designation,
          resource_allocation: employee.resource_allocation,
          mental_fatigue_score: employee.mental_fatigue_score,
          date_of_joining: employee.date_of_joining,
        });
      }

      // Save new prediction
      const predictionQuery = `
        INSERT INTO burnout_predictions (
          employee_id, burn_rate, risk_level, model_version
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      await query(predictionQuery, [
        employee.id,
        prediction.burn_rate,
        prediction.risk_level,
        '1.0',
      ]);

      return NextResponse.json({
        employee: {
          ...employee,
          prediction,
        },
      });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]
 * Delete employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleteQuery = `DELETE FROM employees WHERE id = $1 RETURNING *`;
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

