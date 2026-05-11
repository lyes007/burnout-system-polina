/**
 * Preprocessing service that replicates the feature engineering and encoding
 * from the Jupyter notebook
 */

import { PredictionRequest } from '@/types';

export interface ProcessedFeatures {
  features: number[];
  featureNames: string[];
}

/**
 * Calculate years of service from date of joining
 */
function calculateYearsOfService(dateOfJoining: string): number {
  const joinDate = new Date(dateOfJoining);
  const currentDate = new Date('2024-01-01'); // Match notebook assumption
  const diffTime = currentDate.getTime() - joinDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays / 365.25;
}

/**
 * Extract month from date
 */
function extractMonth(dateOfJoining: string): number {
  return new Date(dateOfJoining).getMonth() + 1; // 1-12
}

/**
 * Create interaction features
 */
function createInteractionFeatures(
  gender: string,
  companyType: string,
  wfhSetup: boolean
): Record<string, string> {
  return {
    Gender_Company: `${gender}_${companyType}`,
    WFH_Company: `${wfhSetup ? 'Yes' : 'No'}_${companyType}`,
    Gender_WFH: `${gender}_${wfhSetup ? 'Yes' : 'No'}`,
  };
}

/**
 * Bin numerical features into categories
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
 * Preprocess employee data to match notebook feature engineering
 */
export function preprocessEmployeeData(data: PredictionRequest): ProcessedFeatures {
  // 1. Extract date features
  const yearsOfService = calculateYearsOfService(data.date_of_joining);
  const monthOfJoining = extractMonth(data.date_of_joining);

  // 2. Create interaction features
  const interactions = createInteractionFeatures(
    data.gender,
    data.company_type,
    data.wfh_setup_available
  );

  // 3. Bin numerical features
  const designationGroup = binFeature(
    data.designation,
    [-0.5, 1.5, 2.5, 5],
    ['Junior', 'Mid', 'Senior']
  );

  const fatigueGroup = binFeature(
    data.mental_fatigue_score,
    [0, 3, 6, 10],
    ['Low', 'Medium', 'High']
  );

  const resourceGroup = binFeature(
    data.resource_allocation,
    [0, 3, 6, 10],
    ['Low', 'Medium', 'High']
  );

  // 4. Prepare features for encoding
  // This matches the order from the notebook
  const rawFeatures = {
    // Original features
    Gender: data.gender,
    'Company Type': data.company_type,
    'WFH Setup Available': data.wfh_setup_available ? 'Yes' : 'No',
    Designation: data.designation,
    'Resource Allocation': data.resource_allocation,
    'Mental Fatigue Score': data.mental_fatigue_score,
    Years_of_Service: yearsOfService,
    Month_of_Joining: monthOfJoining,
    // Engineered features
    Gender_Company: interactions.Gender_Company,
    WFH_Company: interactions.WFH_Company,
    Gender_WFH: interactions.Gender_WFH,
    Designation_Group: designationGroup,
    Fatigue_Group: fatigueGroup,
    Resource_Group: resourceGroup,
  };

  // 5. OneHot encode categorical features and scale numerical features
  // This needs to match the exact encoding from the notebook
  const encodedFeatures = encodeFeatures(rawFeatures);

  return {
    features: encodedFeatures.values,
    featureNames: encodedFeatures.names,
  };
}

/**
 * Encode features using OneHot encoding for categoricals and scaling for numericals
 * This should match the ColumnTransformer from the notebook
 */
