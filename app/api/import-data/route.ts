import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const MODEL_API_URL = process.env.MODEL_API_URL || 'http://localhost:8000';

interface CSVRow {
  'Employee ID': string;
  'Date of Joining': string;
  'Gender': string;
  'Company Type': string;
  'WFH Setup Available': string;
  'Designation': string;
  'Resource Allocation': string;
  'Mental Fatigue Score': string;
  'Burn Rate': string;
}

async function makePrediction(employeeData: any) {
  try {
    const response = await fetch(`${MODEL_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: employeeData.employee_id,
        date_of_joining: employeeData.date_of_joining,
        gender: employeeData.gender,
        company_type: employeeData.company_type,
        wfh_setup_available: employeeData.wfh_setup_available === 'Yes',
        designation: parseFloat(employeeData.designation),
        resource_allocation: parseFloat(employeeData.resource_allocation),
        mental_fatigue_score: parseFloat(employeeData.mental_fatigue_score),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      burn_rate: result.burn_rate,
      risk_level: result.risk_level,
    };
  } catch (error) {
    console.error('Prediction error:', error);
    // Return a default prediction if API fails
    const burnRate = parseFloat(employeeData.burn_rate || '0.5');
    return {
      burn_rate: burnRate,
      risk_level: burnRate < 0.3 ? 'Low' : burnRate < 0.6 ? 'Medium' : burnRate < 0.8 ? 'High' : 'Critical',
    };
  }
}

/**
 * POST /api/import-data
 * Import dataset from train.csv into the database
 * 
 * Query params:
 * - limit: Number of records to import (default: 100)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    if (limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), '..', 'DATASET 1', 'train.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'train.csv not found. Make sure DATASET 1/train.csv exists.' },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorsList: string[] = [];

    for (let i = 0; i < Math.min(limit, records.length); i++) {
      const row = records[i];
      
      try {
        // Skip rows with missing critical data
        if (!row['Employee ID'] || !row['Date of Joining'] || !row['Gender'] || 
            !row['Company Type'] || !row['Designation'] || 
            !row['Resource Allocation'] || row['Resource Allocation'] === '' ||
            !row['Mental Fatigue Score'] || row['Mental Fatigue Score'] === '') {
          skipped++;
          continue;
        }

        // Check if employee already exists
        const checkQuery = `SELECT id FROM employees WHERE employee_id = $1`;
        const existing = await query(checkQuery, [row['Employee ID']]);
        
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Prepare employee data
        const employeeData = {
          employee_id: row['Employee ID'],
          name: `Employee ${row['Employee ID'].substring(0, 8)}`,
          email: `employee${row['Employee ID'].substring(0, 8)}@company.com`,
          gender: row['Gender'],
          company_type: row['Company Type'],
          wfh_setup_available: row['WFH Setup Available'] === 'Yes',
          designation: parseFloat(row['Designation']),
          resource_allocation: parseFloat(row['Resource Allocation']),
          mental_fatigue_score: parseFloat(row['Mental Fatigue Score']),
          date_of_joining: row['Date of Joining'],
          burn_rate: row['Burn Rate'] || '0',
        };

        // Insert employee
        const insertQuery = `
          INSERT INTO employees (
            employee_id, name, email, gender, company_type,
            wfh_setup_available, designation, resource_allocation,
            mental_fatigue_score, date_of_joining
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `;

        const result = await query(insertQuery, [
          employeeData.employee_id,
          employeeData.name,
          employeeData.email,
          employeeData.gender,
          employeeData.company_type,
          employeeData.wfh_setup_available,
          employeeData.designation,
          employeeData.resource_allocation,
          employeeData.mental_fatigue_score,
          employeeData.date_of_joining,
        ]);

        const employeeId = result.rows[0].id;

        // Make prediction
        const prediction = await makePrediction(employeeData);

        // Save prediction
        const predictionQuery = `
          INSERT INTO burnout_predictions (
            employee_id, burn_rate, risk_level, model_version
          )
          VALUES ($1, $2, $3, $4)
        `;

        await query(predictionQuery, [
          employeeId,
          prediction.burn_rate,
          prediction.risk_level,
          '1.0',
        ]);

        imported++;
      } catch (error: any) {
        errors++;
        if (errorsList.length < 10) {
          errorsList.push(`Row ${i + 1}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      message: 'Import complete',
      imported,
      skipped,
      errors,
      total_processed: Math.min(limit, records.length),
      errors_list: errorsList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import-data
 * Get import instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to import data. Add ?limit=100 to import 100 records.',
    example: 'POST /api/import-data?limit=100',
  });
}
