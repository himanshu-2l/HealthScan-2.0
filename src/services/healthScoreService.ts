/**
 * Health Score Calculation Engine
 * Calculates overall health score based on weighted test categories
 */

import { 
  HealthScore, 
  CategoryScore, 
  TestCategory, 
  TrendDirection,
  RiskLevel 
} from '../types/health';
import { 
  getAllResults, 
  getResultsByCategory,
  getHealthHistory 
} from './healthDataService';
import {
  getAllBPReadings,
  calculateBPStats,
  getBPCategory
} from './bpService';

// Category weights for overall health score calculation
const CATEGORY_WEIGHTS: Record<TestCategory, number> = {
  neurological: 0.30,
  cardiovascular: 0.25,
  respiratory: 0.15,
  'mental-health': 0.15,
  'vision-hearing': 0.10,
  lifestyle: 0.05,
};

/**
 * Calculate overall health score
 */
export const calculateHealthScore = (): HealthScore => {
  const allResults = getAllResults();
  
  // Calculate category scores
  const categoryScores = calculateCategoryScores(allResults);
  
  // Calculate weighted overall score
  let overallScore = 0;
  Object.values(categoryScores).forEach(categoryScore => {
    overallScore += categoryScore.score * categoryScore.weight;
  });
  
  // Round to nearest integer
  overallScore = Math.round(overallScore);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(overallScore, categoryScores);
  
  // Determine trend
  const trend = calculateTrend();
  
  // Generate recommendations
  const recommendations = generateRecommendations(overallScore, categoryScores);
  
  return {
    overall: overallScore,
    breakdown: {
      neurological: categoryScores.neurological.score,
      cardiovascular: categoryScores.cardiovascular.score,
      respiratory: categoryScores.respiratory.score,
      mentalHealth: categoryScores['mental-health'].score,
      visionHearing: categoryScores['vision-hearing'].score,
      lifestyle: categoryScores.lifestyle.score,
    },
    riskLevel,
    trend,
    lastUpdated: new Date().toISOString(),
    recommendations,
  };
};

/**
 * Calculate scores for each category
 */
const calculateCategoryScores = (allResults: any[]): Record<TestCategory, CategoryScore> => {
  const categories: TestCategory[] = [
    'neurological',
    'cardiovascular',
    'respiratory',
    'mental-health',
    'vision-hearing',
    'lifestyle',
  ];
  
  const categoryScores: Partial<Record<TestCategory, CategoryScore>> = {};
  
  categories.forEach(category => {
    const categoryResults = getResultsByCategory(category);
    
    // Special handling for lifestyle category - include BP data
    if (category === 'lifestyle') {
      const lifestyleScore = calculateLifestyleScore(categoryResults);
      categoryScores[category] = lifestyleScore;
    } else if (categoryResults.length === 0) {
      // No tests in this category - default to neutral score
      categoryScores[category] = {
        category,
        score: 75, // Neutral score when no data
        weight: CATEGORY_WEIGHTS[category],
        testCount: 0,
        trend: 'stable',
      };
    } else {
      // Calculate average score for this category
      const scores = categoryResults
        .map(result => result.scorePercentage || 0)
        .filter(score => score > 0);
      
      const avgScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 75;
      
      // Get most recent test date
      const sortedResults = [...categoryResults].sort(
        (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
      );
      
      categoryScores[category] = {
        category,
        score: Math.round(avgScore),
        weight: CATEGORY_WEIGHTS[category],
        testCount: categoryResults.length,
        lastTestDate: sortedResults[0]?.testDate,
        trend: calculateCategoryTrend(category, categoryResults),
      };
    }
  });
  
  return categoryScores as Record<TestCategory, CategoryScore>;
};

/**
 * Calculate trend for a specific category
 */
const calculateCategoryTrend = (
  category: TestCategory,
  results: any[]
): TrendDirection => {
  if (results.length < 2) {
    return 'stable';
  }
  
  // Sort by date (oldest first)
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );
  
  // Get scores from recent tests (last 3-5 tests)
  const recentResults = sortedResults.slice(-5);
  const scores = recentResults
    .map(r => r.scorePercentage || 0)
    .filter(s => s > 0);
  
  if (scores.length < 2) {
    return 'stable';
  }
  
  // Calculate trend slope
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (Math.abs(difference) < 2) {
    return 'stable';
  } else if (difference > 5) {
    return 'improving';
  } else if (difference < -5) {
    return 'declining';
  } else {
    return 'fluctuating';
  }
};

/**
 * Calculate overall trend
 */
const calculateTrend = (): TrendDirection => {
  const history = getHealthHistory(10); // Last 10 entries
  
  if (history.length < 2) {
    return 'stable';
  }
  
  const scores = history.map(h => h.overallScore);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (Math.abs(difference) < 2) {
    return 'stable';
  } else if (difference > 3) {
    return 'improving';
  } else if (difference < -3) {
    return 'declining';
  } else {
    return 'fluctuating';
  }
};

/**
 * Determine overall risk level
 */
