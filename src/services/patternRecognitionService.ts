/**
 * Pattern Recognition and Weekly Analysis Service
 * Detects glucose patterns and generates weekly summaries
 */

import { GlucoseReading, getAllGlucoseReadings } from './glucoseService';

export interface GlucosePattern {
  id: string;
  type: 'post_meal_high' | 'overnight_low' | 'dawn_phenomenon' | 'exercise_drop' | 'stress_spike' | 'consistent_high' | 'consistent_low';
  description: string;
  timeRange: { start: number; end: number }; // hours (0-24)
  frequency: number; // how many times detected in the period
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'improving' | 'worsening' | 'stable';
  recommendation: string;
  affectedDays: string[]; // dates
}

export interface HeatmapData {
  hour: number;
  day: string;
  avgGlucose: number;
  readingCount: number;
  riskLevel: 'low' | 'normal' | 'elevated' | 'high';
}

export interface WeeklySummary {
  period: { start: string; end: string };
  averageGlucose: number;
  timeInRange: number; // percentage 70-180
  timeBelowRange: number; // percentage < 70
  timeAboveRange: number; // percentage > 180
  totalReadings: number;
  patterns: GlucosePattern[];
  insights: string[]; // plain-language insights
  overallTrend: 'improving' | 'worsening' | 'stable';
  riskHeatmap: HeatmapData[][]; // 24 hours x 7 days
}

// Helper to get glucose value from reading (prefers fasting, falls back to postMeal)
const getGlucoseValue = (reading: GlucoseReading): number | null => {
  return reading.fasting ?? reading.postMeal ?? null;
};

// Helper to get hour from timestamp
const getHourFromTimestamp = (timestamp: string): number => {
  return new Date(timestamp).getHours();
};

// Helper to get day name from timestamp
const getDayName = (timestamp: string): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(timestamp).getDay()];
};

// Helper to determine risk level based on glucose value
const getRiskLevel = (glucose: number): 'low' | 'normal' | 'elevated' | 'high' => {
  if (glucose < 70) return 'low';
  if (glucose >= 70 && glucose <= 180) return 'normal';
  if (glucose > 180 && glucose <= 250) return 'elevated';
  return 'high';
};

