/**
 * Unified Health Data Storage Service
 * Centralized service for storing and retrieving all health test results
 * Uses localStorage for persistence
 */

import { HealthTestResult, HealthHistoryEntry, TestCategory, TestType } from '../types/health';

const STORAGE_KEYS = {
  HEALTH_RESULTS: 'healthScan_results',
  HEALTH_HISTORY: 'healthScan_history',
  LEGACY_DIGIT_SPAN: 'digitSpanHistory',
  LEGACY_WORD_LIST: 'wordListHistory',
};

/**
 * Save a test result to storage
 */
export const saveTestResult = (result: HealthTestResult): void => {
  try {
    const existingResults = getAllResults();
    
    // Check if result with same ID exists, update it
    const existingIndex = existingResults.findIndex(r => r.id === result.id);
    
    if (existingIndex >= 0) {
      existingResults[existingIndex] = result;
    } else {
      existingResults.push(result);
    }
    
    // Sort by date (newest first)
    existingResults.sort((a, b) => 
      new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
    );
    
    localStorage.setItem(STORAGE_KEYS.HEALTH_RESULTS, JSON.stringify(existingResults));
    
    // Also update history
    updateHealthHistory(result);
  } catch (error) {
    console.error('Error saving test result:', error);
    throw new Error('Failed to save test result');
  }
};

/**
 * Get all test results
 */
export const getAllResults = (): HealthTestResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HEALTH_RESULTS);
    if (!stored) {
      // Migrate legacy data if exists
      migrateLegacyData();
      return [];
    }
    
    const results = JSON.parse(stored) as HealthTestResult[];
    return results;
  } catch (error) {
    console.error('Error retrieving test results:', error);
    return [];
  }
};

/**
 * Get results filtered by test type
 */
export const getResultsByType = (testType: TestType): HealthTestResult[] => {
  const allResults = getAllResults();
  return allResults.filter(result => result.testType === testType);
};

/**
 * Get results filtered by category
 */
export const getResultsByCategory = (category: TestCategory): HealthTestResult[] => {
  const allResults = getAllResults();
  return allResults.filter(result => result.category === category);
};

/**
 * Get health history (grouped by date)
 */
export const getHealthHistory = (limit?: number): HealthHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HEALTH_HISTORY);
    if (!stored) {
      return [];
    }
    
    let history = JSON.parse(stored) as HealthHistoryEntry[];
    
    // Sort by date (newest first)
    history.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  } catch (error) {
    console.error('Error retrieving health history:', error);
    return [];
  }
};

/**
 * Get recent test results
 */
export const getRecentResults = (limit: number = 10): HealthTestResult[] => {
  const allResults = getAllResults();
  return allResults.slice(0, limit);
};

/**
 * Delete a test result
 */
export const deleteTestResult = (resultId: string): boolean => {
  try {
    const allResults = getAllResults();
    const filtered = allResults.filter(r => r.id !== resultId);
    
    if (filtered.length === allResults.length) {
      return false; // Result not found
    }
    
    localStorage.setItem(STORAGE_KEYS.HEALTH_RESULTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting test result:', error);
    return false;
  }
};

/**
 * Clear all test results
 */
export const clearAllResults = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HEALTH_RESULTS);
    localStorage.removeItem(STORAGE_KEYS.HEALTH_HISTORY);
  } catch (error) {
    console.error('Error clearing results:', error);
  }
};

/**
 * Update health history with a new test result
 */
