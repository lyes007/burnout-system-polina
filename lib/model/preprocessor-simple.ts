/**
 * Simplified preprocessing that works without saved preprocessor
 * For production, use the saved preprocessor from the notebook
 */

import { PredictionRequest } from '@/types';

/**
 * Calculate years of service
 */
function calculateYearsOfService(dateOfJoining: string): number {
  const joinDate = new Date(dateOfJoining);
  const currentDate = new Date('2024-01-01');
  const diffTime = currentDate.getTime() - joinDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays / 365.25;
}

/**
 * Extract month
 */
function extractMonth(dateOfJoining: string): number {
  return new Date(dateOfJoining).getMonth() + 1;
}

/**
 * Bin feature value
 */
function binFeature(value: number, bins: number[], labels: string[]): string {
  for (let i = 0; i < bins.length - 1; i++) {
    if (value >= bins[i] && value < bins[i + 1]) {
      return labels[i];
    }
  }
  return labels[labels.length - 1];
}

/**
 * Simplified preprocessing - creates feature array
 * Note: This is a simplified version. For exact matching with the model,
 * you need to use the saved preprocessor from the notebook.
 */
export function preprocessEmployeeDataSimple(data: PredictionRequest): number[] {
  // Feature engineering
  const yearsOfService = calculateYearsOfService(data.date_of_joining);
  const monthOfJoining = extractMonth(data.date_of_joining);
  
  const designationGroup = binFeature(data.designation, [-0.5, 1.5, 2.5, 5], ['Junior', 'Mid', 'Senior']);
  const fatigueGroup = binFeature(data.mental_fatigue_score, [0, 3, 6, 10], ['Low', 'Medium', 'High']);
  const resourceGroup = binFeature(data.resource_allocation, [0, 3, 6, 10], ['Low', 'Medium', 'High']);
  
  const genderCompany = `${data.gender}_${data.company_type}`;
  const wfhCompany = `${data.wfh_setup_available ? 'Yes' : 'No'}_${data.company_type}`;
  const genderWFH = `${data.gender}_${data.wfh_setup_available ? 'Yes' : 'No'}`;
  
  // Create feature array
  // This is a simplified version - actual encoding should match the trained model
  // For now, we'll create a basic numerical representation
  const features: number[] = [];
  
  // Numerical features (will be scaled)
  features.push(data.designation);
  features.push(data.resource_allocation);
  features.push(data.mental_fatigue_score);
  features.push(yearsOfService);
  features.push(monthOfJoining);
  
  // Categorical features (OneHot encoded - simplified)
  // Gender: Male=1, Female=0
  features.push(data.gender === 'Male' ? 1 : 0);
  
  // Company Type: Service=1, Product=0 (drop first)
  features.push(data.company_type === 'Service' ? 1 : 0);
  
  // WFH: Yes=1, No=0
  features.push(data.wfh_setup_available ? 1 : 0);
  
  // Interaction features (simplified - would need full OneHot encoding)
  // For now, using binary representations
  features.push(genderCompany.includes('Male') ? 1 : 0);
  features.push(genderCompany.includes('Service') ? 1 : 0);
  features.push(wfhCompany.includes('Yes') ? 1 : 0);
  features.push(wfhCompany.includes('Service') ? 1 : 0);
  features.push(genderWFH.includes('Male') ? 1 : 0);
  features.push(genderWFH.includes('Yes') ? 1 : 0);
  
  // Binned features
  features.push(designationGroup === 'Junior' ? 0 : designationGroup === 'Mid' ? 1 : 2);
  features.push(fatigueGroup === 'Low' ? 0 : fatigueGroup === 'Medium' ? 1 : 2);
  features.push(resourceGroup === 'Low' ? 0 : resourceGroup === 'Medium' ? 1 : 2);
  
  // Apply simple scaling (mean=0, std=1 approximation)
  // In production, use exact scaler from training
  const scaled = features.map((val, idx) => {
    // Simple normalization - should use exact scaler
    return val; // Placeholder - needs proper scaling
  });
  
  return scaled;
}

/**
 * Get risk level from burn rate
 */
export function getRiskLevel(burnRate: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (burnRate < 0.3) return 'Low';
  if (burnRate < 0.6) return 'Medium';
  if (burnRate < 0.8) return 'High';
  return 'Critical';
}




