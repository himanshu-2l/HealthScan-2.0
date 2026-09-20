/**
 * Blood Pressure Data Service
 * Manages BP readings storage and retrieval from localStorage
 */

export interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
  date: string; // YYYY-MM-DD format
  notes?: string;
}

export interface BPStats {
  averageSystolic: number;
  averageDiastolic: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  readingCount: number;
  lastReading?: BPReading;
}

export interface BPAlert {
  type: 'high' | 'low' | 'critical' | 'trend';
  severity: 'warning' | 'danger';
  message: string;
  reading?: BPReading;
}

const STORAGE_KEY = 'healthScan_bp_readings';

/**
 * Save a BP reading
 */
export const saveBPReading = (reading: Omit<BPReading, 'id' | 'date'>): BPReading => {
  try {
    const readings = getAllBPReadings();
    const date = new Date(reading.timestamp).toISOString().split('T')[0];
    
    const newReading: BPReading = {
      ...reading,
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    console.error('Error saving BP reading:', error);
    throw new Error('Failed to save BP reading');
  }
};

/**
 * Get all BP readings
 */
export const getAllBPReadings = (): BPReading[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as BPReading[];
  } catch (error) {
    console.error('Error retrieving BP readings:', error);
    return [];
  }
};

/**
 * Get BP readings filtered by date range
 */
export const getBPReadingsByDateRange = (
  startDate: Date,
  endDate: Date
): BPReading[] => {
  const allReadings = getAllBPReadings();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return allReadings.filter(reading => {
    const readingTime = new Date(reading.timestamp).getTime();
    return readingTime >= start && readingTime <= end;
  });
};

/**
 * Get BP readings for a specific period
 */
export const getBPReadingsForPeriod = (
  period: 'daily' | 'weekly' | 'monthly'
): BPReading[] => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      // Start of today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'weekly':
      // 7 days ago at start of day
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
      break;
    case 'monthly':
      // 1 month ago at start of day
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
      break;
  }
  
  return getBPReadingsByDateRange(startDate, endDate);
};

/**
 * Calculate BP statistics
 */
export const calculateBPStats = (readings: BPReading[]): BPStats => {
  if (readings.length === 0) {
    return {
      averageSystolic: 0,
      averageDiastolic: 0,
      minSystolic: 0,
      maxSystolic: 0,
      minDiastolic: 0,
      maxDiastolic: 0,
      readingCount: 0,
    };
  }
  
  const systolicValues = readings.map(r => r.systolic);
  const diastolicValues = readings.map(r => r.diastolic);
  
  return {
    averageSystolic: Math.round(
      systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length
    ),
    averageDiastolic: Math.round(
      diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length
    ),
    minSystolic: Math.min(...systolicValues),
    maxSystolic: Math.max(...systolicValues),
    minDiastolic: Math.min(...diastolicValues),
    maxDiastolic: Math.max(...diastolicValues),
    readingCount: readings.length,
    lastReading: readings[0],
  };
};

/**
 * Check BP category (normal, elevated, high, etc.)
 */
export const getBPCategory = (
  systolic: number,
  diastolic: number
): {
  category: string;
  severity: 'normal' | 'elevated' | 'high-stage1' | 'high-stage2' | 'crisis';
  color: string;
} => {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      category: 'Hypertensive Crisis',
      severity: 'crisis',
      color: 'red',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'High Blood Pressure (Stage 2)',
      severity: 'high-stage2',
      color: 'red',
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: 'High Blood Pressure (Stage 1)',
      severity: 'high-stage1',
      color: 'orange',
    };
  }
  if (systolic >= 120 || diastolic >= 80) {
    return {
      category: 'Elevated',
      severity: 'elevated',
      color: 'yellow',
    };
  }
  return {
    category: 'Normal',
    severity: 'normal',
    color: 'green',
  };
};

/**
 * Detect abnormal patterns and generate alerts
 */
export const detectBPAlerts = (readings: BPReading[]): BPAlert[] => {
  const alerts: BPAlert[] = [];
  
  if (readings.length === 0) {
    return alerts;
  }
  
  // Check recent readings (last 5)
  const recentReadings = readings.slice(0, 5);
  
  // Check for critical readings
  recentReadings.forEach(reading => {
    const category = getBPCategory(reading.systolic, reading.diastolic);
    if (category.severity === 'crisis') {
      alerts.push({
        type: 'critical',
        severity: 'danger',
        message: `CRITICAL: BP reading of ${reading.systolic}/${reading.diastolic} mmHg requires immediate medical attention!`,
        reading,
      });
    } else if (category.severity === 'high-stage2') {
      alerts.push({
        type: 'high',
        severity: 'danger',
        message: `High BP detected: ${reading.systolic}/${reading.diastolic} mmHg - Stage 2 Hypertension`,
        reading,
      });
    }
  });
  
  // Check for trend patterns
  if (readings.length >= 3) {
    const recent = readings.slice(0, 3);
    const avgSystolic = recent.reduce((sum, r) => sum + r.systolic, 0) / recent.length;
    const avgDiastolic = recent.reduce((sum, r) => sum + r.diastolic, 0) / recent.length;
    
    // Check if consistently high
    if (avgSystolic >= 140 || avgDiastolic >= 90) {
      alerts.push({
        type: 'trend',
        severity: 'warning',
        message: `Consistently elevated BP detected. Average: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`,
      });
    }
    
    // Check for increasing trend
    if (recent.length >= 3) {
      const trend = recent[0].systolic - recent[2].systolic;
      if (trend > 10) {
        alerts.push({
          type: 'trend',
          severity: 'warning',
          message: `Rising BP trend detected. Systolic increased by ${Math.round(trend)} mmHg`,
        });
      }
    }
  }
  
  // Check for low BP
  recentReadings.forEach(reading => {
    if (reading.systolic < 90 || reading.diastolic < 60) {
      alerts.push({
        type: 'low',
        severity: 'warning',
        message: `Low BP detected: ${reading.systolic}/${reading.diastolic} mmHg`,
        reading,
      });
    }
  });
  
  return alerts;
};

/**
 * Delete a BP reading
 */
export const deleteBPReading = (id: string): boolean => {
  try {
    const readings = getAllBPReadings();
    const filtered = readings.filter(r => r.id !== id);
    
    if (filtered.length === readings.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting BP reading:', error);
    return false;
  }
};

/**
 * Clear all BP readings
 */
export const clearAllBPReadings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing BP readings:', error);
  }
};



