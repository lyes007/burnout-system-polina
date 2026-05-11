export type Gender = 'Male' | 'Female';
export type CompanyType = 'Service' | 'Product';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Employee {
  id: string;
  employee_id: string;
  name?: string;
  email?: string;
  gender: Gender;
  company_type: CompanyType;
  wfh_setup_available: boolean;
  designation: number;
  resource_allocation: number;
  mental_fatigue_score: number;
  date_of_joining: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface BurnoutPrediction {
  id: string;
  employee_id: string;
  burn_rate: number;
  risk_level: RiskLevel;
  prediction_date: Date | string;
  model_version: string;
}

export interface EmployeeWithPrediction extends Employee {
  prediction?: BurnoutPrediction;
}

export interface AnalyticsOverview {
  total_employees: number;
  high_risk_count: number;
  critical_risk_count: number;
  average_burn_rate: number;
  risk_distribution: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
}

export interface PredictionRequest {
  gender: Gender;
  company_type: CompanyType;
  wfh_setup_available: boolean;
  designation: number;
  resource_allocation: number;
  mental_fatigue_score: number;
  date_of_joining: string;
}

export interface PredictionResponse {
  burn_rate: number;
  risk_level: RiskLevel;
}

