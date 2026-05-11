import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AnalyticsOverview } from '@/types';

/**
 * GET /api/analytics
 * Get analytics overview and statistics
 */
export async function GET() {
  try {
    // Get total employees
    const totalResult = await query('SELECT COUNT(*) as count FROM employees');
    const totalEmployees = parseInt(totalResult.rows[0].count);

    // Get employees with predictions
    const predictionsResult = await query(`
      SELECT 
        bp.risk_level,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(*) as count
      FROM burnout_predictions bp
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY bp.risk_level
    `);

    // Calculate risk distribution
    const riskDistribution = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    let totalBurnRate = 0;
    let predictionCount = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;

    predictionsResult.rows.forEach((row: any) => {
      const count = parseInt(row.count);
      const riskLevel = row.risk_level;
      riskDistribution[riskLevel as keyof typeof riskDistribution] = count;
      
      totalBurnRate += parseFloat(row.avg_burn_rate) * count;
      predictionCount += count;

      if (riskLevel === 'High') highRiskCount = count;
      if (riskLevel === 'Critical') criticalRiskCount = count;
    });

    const averageBurnRate = predictionCount > 0 ? totalBurnRate / predictionCount : 0;

    // Get breakdown by company type
    const companyTypeResult = await query(`
      SELECT 
        e.company_type,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY e.company_type
    `);

    // Get breakdown by gender
    const genderResult = await query(`
      SELECT 
        e.gender,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY e.gender
    `);

    // Get breakdown by WFH status
    const wfhResult = await query(`
      SELECT 
        e.wfh_setup_available,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY e.wfh_setup_available
    `);

    // Get breakdown by designation level
    const designationResult = await query(`
      SELECT 
        CASE 
          WHEN e.designation <= 1.5 THEN 'Junior (0-1.5)'
          WHEN e.designation <= 2.5 THEN 'Mid (1.5-2.5)'
          ELSE 'Senior (2.5+)'
        END as designation_group,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY designation_group
      ORDER BY MIN(e.designation)
    `);

    // Get breakdown by resource allocation ranges
    const resourceAllocationResult = await query(`
      SELECT 
        CASE 
          WHEN e.resource_allocation <= 3 THEN 'Low (0-3)'
          WHEN e.resource_allocation <= 6 THEN 'Medium (3-6)'
          ELSE 'High (6+)'
        END as resource_group,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY resource_group
      ORDER BY MIN(e.resource_allocation)
    `);

    // Get breakdown by mental fatigue score ranges
    const mentalFatigueResult = await query(`
      SELECT 
        CASE 
          WHEN e.mental_fatigue_score <= 3 THEN 'Low (0-3)'
          WHEN e.mental_fatigue_score <= 6 THEN 'Medium (3-6)'
          ELSE 'High (6+)'
        END as fatigue_group,
        AVG(bp.burn_rate) as avg_burn_rate,
        COUNT(DISTINCT e.id) as employee_count
      FROM employees e
      INNER JOIN burnout_predictions bp ON e.id = bp.employee_id
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
      GROUP BY fatigue_group
      ORDER BY MIN(e.mental_fatigue_score)
    `);

    // Get burn rate statistics
    const burnRateStatsResult = await query(`
      SELECT 
        MIN(bp.burn_rate) as min_burn_rate,
        MAX(bp.burn_rate) as max_burn_rate,
        AVG(bp.burn_rate) as avg_burn_rate,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bp.burn_rate) as median_burn_rate,
        STDDEV(bp.burn_rate) as stddev_burn_rate
      FROM burnout_predictions bp
      INNER JOIN (
        SELECT employee_id, MAX(prediction_date) as max_date
        FROM burnout_predictions
        GROUP BY employee_id
      ) latest ON bp.employee_id = latest.employee_id 
        AND bp.prediction_date = latest.max_date
    `);

    // Get employees with predictions count
    const employeesWithPredictionsResult = await query(`
      SELECT COUNT(DISTINCT employee_id) as count
      FROM burnout_predictions
    `);

    const overview: AnalyticsOverview = {
      total_employees: totalEmployees,
      high_risk_count: highRiskCount,
      critical_risk_count: criticalRiskCount,
      average_burn_rate: averageBurnRate,
      risk_distribution: riskDistribution,
    };

    return NextResponse.json({
      overview,
      breakdowns: {
        by_company_type: companyTypeResult.rows,
        by_gender: genderResult.rows,
        by_wfh: wfhResult.rows,
        by_designation: designationResult.rows,
        by_resource_allocation: resourceAllocationResult.rows,
        by_mental_fatigue: mentalFatigueResult.rows,
      },
      statistics: {
        burn_rate_stats: burnRateStatsResult.rows[0],
        employees_with_predictions: parseInt(employeesWithPredictionsResult.rows[0].count),
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

