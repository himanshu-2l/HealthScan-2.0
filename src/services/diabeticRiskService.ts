/**
 * Diabetic Risk Calculator Service
 * AI-powered risk assessment based on multiple factors
 */

export interface RiskFactors {
  age: number;
  familyHistory: 'none' | 'parent' | 'sibling' | 'both';
  bmi: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  mealHabits: 'regular' | 'irregular' | 'frequent-snacking' | 'skipping-meals';
  systolicBP?: number; // mmHg
  diastolicBP?: number; // mmHg
  fastingGlucose?: number; // mg/dL
  postMealGlucose?: number; // mg/dL
  hba1c?: number; // percentage
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskCategory: 'low' | 'moderate' | 'high' | 'very-high';
  riskPercentage: number; // Estimated probability of developing diabetes
  factors: {
    factor: string;
    contribution: number; // 0-100, how much this factor contributes
    severity: 'low' | 'moderate' | 'high';
  }[];
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Calculate diabetic risk score
 */
export const calculateDiabeticRisk = (factors: RiskFactors): RiskAssessment => {
  let riskScore = 0;
  const factorContributions: RiskAssessment['factors'] = [];

  // Age factor (0-15 points)
  if (factors.age >= 65) {
    riskScore += 15;
    factorContributions.push({
      factor: 'Age (65+)',
      contribution: 15,
      severity: 'high',
    });
  } else if (factors.age >= 45) {
    riskScore += 10;
    factorContributions.push({
      factor: 'Age (45-64)',
      contribution: 10,
      severity: 'moderate',
    });
  } else if (factors.age >= 35) {
    riskScore += 5;
    factorContributions.push({
      factor: 'Age (35-44)',
      contribution: 5,
      severity: 'low',
    });
  }

  // Family history (0-20 points)
  if (factors.familyHistory === 'both') {
    riskScore += 20;
    factorContributions.push({
      factor: 'Family History (Both parents/siblings)',
      contribution: 20,
      severity: 'high',
    });
  } else if (factors.familyHistory === 'parent' || factors.familyHistory === 'sibling') {
    riskScore += 12;
    factorContributions.push({
      factor: `Family History (${factors.familyHistory === 'parent' ? 'Parent' : 'Sibling'})`,
      contribution: 12,
      severity: 'moderate',
    });
  }

  // BMI factor (0-20 points)
  if (factors.bmi >= 30) {
    riskScore += 20;
    factorContributions.push({
      factor: `BMI (${factors.bmi.toFixed(1)} - Obese)`,
      contribution: 20,
      severity: 'high',
    });
  } else if (factors.bmi >= 25) {
    riskScore += 12;
    factorContributions.push({
      factor: `BMI (${factors.bmi.toFixed(1)} - Overweight)`,
      contribution: 12,
      severity: 'moderate',
    });
  } else if (factors.bmi < 18.5) {
    riskScore += 3;
    factorContributions.push({
      factor: `BMI (${factors.bmi.toFixed(1)} - Underweight)`,
      contribution: 3,
      severity: 'low',
    });
  }

  // Activity level (0-15 points, reverse - more activity = less risk)
  if (factors.activityLevel === 'sedentary') {
    riskScore += 15;
    factorContributions.push({
      factor: 'Sedentary Lifestyle',
      contribution: 15,
      severity: 'high',
    });
  } else if (factors.activityLevel === 'light') {
    riskScore += 10;
    factorContributions.push({
      factor: 'Light Activity',
      contribution: 10,
      severity: 'moderate',
    });
  } else if (factors.activityLevel === 'moderate') {
    riskScore += 5;
    factorContributions.push({
      factor: 'Moderate Activity',
      contribution: 5,
      severity: 'low',
    });
  }

  // Meal habits (0-10 points)
  if (factors.mealHabits === 'irregular' || factors.mealHabits === 'skipping-meals') {
    riskScore += 10;
    factorContributions.push({
      factor: 'Irregular Meal Patterns',
      contribution: 10,
      severity: 'moderate',
    });
  } else if (factors.mealHabits === 'frequent-snacking') {
    riskScore += 7;
    factorContributions.push({
      factor: 'Frequent Snacking',
      contribution: 7,
      severity: 'moderate',
    });
  }

  // Blood pressure (0-10 points)
  if (factors.systolicBP && factors.diastolicBP) {
    if (factors.systolicBP >= 140 || factors.diastolicBP >= 90) {
      riskScore += 10;
      factorContributions.push({
        factor: `High BP (${factors.systolicBP}/${factors.diastolicBP} mmHg)`,
        contribution: 10,
        severity: 'high',
      });
    } else if (factors.systolicBP >= 130 || factors.diastolicBP >= 80) {
      riskScore += 5;
      factorContributions.push({
        factor: `Elevated BP (${factors.systolicBP}/${factors.diastolicBP} mmHg)`,
        contribution: 5,
        severity: 'moderate',
      });
    }
  }

  // Glucose levels (0-20 points)
  if (factors.fastingGlucose) {
    if (factors.fastingGlucose >= 126) {
      riskScore += 20;
      factorContributions.push({
        factor: `Fasting Glucose (${factors.fastingGlucose} mg/dL - Diabetic)`,
        contribution: 20,
        severity: 'high',
      });
    } else if (factors.fastingGlucose >= 100) {
      riskScore += 12;
      factorContributions.push({
        factor: `Fasting Glucose (${factors.fastingGlucose} mg/dL - Prediabetic)`,
        contribution: 12,
        severity: 'moderate',
      });
    }
  }

  if (factors.postMealGlucose) {
    if (factors.postMealGlucose >= 200) {
      riskScore += 20;
      factorContributions.push({
        factor: `Post-Meal Glucose (${factors.postMealGlucose} mg/dL - Diabetic)`,
        contribution: 20,
        severity: 'high',
      });
    } else if (factors.postMealGlucose >= 140) {
      riskScore += 10;
      factorContributions.push({
        factor: `Post-Meal Glucose (${factors.postMealGlucose} mg/dL - Prediabetic)`,
        contribution: 10,
        severity: 'moderate',
      });
    }
  }

  if (factors.hba1c) {
    if (factors.hba1c >= 6.5) {
      riskScore += 20;
      factorContributions.push({
        factor: `HbA1c (${factors.hba1c}% - Diabetic)`,
        contribution: 20,
        severity: 'high',
      });
    } else if (factors.hba1c >= 5.7) {
      riskScore += 12;
      factorContributions.push({
        factor: `HbA1c (${factors.hba1c}% - Prediabetic)`,
        contribution: 12,
        severity: 'moderate',
      });
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  // Determine risk category
  let riskCategory: 'low' | 'moderate' | 'high' | 'very-high';
  let riskPercentage: number;
  
  if (riskScore >= 70) {
    riskCategory = 'very-high';
    riskPercentage = 60 + (riskScore - 70) * 1.2; // 60-96%
  } else if (riskScore >= 50) {
    riskCategory = 'high';
    riskPercentage = 30 + (riskScore - 50) * 1.5; // 30-60%
  } else if (riskScore >= 30) {
    riskCategory = 'moderate';
    riskPercentage = 10 + (riskScore - 30) * 1.0; // 10-30%
  } else {
    riskCategory = 'low';
    riskPercentage = riskScore * 0.33; // 0-10%
  }

  riskPercentage = Math.min(95, Math.max(1, riskPercentage));

  // Generate recommendations
  const recommendations: string[] = [];
  const nextSteps: string[] = [];

  if (riskCategory === 'very-high' || riskCategory === 'high') {
    recommendations.push('Consult with a healthcare provider immediately for comprehensive diabetes screening');
    recommendations.push('Consider getting HbA1c test done for accurate assessment');
    recommendations.push('Start monitoring blood glucose levels regularly');
    nextSteps.push('Schedule appointment with endocrinologist or primary care physician');
    nextSteps.push('Get comprehensive blood work including fasting glucose, HbA1c, and lipid profile');
  } else if (riskCategory === 'moderate') {
    recommendations.push('Make lifestyle modifications: increase physical activity, improve diet');
    recommendations.push('Monitor blood glucose levels periodically');
    recommendations.push('Consider annual diabetes screening');
    nextSteps.push('Consult with healthcare provider for preventive strategies');
    nextSteps.push('Join diabetes prevention program if available');
  } else {
    recommendations.push('Maintain healthy lifestyle habits');
    recommendations.push('Continue regular health checkups');
    recommendations.push('Stay physically active and maintain healthy weight');
    nextSteps.push('Annual health screening recommended');
  }

  // Add specific recommendations based on factors
  if (factors.bmi >= 25) {
    recommendations.push(`Aim to reduce BMI to below 25 (current: ${factors.bmi.toFixed(1)})`);
  }
  if (factors.activityLevel === 'sedentary' || factors.activityLevel === 'light') {
    recommendations.push('Increase physical activity - aim for 150 minutes of moderate exercise per week');
  }
  if (factors.mealHabits === 'irregular' || factors.mealHabits === 'skipping-meals') {
    recommendations.push('Establish regular meal patterns - eat at consistent times daily');
  }
  if (factors.systolicBP && factors.systolicBP >= 130) {
    recommendations.push('Manage blood pressure through diet, exercise, and medication if needed');
  }

  return {
    riskScore,
    riskCategory,
    riskPercentage: Math.round(riskPercentage),
    factors: factorContributions.sort((a, b) => b.contribution - a.contribution),
    recommendations,
    nextSteps,
  };
};

/**
 * Get risk heatmap data for 7 days
 */
export interface RiskHeatmapData {
  date: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  riskScore: number;
}

export const generateRiskHeatmap = (
  assessment: RiskAssessment,
  days: number = 7
): RiskHeatmapData[] => {
  const heatmap: RiskHeatmapData[] = [];
  const today = new Date();

  // Base risk from assessment
  const baseRisk = assessment.riskScore;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Add slight variation based on day of week (weekends might have different patterns)
    const dayOfWeek = date.getDay();
    let dailyVariation = 0;
    
    // Simulate weekend effect (less activity, more irregular meals)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dailyVariation = Math.random() * 5 + 2; // +2 to +7
    } else {
      dailyVariation = (Math.random() - 0.5) * 4; // -2 to +2
    }
    
    const dailyRiskScore = Math.max(0, Math.min(100, baseRisk + dailyVariation));
    
    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
    if (dailyRiskScore >= 70) {
      riskLevel = 'very-high';
    } else if (dailyRiskScore >= 50) {
      riskLevel = 'high';
    } else if (dailyRiskScore >= 30) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }
    
    heatmap.push({
      date: date.toISOString().split('T')[0],
      riskLevel,
      riskScore: Math.round(dailyRiskScore),
    });
  }
  
  return heatmap;
};