// Helper to generate unique ID
const generateId = (): string => {
  return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Identify glucose patterns from readings
 */
export const identifyPatterns = (days: number = 7): GlucosePattern[] => {
  const readings = getAllGlucoseReadings();
  
  if (readings.length === 0) {
    return [];
  }

  // Filter readings for the specified period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentReadings = readings.filter(r => 
    new Date(r.timestamp) >= cutoffDate
  );

  if (recentReadings.length === 0) {
    return [];
  }

  const patterns: GlucosePattern[] = [];

  // Group readings by date
  const readingsByDate = new Map<string, GlucoseReading[]>();
  recentReadings.forEach(reading => {
    const date = reading.date;
    if (!readingsByDate.has(date)) {
      readingsByDate.set(date, []);
    }
    readingsByDate.get(date)!.push(reading);
  });

  // Detect overnight lows (12AM - 5AM)
  const overnightReadings = recentReadings.filter(r => {
    const hour = getHourFromTimestamp(r.timestamp);
    return hour >= 0 && hour < 5;
  });
  
  const overnightLows = overnightReadings.filter(r => {
    const val = getGlucoseValue(r);
    return val !== null && val < 80;
  });

  if (overnightLows.length >= 2) {
    const affectedDays = [...new Set(overnightLows.map(r => r.date))];
    patterns.push({
      id: generateId(),
      type: 'overnight_low',
      description: `Detected ${overnightLows.length} low glucose readings between 12AM-5AM`,
      timeRange: { start: 0, end: 5 },
      frequency: overnightLows.length,
      severity: overnightLows.some(r => getGlucoseValue(r)! < 70) ? 'severe' : 'moderate',
      trend: 'stable',
      recommendation: 'You consistently go low between 12-5 AM. Review these nighttime patterns with your diabetes care team and discuss bedtime snack options.',
      affectedDays,
    });
  }

  // Detect dawn phenomenon (4AM - 8AM rise > 30 mg/dL)
  const dawnReadings = recentReadings.filter(r => {
    const hour = getHourFromTimestamp(r.timestamp);
    return hour >= 4 && hour <= 8;
  });

  const dawnDays = new Map<string, { early: number | null; late: number | null }>();
  dawnReadings.forEach(r => {
    const hour = getHourFromTimestamp(r.timestamp);
    const val = getGlucoseValue(r);
    if (val !== null) {
      if (!dawnDays.has(r.date)) {
        dawnDays.set(r.date, { early: null, late: null });
      }
      const dayData = dawnDays.get(r.date)!;
      if (hour >= 4 && hour <= 6) {
        dayData.early = val;
      } else if (hour > 6 && hour <= 8) {
        dayData.late = val;
      }
    }
  });

  let dawnPhenomenonCount = 0;
  const dawnAffectedDays: string[] = [];

  dawnDays.forEach((data, date) => {
    if (data.early !== null && data.late !== null && data.late - data.early > 30) {
      dawnPhenomenonCount++;
      dawnAffectedDays.push(date);
    }
  });

  if (dawnPhenomenonCount >= 3) {
    patterns.push({
      id: generateId(),
      type: 'dawn_phenomenon',
      description: `Dawn phenomenon detected on ${dawnPhenomenonCount} of ${days} mornings`,
      timeRange: { start: 4, end: 8 },
      frequency: dawnPhenomenonCount,
      severity: 'moderate',
      trend: 'stable',
      recommendation: 'Dawn phenomenon detected on multiple mornings. This is a natural hormone effect — discuss these morning fasting patterns with your doctor.',
      affectedDays: dawnAffectedDays,
    });
  }

  // Detect post-meal highs
  const postMealReadings = recentReadings.filter(r =>
    r.postMeal !== undefined && r.postMeal > 180 && r.mealType
  );

  const postMealByType = new Map<string, GlucoseReading[]>();
  postMealReadings.forEach(r => {
    const type = r.mealType || 'unknown';
    if (!postMealByType.has(type)) {
      postMealByType.set(type, []);
    }
    postMealByType.get(type)!.push(r);
  });

  postMealByType.forEach((readings, mealType) => {
    if (readings.length >= 2) {
      const avgPostMeal = readings.reduce((sum, r) => sum + r.postMeal!, 0) / readings.length;
      const affectedDays = [...new Set(readings.map(r => r.date))];

      let timeRange = { start: 12, end: 14 }; // lunch default
      if (mealType === 'breakfast') timeRange = { start: 8, end: 10 };
      if (mealType === 'dinner') timeRange = { start: 19, end: 21 };
      if (mealType === 'snack') timeRange = { start: 15, end: 17 };

      patterns.push({
        id: generateId(),
        type: 'post_meal_high',
        description: `High post-${mealType} readings averaging ${Math.round(avgPostMeal)} mg/dL`,
        timeRange,
        frequency: readings.length,
        severity: avgPostMeal > 250 ? 'severe' : avgPostMeal > 200 ? 'moderate' : 'mild',
        trend: 'stable',
        recommendation: `Your post-${mealType} readings are frequently above target. Review meal composition and discuss target ranges with your healthcare provider.`,
        affectedDays,
      });
    }
  });

  // Detect consistent highs by time window (average > 180 for a time window on 3+ days)
  const timeWindows = [
    { name: 'morning', start: 6, end: 12 },
    { name: 'afternoon', start: 12, end: 18 },
    { name: 'evening', start: 18, end: 23 },
    { name: 'night', start: 23, end: 6 },
  ];

  timeWindows.forEach(window => {
    const windowReadings = recentReadings.filter(r => {
      const hour = getHourFromTimestamp(r.timestamp);
      if (window.start < window.end) {
        return hour >= window.start && hour < window.end;
      } else {
        // Overnight window (e.g., 23-6)
        return hour >= window.start || hour < window.end;
      }
    });

    const windowByDay = new Map<string, number[]>();
    windowReadings.forEach(r => {
      const val = getGlucoseValue(r);
      if (val !== null) {
        if (!windowByDay.has(r.date)) {
          windowByDay.set(r.date, []);
        }
        windowByDay.get(r.date)!.push(val);
      }
    });

    const highDays: string[] = [];
    windowByDay.forEach((values, date) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > 180) {
        highDays.push(date);
      }
    });

    if (highDays.length >= 3) {
      const allValues = windowReadings.map(r => getGlucoseValue(r)).filter((v): v is number => v !== null);
      const avgWindow = allValues.reduce((a, b) => a + b, 0) / allValues.length;

      patterns.push({
        id: generateId(),
        type: 'consistent_high',
        description: `Consistently high glucose during ${window.name} hours`,
        timeRange: { start: window.start, end: window.end },
        frequency: highDays.length,
        severity: avgWindow > 250 ? 'severe' : avgWindow > 200 ? 'moderate' : 'mild',
        trend: 'stable',
        recommendation: `Your glucose is consistently high during ${window.name} hours. Review persistent elevations with your healthcare provider or diabetes educator.`,
        affectedDays: highDays,
      });
    }
  });

  // Detect consistent lows by time window (average < 80 for a time window on 3+ days)
  timeWindows.forEach(window => {
    const windowReadings = recentReadings.filter(r => {
      const hour = getHourFromTimestamp(r.timestamp);
      if (window.start < window.end) {
        return hour >= window.start && hour < window.end;
      } else {
        return hour >= window.start || hour < window.end;
      }
    });

    const windowByDay = new Map<string, number[]>();
    windowReadings.forEach(r => {
      const val = getGlucoseValue(r);
      if (val !== null) {
        if (!windowByDay.has(r.date)) {
          windowByDay.set(r.date, []);
        }
        windowByDay.get(r.date)!.push(val);
      }
    });

    const lowDays: string[] = [];
    windowByDay.forEach((values, date) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg < 80) {
        lowDays.push(date);
      }
    });

    if (lowDays.length >= 3) {
      patterns.push({
        id: generateId(),
        type: 'consistent_low',
        description: `Consistently low glucose during ${window.name} hours`,
        timeRange: { start: window.start, end: window.end },
        frequency: lowDays.length,
        severity: 'moderate',
        trend: 'stable',
        recommendation: `Your glucose is consistently low during ${window.name} hours. Discuss recurrent low patterns during these hours with your healthcare provider or diabetes educator.`,
        affectedDays: lowDays,
      });
    }
  });

  return patterns;
};