function encodeFeatures(rawFeatures: Record<string, any>): {
  values: number[];
  names: string[];
} {
  const values: number[] = [];
  const names: string[] = [];

  // Categorical features to OneHot encode
  const categoricalFeatures = [
    'Gender',
    'Company Type',
    'WFH Setup Available',
    'Gender_Company',
    'WFH_Company',
    'Gender_WFH',
    'Designation_Group',
    'Fatigue_Group',
    'Resource_Group',
  ];

  // Numerical features to scale
  const numericalFeatures = [
    'Designation',
    'Resource Allocation',
    'Mental Fatigue Score',
    'Years_of_Service',
    'Month_of_Joining',
  ];

  // OneHot encode categoricals
  // Note: This is a simplified version. In production, you'd use the exact
  // encoding learned during training (with the same categories and order)
  for (const feature of categoricalFeatures) {
    const value = rawFeatures[feature];
    // This is a placeholder - actual encoding should match the trained model
    // You'll need to save the OneHotEncoder and StandardScaler from the notebook
    // For now, we'll create a basic encoding structure
    const encoded = oneHotEncode(feature, value);
    values.push(...encoded.values);
    names.push(...encoded.names);
  }

  // Scale numericals
  // Note: This should use the exact scaler from training
  // For now, using placeholder scaling
  for (const feature of numericalFeatures) {
    const value = rawFeatures[feature];
    const scaled = standardScale(feature, value);
    values.push(scaled);
    names.push(feature);
  }

  return { values, names };
}

/**
 * Simplified OneHot encoding
 * In production, use the exact encoder from training
 * 
 * NOTE: For accurate predictions, you need to:
 * 1. Save the preprocessor from the notebook using save-preprocessor.py
 * 2. Load it in the Next.js app
 * 3. Use the exact same encoding
 */
function oneHotEncode(featureName: string, value: any): {
  values: number[];
  names: string[];
} {
  const values: number[] = [];
  const names: string[] = [];

  // Simplified encoding - this should match the exact categories from training
  // For now, using basic binary encoding as placeholder
  
  if (featureName === 'Gender') {
    // Male=1, Female=0 (drop first)
    values.push(value === 'Male' ? 1 : 0);
    names.push('Gender_Male');
  } else if (featureName === 'Company Type') {
    // Service=1, Product=0 (drop first)
    values.push(value === 'Service' ? 1 : 0);
    names.push('Company_Type_Service');
  } else if (featureName === 'WFH Setup Available') {
    // Yes=1, No=0 (drop first)
    values.push(value === 'Yes' ? 1 : 0);
    names.push('WFH_Setup_Available_Yes');
  } else {
    // For interaction features and groups, use simplified encoding
    // In production, these need full OneHot encoding with all categories
    const categories = getCategoriesForFeature(featureName);
    categories.forEach((cat, idx) => {
      values.push(value === cat ? 1 : 0);
      names.push(`${featureName}_${cat}`);
    });
  }

  return { values, names };
}

/**
 * Get categories for a feature (simplified)
 */
function getCategoriesForFeature(featureName: string): string[] {
  // This should match the exact categories from the trained encoder
  // For now, using known categories
  const categoryMap: Record<string, string[]> = {
    'Gender_Company': ['Male_Service', 'Female_Service', 'Male_Product', 'Female_Product'],
    'WFH_Company': ['Yes_Service', 'No_Service', 'Yes_Product', 'No_Product'],
    'Gender_WFH': ['Male_Yes', 'Female_Yes', 'Male_No', 'Female_No'],
    'Designation_Group': ['Junior', 'Mid', 'Senior'],
    'Fatigue_Group': ['Low', 'Medium', 'High'],
    'Resource_Group': ['Low', 'Medium', 'High'],
  };
  
  return categoryMap[featureName] || [];
}

/**
 * Simplified standard scaling
 * In production, use the exact scaler from training
 * 
 * NOTE: You need to save the StandardScaler from the notebook
 * and use the exact mean and std values
 */
function standardScale(featureName: string, value: number): number {
  // Placeholder scaling - should use exact mean and std from training
  // For now, using approximate values based on typical ranges
  
  const scalingParams: Record<string, { mean: number; std: number }> = {
    'Designation': { mean: 2.0, std: 1.0 },
    'Resource Allocation': { mean: 4.5, std: 2.0 },
    'Mental Fatigue Score': { mean: 5.0, std: 2.0 },
    'Years_of_Service': { mean: 15.5, std: 0.5 },
    'Month_of_Joining': { mean: 6.5, std: 3.5 },
  };
  
  const params = scalingParams[featureName];
  if (params) {
    return (value - params.mean) / params.std;
  }
  
  // Default: no scaling if feature not found
  return value;
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

