/**
 * Import dataset from train.csv into the database
 * This script reads the training data and creates employee records with predictions
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

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

async function importDataset(limit: number = 100) {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), '..', 'DATASET 1', 'train.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} records in CSV`);
    console.log(`Importing first ${limit} records...`);

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < Math.min(limit, records.length); i++) {
      const row = records[i];
      
      try {
        // Skip rows with missing critical data
        if (!row['Employee ID'] || !row['Date of Joining'] || !row['Gender'] || 
            !row['Company Type'] || !row['Designation'] || !row['Resource Allocation'] || 
            !row['Mental Fatigue Score']) {
          console.log(`Skipping row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if employee already exists
        const checkQuery = `SELECT id FROM employees WHERE employee_id = $1`;
        const existing = await query(checkQuery, [row['Employee ID']]);
        
        if (existing.rows.length > 0) {
          console.log(`Employee ${row['Employee ID']} already exists, skipping...`);
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
          resource_allocation: parseFloat(row['Resource Allocation'] || '0'),
          mental_fatigue_score: parseFloat(row['Mental Fatigue Score'] || '0'),
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
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} employees...`);
        }
      } catch (error: any) {
        errors++;
        console.error(`Error importing row ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported} employees`);
    console.log(`   Errors: ${errors}`);
    console.log(`\nYou can now view the data in the dashboard at http://localhost:3000`);
  } catch (error: any) {
    console.error('Import error:', error);
    throw error;
  }
}

// Run if called directly (for Node.js script execution)
if (typeof require !== 'undefined' && require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 100;
  importDataset(limit)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { importDataset };