/**
 * Generate risk heatmap data (24 hours x 7 days)
 */
export const generateRiskHeatmap = (days: number = 7): HeatmapData[][] => {
  const readings = getAllGlucoseReadings();
  
  if (readings.length === 0) {
    // Return empty heatmap structure
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek.map(day => 
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        day,
        avgGlucose: 0,
        readingCount: 0,
        riskLevel: 'normal' as const,
      }))
    );
  }

  // Filter readings for the specified period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentReadings = readings.filter(r => 
    new Date(r.timestamp) >= cutoffDate
  );

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmap: HeatmapData[][] = [];

  daysOfWeek.forEach(day => {
    const dayData: HeatmapData[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      // Get readings for this day and hour
      const hourReadings = recentReadings.filter(r => {
        const rDay = getDayName(r.timestamp);
        const rHour = getHourFromTimestamp(r.timestamp);
        return rDay === day && rHour === hour;
      });

      if (hourReadings.length === 0) {
        dayData.push({
          hour,
          day,
          avgGlucose: 0,
          readingCount: 0,
          riskLevel: 'normal',
        });
      } else {
        const values = hourReadings.map(r => getGlucoseValue(r)).filter((v): v is number => v !== null);
        const avgGlucose = values.length > 0 
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0;
        
        dayData.push({
          hour,
          day,
          avgGlucose,
          readingCount: hourReadings.length,
          riskLevel: avgGlucose > 0 ? getRiskLevel(avgGlucose) : 'normal',
        });
      }
    }
    
    heatmap.push(dayData);
  });

  return heatmap;
};

/**
 * Generate weekly summary with insights
 */