const determineRiskLevel = (
  overallScore: number,
  categoryScores: Record<TestCategory, CategoryScore>
): RiskLevel => {
  // Check for critical risk categories
  const criticalCategories = Object.values(categoryScores).filter(
    cs => cs.score < 40
  );
  
  if (criticalCategories.length > 0) {
    return 'critical';
  }
  
  // Check for high risk categories
  const highRiskCategories = Object.values(categoryScores).filter(
    cs => cs.score < 50
  );
  
  if (highRiskCategories.length > 0 || overallScore < 50) {
    return 'high';
  }
  
  // Check for medium risk
  const mediumRiskCategories = Object.values(categoryScores).filter(
    cs => cs.score < 65
  );
  
  if (mediumRiskCategories.length > 0 || overallScore < 65) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Generate recommendations based on health score
 */
const generateRecommendations = (
  overallScore: number,
  categoryScores: Record<TestCategory, CategoryScore>
): string[] => {
  const recommendations: string[] = [];
  
  // Overall score recommendations
  if (overallScore < 50) {
    recommendations.push('Your overall health score is low. Consider consulting with a healthcare provider.');
  } else if (overallScore < 65) {
    recommendations.push('Your overall health score indicates some areas for improvement.');
  } else if (overallScore >= 80) {
    recommendations.push('Great job maintaining your health! Keep up the good work.');
  }
  
  // Category-specific recommendations
  Object.values(categoryScores).forEach(categoryScore => {
    if (categoryScore.score < 50 && categoryScore.testCount > 0) {
      const categoryName = categoryScore.category.replace('-', ' ');
      recommendations.push(
        `Consider focusing on ${categoryName} health - recent tests show room for improvement.`
      );
    }
  });
  
  // Trend-based recommendations
  const decliningCategories = Object.values(categoryScores).filter(
    cs => cs.trend === 'declining'
  );
  
  if (decliningCategories.length > 0) {
    recommendations.push(
      'Some health metrics are declining. Consider lifestyle changes or consult a healthcare provider.'
    );
  }
  
  // If no specific recommendations, add general ones
  if (recommendations.length === 0) {
    recommendations.push('Continue regular health monitoring and maintain healthy lifestyle habits.');
  }
  
  return recommendations;
};

/**
 * Calculate lifestyle score based on BP data and lifestyle test results
 */
const calculateLifestyleScore = (lifestyleResults: any[]): CategoryScore => {
  const bpReadings = getAllBPReadings();
  
  // Calculate BP-based lifestyle score
  let bpScore = 75; // Default neutral score
  let bpTrend: TrendDirection = 'stable';
  let lastBPDate: string | undefined;
  
  if (bpReadings.length > 0) {
    // Get recent BP readings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReadings = bpReadings.filter(
      r => new Date(r.timestamp).getTime() >= thirtyDaysAgo.getTime()
    );
    
    if (recentReadings.length > 0) {
      const bpStats = calculateBPStats(recentReadings);
      const avgCategory = getBPCategory(bpStats.averageSystolic, bpStats.averageDiastolic);
      
      // Convert BP category to lifestyle score (0-100)
      switch (avgCategory.severity) {
        case 'normal':
          bpScore = 90; // Excellent lifestyle indicator
          break;
        case 'elevated':
          bpScore = 75; // Good but could improve
          break;
        case 'high-stage1':
          bpScore = 60; // Needs attention
          break;
        case 'high-stage2':
          bpScore = 45; // Poor lifestyle indicators
          break;
        case 'crisis':
          bpScore = 25; // Critical lifestyle issues
          break;
      }
      
      // Calculate BP trend
      if (recentReadings.length >= 3) {
        const firstHalf = recentReadings.slice(Math.floor(recentReadings.length / 2));
        const secondHalf = recentReadings.slice(0, Math.floor(recentReadings.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, r) => sum + r.systolic, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.systolic, 0) / secondHalf.length;
        
        const diff = secondAvg - firstAvg;
        if (Math.abs(diff) < 2) {
          bpTrend = 'stable';
        } else if (diff < -5) {
          bpTrend = 'improving'; // BP decreasing is good
        } else if (diff > 5) {
          bpTrend = 'declining'; // BP increasing is bad
        } else {
          bpTrend = 'fluctuating';
        }
      }
      
      lastBPDate = recentReadings[0]?.timestamp;
    } else {
      // Use overall BP stats if no recent readings
      const bpStats = calculateBPStats(bpReadings.slice(0, 10)); // Last 10 readings
      const avgCategory = getBPCategory(bpStats.averageSystolic, bpStats.averageDiastolic);
      
      switch (avgCategory.severity) {
        case 'normal':
          bpScore = 85;
          break;
        case 'elevated':
          bpScore = 70;
          break;
        case 'high-stage1':
          bpScore = 55;
          break;
        case 'high-stage2':
          bpScore = 40;
          break;
        case 'crisis':
          bpScore = 20;
          break;
      }
      
      lastBPDate = bpReadings[0]?.timestamp;
    }
  }
  
  // Calculate lifestyle test results score
  let testScore = 75;
  if (lifestyleResults.length > 0) {
    const scores = lifestyleResults
      .map(result => result.scorePercentage || 0)
      .filter(score => score > 0);
    
    testScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 75;
  }
  
  // Combine BP score (70% weight) with lifestyle test score (30% weight)
  // BP is a strong lifestyle indicator
  const combinedScore = Math.round((bpScore * 0.7) + (testScore * 0.3));
  
  return {
    category: 'lifestyle',
    score: combinedScore,
    weight: CATEGORY_WEIGHTS.lifestyle,
    testCount: lifestyleResults.length + (bpReadings.length > 0 ? 1 : 0), // Count BP as a test
    lastTestDate: lastBPDate || lifestyleResults[0]?.testDate,
    trend: bpTrend !== 'stable' ? bpTrend : calculateCategoryTrend('lifestyle', lifestyleResults),
  };
};

/**
 * Get category score breakdown
 */
export const getCategoryScores = (): Record<TestCategory, CategoryScore> => {
  const allResults = getAllResults();
  return calculateCategoryScores(allResults);
};

