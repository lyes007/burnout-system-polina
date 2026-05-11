import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/alerts
 * Get high-risk employees (burn_rate > threshold)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threshold = parseFloat(searchParams.get('threshold') || '0.6');
    const riskLevel = searchParams.get('risk_level') || 'High';

    const sqlQuery = `
      SELECT 
        e.*,
        bp.burn_rate,
        bp.risk_level,
        bp.prediction_date
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      WHERE bp.burn_rate >= $1 OR bp.risk_level IN ('High', 'Critical')
      ORDER BY bp.burn_rate DESC
      LIMIT 50
    `;

    const result = await query(sqlQuery, [threshold]);

    const alerts = result.rows.map((row: any) => ({
      employee: {
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
      },
      prediction: {
        burn_rate: row.burn_rate,
        risk_level: row.risk_level,
        prediction_date: row.prediction_date,
      },
    }));

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

