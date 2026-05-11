-- Database schema for HR Dashboard
-- Run this script to initialize the database

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')) NOT NULL,
  company_type VARCHAR(20) CHECK (company_type IN ('Service', 'Product')) NOT NULL,
  wfh_setup_available BOOLEAN NOT NULL,
  designation FLOAT NOT NULL,
  resource_allocation FLOAT NOT NULL,
  mental_fatigue_score FLOAT NOT NULL,
  date_of_joining DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create burnout_predictions table
CREATE TABLE IF NOT EXISTS burnout_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  burn_rate FLOAT NOT NULL CHECK (burn_rate >= 0 AND burn_rate <= 1),
  risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model_version VARCHAR(50) DEFAULT '1.0'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_predictions_employee_id ON burnout_predictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON burnout_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_burn_rate ON burnout_predictions(burn_rate);

