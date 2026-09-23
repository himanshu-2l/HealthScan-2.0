/**
 * Blood Glucose Data Service
 * Manages glucose readings storage, AI prediction, and trend analysis
 */

export interface GlucoseReading {
  id: string;
  fasting?: number; // mg/dL
  postMeal?: number; // mg/dL
  hba1c?: number; // percentage
  timestamp: string;
  date: string; // YYYY-MM-DD format
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
}

export interface GlucosePrediction {
  date: string;
  predictedFasting: number;
  predictedPostMeal: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number; // 0-100
}

export interface GlucoseTrend {
  date: string;
  fasting: number | null;
  postMeal: number | null;
  predictedFasting: number | null;
  predictedPostMeal: number | null;
}

export interface GlucoseInsight {
  type: 'spike' | 'crash' | 'pattern' | 'risk';
  severity: 'low' | 'moderate' | 'high';
  message: string;
  reasons: string[];
  recommendation: string;
}

export interface GlucoseStats {
  averageFasting: number;
  averagePostMeal: number;
  minFasting: number;
  maxFasting: number;
  minPostMeal: number;
  maxPostMeal: number;
  readingCount: number;
  lastReading?: GlucoseReading;
  hba1c?: number;
}

const STORAGE_KEY = 'healthScan_glucose_readings';

/**
 * Save a glucose reading
 */
