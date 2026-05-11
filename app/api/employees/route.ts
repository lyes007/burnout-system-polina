import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Employee, EmployeeWithPrediction } from '@/types';

/**
 * GET /api/employees
 * Get all employees with their latest predictions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const riskLevel = searchParams.get('risk_level');
    const companyType = searchParams.get('company_type');
    const search = searchParams.get('search');

    let sqlQuery = `
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
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (riskLevel) {
      sqlQuery += ` AND bp.risk_level = $${paramIndex}`;
      params.push(riskLevel);
      paramIndex++;
    }

    if (companyType) {
      sqlQuery += ` AND e.company_type = $${paramIndex}`;
      params.push(companyType);
      paramIndex++;
    }

    if (search) {
      sqlQuery += ` AND (
        e.name ILIKE $${paramIndex} OR 
        e.employee_id ILIKE $${paramIndex} OR
        e.email ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY e.created_at DESC`;

    const result = await query(sqlQuery, params);

    const employees: EmployeeWithPrediction[] = result.rows.map((row: any) => {
      // Handle null values from database
      const burnRate = row.burn_rate != null ? parseFloat(row.burn_rate) : undefined;
      const riskLevel = row.risk_level || undefined;
      
      return {
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
        burn_rate: burnRate,
        risk_level: riskLevel as any,
        prediction_date: row.prediction_date || undefined,
        // Also keep nested structure for compatibility
        prediction: burnRate != null
          ? {
              id: '', // Will be set if needed
              employee_id: row.id,
              burn_rate: burnRate,
              risk_level: riskLevel as any,
              prediction_date: row.prediction_date,
              model_version: row.model_version || '1.0',
            }
          : undefined,
      };
    });

    return NextResponse.json({ employees, count: employees.length });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees
 * Create a new employee and make prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employee_id,
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

    // Validate required fields
    if (
      !employee_id ||
      !gender ||
      !company_type ||
      wfh_setup_available === undefined ||
      designation === undefined ||
      resource_allocation === undefined ||
      mental_fatigue_score === undefined ||
      !date_of_joining
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert employee
    const insertQuery = `
      INSERT INTO employees (
        employee_id, name, email, gender, company_type,
        wfh_setup_available, designation, resource_allocation,
        mental_fatigue_score, date_of_joining
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      employee_id,
      name || null,
      email || null,
      gender,
      company_type,
      wfh_setup_available,
      designation,
      resource_allocation,
      mental_fatigue_score,
      date_of_joining,
    ]);

    const employee = result.rows[0];

    // Make prediction using Python API
    const USE_PYTHON_API = process.env.USE_PYTHON_API === 'true';
    const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';
    
    let prediction;
    if (USE_PYTHON_API) {
      try {
        const response = await fetch(`${MODEL_API_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: employee_id,
            date_of_joining: typeof date_of_joining === 'string' 
              ? date_of_joining 
              : (date_of_joining instanceof Date 
                  ? date_of_joining.toISOString().split('T')[0]
                  : String(date_of_joining).split('T')[0]),
            gender: gender,
            company_type: company_type,
            wfh_setup_available: wfh_setup_available,
            designation: parseFloat(designation.toString()),
            resource_allocation: parseFloat(resource_allocation.toString()),
            mental_fatigue_score: parseFloat(mental_fatigue_score.toString()),
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
        gender,
        company_type,
        wfh_setup_available,
        designation,
        resource_allocation,
        mental_fatigue_score,
        date_of_joining,
      });
    }

    // Save prediction
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
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}