const updateHealthHistory = (result: HealthTestResult): void => {
  try {
    const history = getHealthHistory();
    const resultDate = new Date(result.testDate).toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find or create entry for this date
    let entry = history.find(h => h.date === resultDate);
    
    if (!entry) {
      entry = {
        date: resultDate,
        tests: [],
        overallScore: 0,
      };
      history.push(entry);
    }
    
    // Add or update test in entry
    const existingTestIndex = entry.tests.findIndex(t => t.id === result.id);
    if (existingTestIndex >= 0) {
      entry.tests[existingTestIndex] = result;
    } else {
      entry.tests.push(result);
    }
    
    // Sort tests by timestamp within entry
    entry.tests.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Save updated history
    localStorage.setItem(STORAGE_KEYS.HEALTH_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error updating health history:', error);
  }
};

/**
 * Migrate legacy data from old localStorage keys
 */
const migrateLegacyData = (): void => {
  try {
    const migrated: HealthTestResult[] = [];
    
    // Migrate digit span results
    const digitSpanData = localStorage.getItem(STORAGE_KEYS.LEGACY_DIGIT_SPAN);
    if (digitSpanData) {
      try {
        const digitSpanResults = JSON.parse(digitSpanData);
        if (Array.isArray(digitSpanResults)) {
          digitSpanResults.forEach((result: any, index: number) => {
            const healthResult: HealthTestResult = {
              id: `digit-span-${result.timestamp || Date.now()}-${index}`,
              testType: 'digit-span',
              category: 'neurological',
              testDate: result.timestamp || new Date().toISOString(),
              timestamp: result.timestamp || new Date().toISOString(),
              data: result,
              score: result.forwardSpan || 0,
              maxScore: 9,
              scorePercentage: result.forwardSpan ? (result.forwardSpan / 9) * 100 : 0,
              riskLevel: mapRiskLevel(result.interpretation?.overallRisk),
              interpretation: `Forward Span: ${result.forwardSpan}, Backward Span: ${result.backwardSpan}`,
              recommendations: [],
              duration: result.totalDuration,
              status: 'final',
            };
            migrated.push(healthResult);
          });
        }
      } catch (e) {
        console.warn('Error migrating digit span data:', e);
      }
    }
    
    // Migrate word list recall results
    const wordListData = localStorage.getItem(STORAGE_KEYS.LEGACY_WORD_LIST);
    if (wordListData) {
      try {
        const wordListResults = JSON.parse(wordListData);
        if (Array.isArray(wordListResults)) {
          wordListResults.forEach((result: any, index: number) => {
            const healthResult: HealthTestResult = {
              id: `word-list-${result.timestamp || Date.now()}-${index}`,
              testType: 'word-list-recall',
              category: 'neurological',
              testDate: result.timestamp || new Date().toISOString(),
              timestamp: result.timestamp || new Date().toISOString(),
              data: result,
              score: result.delayedRecall?.score || 0,
              maxScore: 10,
              scorePercentage: result.delayedRecall?.score ? (result.delayedRecall.score / 10) * 100 : 0,
              riskLevel: mapRiskLevel(result.interpretation?.overallRisk),
              interpretation: result.interpretation?.delayedRecallLevel || 'Unknown',
              recommendations: result.interpretation?.recommendations || [],
              duration: result.totalDuration,
              status: 'final',
            };
            migrated.push(healthResult);
          });
        }
      } catch (e) {
        console.warn('Error migrating word list data:', e);
      }
    }
    
    // Save migrated data
    if (migrated.length > 0) {
      localStorage.setItem(STORAGE_KEYS.HEALTH_RESULTS, JSON.stringify(migrated));
      console.log(`Migrated ${migrated.length} legacy test results`);
    }
  } catch (error) {
    console.error('Error during legacy data migration:', error);
  }
};

/**
 * Map old risk level format to new format
 */
const mapRiskLevel = (oldRisk?: string): 'low' | 'medium' | 'high' | 'critical' => {
  if (!oldRisk) return 'low';
  
  const lower = oldRisk.toLowerCase();
  if (lower === 'low') return 'low';
  if (lower === 'medium') return 'medium';
  if (lower === 'high') return 'high';
  if (lower === 'critical') return 'critical';
  
  return 'low';
};

/**
 * Generate a unique ID for a test result
 */
export const generateTestResultId = (testType: TestType): string => {
  return `${testType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