export const saveGlucoseReading = (reading: Omit<GlucoseReading, 'id' | 'date'>): GlucoseReading => {
  try {
    const readings = getAllGlucoseReadings();
    const date = new Date(reading.timestamp).toISOString().split('T')[0];
    
    const newReading: GlucoseReading = {
      ...reading,
      id: `glucose-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
    };
    
    readings.push(newReading);
    
    // Sort by timestamp (newest first)
    readings.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    return newReading;
  } catch (error) {
    console.error('Error saving glucose reading:', error);
    throw new Error('Failed to save glucose reading');
  }
};

/**
 * Get all glucose readings
 */
export const getAllGlucoseReadings = (): GlucoseReading[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as GlucoseReading[];
  } catch (error) {
    console.error('Error retrieving glucose readings:', error);
    return [];
  }
};

/**
 * Get glucose readings filtered by date range
 */
export const getGlucoseReadingsByDateRange = (
  startDate: Date,
  endDate: Date
): GlucoseReading[] => {
  const allReadings = getAllGlucoseReadings();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return allReadings.filter(reading => {
    const readingTime = new Date(reading.timestamp).getTime();
    return readingTime >= start && readingTime <= end;
  });
};

/**
 * Get glucose readings for a specific period
 */
export const getGlucoseReadingsForPeriod = (
  period: 'daily' | 'weekly' | 'monthly'
): GlucoseReading[] => {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
  }
  
  return getGlucoseReadingsByDateRange(startDate, now);
};

/**
 * Calculate glucose statistics
 */
export const calculateGlucoseStats = (readings: GlucoseReading[]): GlucoseStats => {
  if (readings.length === 0) {
    return {
      averageFasting: 0,
      averagePostMeal: 0,
      minFasting: 0,
      maxFasting: 0,
      minPostMeal: 0,
      maxPostMeal: 0,
      readingCount: 0,
    };
  }
  
  const fastingValues = readings.filter(r => r.fasting !== undefined).map(r => r.fasting!);
  const postMealValues = readings.filter(r => r.postMeal !== undefined).map(r => r.postMeal!);
  const hba1cValues = readings.filter(r => r.hba1c !== undefined).map(r => r.hba1c!);
  
  return {
    averageFasting: fastingValues.length > 0
      ? Math.round(fastingValues.reduce((a, b) => a + b, 0) / fastingValues.length)
      : 0,
    averagePostMeal: postMealValues.length > 0
      ? Math.round(postMealValues.reduce((a, b) => a + b, 0) / postMealValues.length)
      : 0,
    minFasting: fastingValues.length > 0 ? Math.min(...fastingValues) : 0,
    maxFasting: fastingValues.length > 0 ? Math.max(...fastingValues) : 0,
    minPostMeal: postMealValues.length > 0 ? Math.min(...postMealValues) : 0,
    maxPostMeal: postMealValues.length > 0 ? Math.max(...postMealValues) : 0,
    readingCount: readings.length,
    lastReading: readings[0],
    hba1c: hba1cValues.length > 0
      ? parseFloat((hba1cValues.reduce((a, b) => a + b, 0) / hba1cValues.length).toFixed(1))
      : undefined,
  };
};

/**
 * Get glucose category (normal, prediabetic, diabetic, etc.)
 */
export const getGlucoseCategory = (
  fasting?: number,
  postMeal?: number,
  hba1c?: number
): {
  category: string;
  severity: 'normal' | 'prediabetic' | 'diabetic' | 'critical';
  color: string;
} => {
  // Hypoglycemia check across both fasting and post-meal readings (< 70 mg/dL)
  const isFastingHypo = fasting !== undefined && fasting !== null && fasting < 70;
  const isPostMealHypo = postMeal !== undefined && postMeal !== null && postMeal < 70;
  if (isFastingHypo || isPostMealHypo) {
    return {
      category: 'Hypoglycemia',
      severity: 'critical',
      color: 'red',
    };
  }

  // Critical hyperglycemia levels
  if (fasting && fasting >= 250) {
    return {
      category: 'Critical Hyperglycemia',
      severity: 'critical',
      color: 'red',
    };
  }
  if (postMeal && postMeal >= 300) {
    return {
      category: 'Critical Post-Meal High',
      severity: 'critical',
      color: 'red',
    };
  }

  // Diabetic levels
  if (hba1c && hba1c >= 6.5) {
    return {
      category: 'Diabetic (HbA1c)',
      severity: 'diabetic',
      color: 'red',
    };
  }
  if (fasting && fasting >= 126) {
    return {
      category: 'Diabetic (Fasting)',
      severity: 'diabetic',
      color: 'red',
    };
  }
  if (postMeal && postMeal >= 200) {
    return {
      category: 'Diabetic (Post-Meal)',
      severity: 'diabetic',
      color: 'red',
    };
  }

  // Prediabetic levels
  if (hba1c && hba1c >= 5.7 && hba1c < 6.5) {
    return {
      category: 'Prediabetic (HbA1c)',
      severity: 'prediabetic',
      color: 'orange',
    };
  }
  if (fasting && fasting >= 100 && fasting < 126) {
    return {
      category: 'Prediabetic (Fasting)',
      severity: 'prediabetic',
      color: 'orange',
    };
  }
  if (postMeal && postMeal >= 140 && postMeal < 200) {
    return {
      category: 'Prediabetic (Post-Meal)',
      severity: 'prediabetic',
      color: 'orange',
    };
  }

  // Normal
  return {
    category: 'Normal',
    severity: 'normal',
    color: 'green',
  };
};

/**
 * Simple linear regression prediction model
 * Predicts next 7 days of glucose trends
 */
export const predictGlucoseTrend = (readings: GlucoseReading[]): GlucosePrediction[] => {
  if (readings.length < 2) {
    // Not enough data, return default predictions
    const predictions: GlucosePrediction[] = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedFasting: 100,
        predictedPostMeal: 140,
        riskLevel: 'moderate',
        confidence: 50,
      });
    }
    return predictions;
  }

  // Get recent readings (last 14 days)
  const recentReadings = readings.slice(0, 14);
  const fastingReadings = recentReadings.filter(r => r.fasting !== undefined);
  const postMealReadings = recentReadings.filter(r => r.postMeal !== undefined);

  // Simple moving average with trend
  const avgFasting = fastingReadings.length > 0
    ? fastingReadings.reduce((sum, r) => sum + r.fasting!, 0) / fastingReadings.length
    : 100;
  const avgPostMeal = postMealReadings.length > 0
    ? postMealReadings.reduce((sum, r) => sum + r.postMeal!, 0) / postMealReadings.length
    : 140;

  // Calculate trend (simple linear regression)
  let fastingTrend = 0;
  let postMealTrend = 0;
  
  if (fastingReadings.length >= 2) {
    const sorted = [...fastingReadings].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const n = sorted.length;
    const sumX = sorted.reduce((sum, _, i) => sum + i, 0);
    const sumY = sorted.reduce((sum, r) => sum + r.fasting!, 0);
    const sumXY = sorted.reduce((sum, r, i) => sum + i * r.fasting!, 0);
    const sumX2 = sorted.reduce((sum, _, i) => sum + i * i, 0);
    
    fastingTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
  
  if (postMealReadings.length >= 2) {
    const sorted = [...postMealReadings].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const n = sorted.length;
    const sumX = sorted.reduce((sum, _, i) => sum + i, 0);
    const sumY = sorted.reduce((sum, r) => sum + r.postMeal!, 0);
    const sumXY = sorted.reduce((sum, r, i) => sum + i * r.postMeal!, 0);
    const sumX2 = sorted.reduce((sum, _, i) => sum + i * i, 0);
    
    postMealTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  // Generate predictions for next 7 days
  const predictions: GlucosePrediction[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const predictedFasting = Math.max(70, Math.min(250, avgFasting + fastingTrend * i));
    const predictedPostMeal = Math.max(80, Math.min(300, avgPostMeal + postMealTrend * i));
    
    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'moderate';
    if (predictedFasting >= 250 || predictedFasting < 70 || predictedPostMeal >= 300 || predictedPostMeal < 70) {
      riskLevel = 'critical';
    } else if (predictedFasting >= 126 || predictedPostMeal >= 200) {
      riskLevel = 'high';
    } else if (predictedFasting >= 100 || predictedPostMeal >= 140) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }
    
    // Calculate confidence based on data points
    const confidence = Math.min(95, 50 + Math.min(fastingReadings.length, postMealReadings.length) * 5);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedFasting: Math.round(predictedFasting),
      predictedPostMeal: Math.round(predictedPostMeal),
      riskLevel,
      confidence,
    });
  }
  
  return predictions;
};

/**
 * Generate AI insights from glucose patterns
 */
export const generateGlucoseInsights = (
  readings: GlucoseReading[],
  predictions: GlucosePrediction[]
): GlucoseInsight[] => {
  const insights: GlucoseInsight[] = [];
  
  if (readings.length === 0) {
    return insights;
  }

  const stats = calculateGlucoseStats(readings);
  const recentReadings = readings.slice(0, 7);

  // Check for dinner spikes
  const dinnerReadings = recentReadings.filter(r => r.mealType === 'dinner' && r.postMeal);
  if (dinnerReadings.length > 0) {
    const avgDinnerPostMeal = dinnerReadings.reduce((sum, r) => sum + r.postMeal!, 0) / dinnerReadings.length;
    if (avgDinnerPostMeal > 180) {
      insights.push({
        type: 'spike',
        severity: 'high',
        message: 'Your sugars spike after dinner — reduce carbs at night.',
        reasons: [
          'High post-dinner glucose readings detected',
          `Average post-dinner: ${Math.round(avgDinnerPostMeal)} mg/dL`,
          'Late-night meals may be contributing',
        ],
        recommendation: 'Consider eating dinner earlier and reducing carbohydrate intake in the evening. Opt for protein-rich, low-carb dinner options.',
      });
    }
  }

  // Check for irregular readings pattern
  if (readings.length >= 5) {
    const intervals: number[] = [];
    for (let i = 0; i < readings.length - 1; i++) {
      const diff = new Date(readings[i].timestamp).getTime() - new Date(readings[i + 1].timestamp).getTime();
      intervals.push(diff / (1000 * 60 * 60)); // Convert to hours
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    if (variance > 100) { // High variance in reading intervals
      insights.push({
        type: 'pattern',
        severity: 'moderate',
        message: 'Irregular glucose monitoring detected — consistent readings improve prediction accuracy.',
        reasons: [
          'Readings are taken at inconsistent times',
          'Irregular monitoring makes trend analysis difficult',
        ],
        recommendation: 'Try to take readings at consistent times: fasting (morning), 2 hours after meals. This helps AI predictions become more accurate.',
      });
    }
  }

  // Check for high BMI correlation (if available from other data)
  if (stats.averageFasting > 110 && stats.averagePostMeal > 160) {
    insights.push({
      type: 'risk',
      severity: 'high',
      message: 'Elevated glucose levels detected — consider lifestyle modifications.',
      reasons: [
        `Average fasting glucose: ${stats.averageFasting} mg/dL`,
        `Average post-meal glucose: ${stats.averagePostMeal} mg/dL`,
        'Consistently elevated levels may indicate insulin resistance',
      ],
      recommendation: 'Consult with your healthcare provider. Consider increasing physical activity, improving diet, and monitoring more frequently.',
    });
  }

  // Check predicted spikes
  const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
  if (highRiskPredictions.length > 0) {
    insights.push({
      type: 'spike',
      severity: highRiskPredictions.some(p => p.riskLevel === 'critical') ? 'high' : 'moderate',
      message: `AI predicts ${highRiskPredictions.length} high-risk periods in the next 7 days.`,
      reasons: [
        'Trend analysis shows rising glucose levels',
        'Pattern suggests potential spikes',
        'Recent readings indicate elevated baseline',
      ],
      recommendation: 'Increase monitoring frequency during predicted high-risk periods. Consider adjusting meal timing and carbohydrate intake.',
    });
  }

  return insights;
};

/**
 * Delete a glucose reading
 */
export const deleteGlucoseReading = (id: string): boolean => {
  try {
    const readings = getAllGlucoseReadings();
    const filtered = readings.filter(r => r.id !== id);
    
    if (filtered.length === readings.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting glucose reading:', error);
    return false;
  }
};

/**
 * Clear all glucose readings
 */
export const clearAllGlucoseReadings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing glucose readings:', error);
  }
};

export interface HbA1cEstimate {
  value: number;
  readingsCount: number;
  periodDays: number;
  averageGlucose: number;
  previousMonthValue: number | null;
  trend: 'improving' | 'worsening' | 'stable';
  interpretation: string;
}

/**
 * Estimate HbA1c from glucose readings using ADAG formula
 * ADAG Formula: eHbA1c = (averageGlucose_mg_dL + 46.7) / 28.7
 */
export function estimateHbA1c(): HbA1cEstimate {
  const allReadings = getAllGlucoseReadings();
  
  // Filter to last 90 days for current estimate
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  
  const currentPeriodReadings = allReadings.filter(reading => {
    const readingTime = new Date(reading.timestamp).getTime();
    return readingTime >= ninetyDaysAgo.getTime();
  });
  
  // Filter to 90-180 days ago for previous month comparison
  const oneEightyDaysAgo = new Date(now);
  oneEightyDaysAgo.setDate(now.getDate() - 180);
  
  const previousPeriodReadings = allReadings.filter(reading => {
    const readingTime = new Date(reading.timestamp).getTime();
    return readingTime >= oneEightyDaysAgo.getTime() && readingTime < ninetyDaysAgo.getTime();
  });
  
  // Calculate average glucose from all readings (both fasting and post-meal)
  let totalGlucose = 0;
  let glucoseCount = 0;
  
  currentPeriodReadings.forEach(reading => {
    if (reading.fasting !== undefined) {
      totalGlucose += reading.fasting;
      glucoseCount++;
    }
    if (reading.postMeal !== undefined) {
      totalGlucose += reading.postMeal;
      glucoseCount++;
    }
  });
  
  // Calculate previous period average for comparison
  let previousTotalGlucose = 0;
  let previousGlucoseCount = 0;
  
  previousPeriodReadings.forEach(reading => {
    if (reading.fasting !== undefined) {
      previousTotalGlucose += reading.fasting;
      previousGlucoseCount++;
    }
    if (reading.postMeal !== undefined) {
      previousTotalGlucose += reading.postMeal;
      previousGlucoseCount++;
    }
  });
  
  // Not enough data
  if (glucoseCount === 0) {
    return {
      value: 0,
      readingsCount: 0,
      periodDays: 0,
      averageGlucose: 0,
      previousMonthValue: null,
      trend: 'stable',
      interpretation: 'Not enough data yet. Log glucose readings daily for a more accurate estimate.',
    };
  }
  
  const averageGlucose = totalGlucose / glucoseCount;
  
  // ADAG Formula: eHbA1c = (averageGlucose_mg_dL + 46.7) / 28.7
  const estimatedHbA1c = (averageGlucose + 46.7) / 28.7;
  
  // Calculate previous period HbA1c for trend
  let previousMonthValue: number | null = null;
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  
  if (previousGlucoseCount > 0) {
    const previousAverageGlucose = previousTotalGlucose / previousGlucoseCount;
    previousMonthValue = (previousAverageGlucose + 46.7) / 28.7;
    
    const difference = estimatedHbA1c - previousMonthValue;
    if (difference < -0.1) {
      trend = 'improving';
    } else if (difference > 0.1) {
      trend = 'worsening';
    } else {
      trend = 'stable';
    }
  }
  
  // Generate interpretation
  let interpretation = '';
  const value = parseFloat(estimatedHbA1c.toFixed(1));
  
  if (value < 5.7) {
    interpretation = `Your estimated HbA1c is ${value}%. This is in the normal range.`;
  } else if (value < 6.5) {
    interpretation = `Your estimated HbA1c is ${value}%. This indicates prediabetes. Consider lifestyle changes to prevent progression.`;
  } else if (value < 7.0) {
    interpretation = `Your estimated HbA1c is ${value}%. Your diabetes is well-controlled, approaching the target of 7.0%.`;
  } else if (value < 8.0) {
    interpretation = `Your estimated HbA1c is ${value}%. This is slightly above the target of 7.0%. Work with your healthcare provider to improve control.`;
  } else {
    interpretation = `Your estimated HbA1c is ${value}%. This indicates poor diabetes control. Please consult your doctor to adjust your treatment plan.`;
  }
  
  // Add trend information
  if (previousMonthValue !== null) {
    const diff = Math.abs(value - parseFloat(previousMonthValue.toFixed(1)));
    if (trend === 'improving') {
      interpretation += ` Your control has improved by ${diff.toFixed(1)}% compared to last month. Keep it up!`;
    } else if (trend === 'worsening') {
      interpretation += ` Your control has worsened by ${diff.toFixed(1)}% compared to last month. Consider reviewing your management plan.`;
    } else {
      interpretation += ` Your control has remained stable compared to last month.`;
    }
  }
  
  // Calculate actual period days
  const timestamps = currentPeriodReadings.map(r => new Date(r.timestamp).getTime());
  const periodDays = timestamps.length > 0 
    ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  
  return {
    value,
    readingsCount: glucoseCount,
    periodDays,
    averageGlucose: Math.round(averageGlucose),
    previousMonthValue: previousMonthValue ? parseFloat(previousMonthValue.toFixed(1)) : null,
    trend,
    interpretation,
  };
}