export const generateWeeklySummary = (days: number = 7): WeeklySummary => {
  const readings = getAllGlucoseReadings();
  
  // Calculate period
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (readings.length === 0) {
    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      averageGlucose: 0,
      timeInRange: 0,
      timeBelowRange: 0,
      timeAboveRange: 0,
      totalReadings: 0,
      patterns: [],
      insights: ['No glucose data available. Start logging readings to see patterns and insights.'],
      overallTrend: 'stable',
      riskHeatmap: generateRiskHeatmap(days),
    };
  }

  // Filter readings for the specified period
  const recentReadings = readings.filter(r => 
    new Date(r.timestamp) >= startDate
  );

  const totalReadings = recentReadings.length;

  if (totalReadings === 0) {
    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      averageGlucose: 0,
      timeInRange: 0,
      timeBelowRange: 0,
      timeAboveRange: 0,
      totalReadings: 0,
      patterns: [],
      insights: [`No readings recorded in the last ${days} days. Start logging to see your patterns.`],
      overallTrend: 'stable',
      riskHeatmap: generateRiskHeatmap(days),
    };
  }

  // Calculate statistics
  const values = recentReadings.map(r => getGlucoseValue(r)).filter((v): v is number => v !== null);
  const averageGlucose = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const belowRange = values.filter(v => v < 70).length;
  const aboveRange = values.filter(v => v > 180).length;

  const timeInRange = totalReadings > 0 ? Math.round((inRange / totalReadings) * 100) : 0;
  const timeBelowRange = totalReadings > 0 ? Math.round((belowRange / totalReadings) * 100) : 0;
  const timeAboveRange = totalReadings > 0 ? Math.round((aboveRange / totalReadings) * 100) : 0;

  // Identify patterns
  const patterns = identifyPatterns(days);

  // Generate insights
  const insights: string[] = [];

  // Time in range insight
  if (timeInRange >= 70) {
    insights.push(`Great job! Your time in range is ${timeInRange}%, which meets the recommended target of 70%.`);
  } else if (timeInRange >= 50) {
    insights.push(`Your time in range is ${timeInRange}%. Aim for 70% to improve your glucose control.`);
  } else {
    insights.push(`Your time in range is ${timeInRange}%, which is below target. Consider reviewing your diabetes management plan with your healthcare provider.`);
  }

  // Pattern-based insights
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'overnight_low':
        insights.push(pattern.recommendation);
        break;
      case 'dawn_phenomenon':
        insights.push(pattern.recommendation);
        break;
      case 'post_meal_high':
        if (pattern.frequency >= 3) {
          insights.push(pattern.recommendation);
        }
        break;
      case 'consistent_high':
        insights.push(`Your glucose runs high during ${pattern.timeRange.start}:00-${pattern.timeRange.end}:00. Discuss these persistent elevations with your healthcare provider.`);
        break;
      case 'consistent_low':
        insights.push(`Watch out for lows during ${pattern.timeRange.start}:00-${pattern.timeRange.end}:00. Keep fast-acting carbs handy.`);
        break;
    }
  });

  // Hypoglycemia insight
  if (timeBelowRange > 4) {
    insights.push(`You've spent ${timeBelowRange}% of time below range. Frequent lows increase your risk of hypoglycemia unawareness. Discuss with your doctor.`);
  }

  // Hyperglycemia insight
  if (timeAboveRange > 25) {
    insights.push(`You've spent ${timeAboveRange}% of time above range. Consistent highs can lead to long-term complications. Consider lifestyle modifications.`);
  }

  // Variability insight
  if (values.length > 1) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const cv = (Math.sqrt(variance) / mean) * 100; // Coefficient of variation
    
    if (cv > 36) {
      insights.push('Your glucose variability is high. Try to maintain more consistent meal timing and carb counting.');
    }
  }

  // Reading frequency insight
  const uniqueDays = new Set(recentReadings.map(r => r.date)).size;
  if (uniqueDays < days * 0.5) {
    insights.push(`You've only logged readings on ${uniqueDays} of the last ${days} days. More frequent monitoring helps identify patterns.`);
  }

  // Determine overall trend by comparing first half to second half
  let overallTrend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (values.length >= 4) {
    const sortedReadings = [...recentReadings].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const midPoint = Math.floor(sortedReadings.length / 2);
    const firstHalf = sortedReadings.slice(0, midPoint);
    const secondHalf = sortedReadings.slice(midPoint);
    
    const firstAvg = firstHalf.map(r => getGlucoseValue(r)).filter((v): v is number => v !== null);
    const secondAvg = secondHalf.map(r => getGlucoseValue(r)).filter((v): v is number => v !== null);
    
    if (firstAvg.length > 0 && secondAvg.length > 0) {
      const firstMean = firstAvg.reduce((a, b) => a + b, 0) / firstAvg.length;
      const secondMean = secondAvg.reduce((a, b) => a + b, 0) / secondAvg.length;
      
      if (secondMean < firstMean - 10) {
        overallTrend = 'improving';
      } else if (secondMean > firstMean + 10) {
        overallTrend = 'worsening';
      }
    }
  }

  // Generate heatmap
  const riskHeatmap = generateRiskHeatmap(days);

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    averageGlucose,
    timeInRange,
    timeBelowRange,
    timeAboveRange,
    totalReadings,
    patterns,
    insights,
    overallTrend,
    riskHeatmap,
  };
};

/**
 * Get pattern icon and color configuration
 */
export const getPatternConfig = (type: GlucosePattern['type']) => {
  switch (type) {
    case 'post_meal_high':
      return {
        icon: 'Utensils',
        color: 'amber',
        label: 'Post-Meal High',
      };
    case 'overnight_low':
      return {
        icon: 'Moon',
        color: 'blue',
        label: 'Overnight Low',
      };
    case 'dawn_phenomenon':
      return {
        icon: 'Sunrise',
        color: 'orange',
        label: 'Dawn Phenomenon',
      };
    case 'exercise_drop':
      return {
        icon: 'Activity',
        color: 'green',
        label: 'Exercise Drop',
      };
    case 'stress_spike':
      return {
        icon: 'Zap',
        color: 'purple',
        label: 'Stress Spike',
      };
    case 'consistent_high':
      return {
        icon: 'TrendingUp',
        color: 'red',
        label: 'Consistent High',
      };
    case 'consistent_low':
      return {
        icon: 'TrendingDown',
        color: 'cyan',
        label: 'Consistent Low',
      };
    default:
      return {
        icon: 'Activity',
        color: 'gray',
        label: 'Pattern',
      };
  }
};

export default {
  identifyPatterns,
  generateWeeklySummary,
  generateRiskHeatmap,
  getPatternConfig,
};
