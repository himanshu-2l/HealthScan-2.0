/**
 * Period Tracker Service
 * Manages menstrual cycle data storage, predictions, and analytics
 */

export interface PeriodLog {
  id: string;
  startDate: string; // ISO date
  endDate: string;
  flowIntensity: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood: string;
  notes: string;
}

export interface CycleData {
  logs: PeriodLog[];
  averageCycleLength: number;
  averagePeriodLength: number;
}

export interface CyclePrediction {
  nextPeriodStart: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDate: string;
}

export interface CyclePhase {
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  dayOfCycle: number;
  daysRemaining: number;
}

const STORAGE_KEY = 'healthscan_period_data';

/**
 * Get all period data from localStorage
 */
export const getCycleData = (): CycleData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        logs: [],
        averageCycleLength: 28,
        averagePeriodLength: 5,
      };
    }
    return JSON.parse(stored) as CycleData;
  } catch (error) {
    console.error('Error retrieving period data:', error);
    return {
      logs: [],
      averageCycleLength: 28,
      averagePeriodLength: 5,
    };
  }
};

/**
 * Save cycle data to localStorage
 */
const saveCycleData = (data: CycleData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving period data:', error);
  }
};

/**
 * Add a new period log
 */
export const addPeriodLog = (log: Omit<PeriodLog, 'id'>): PeriodLog => {
  const data = getCycleData();
  
  const newLog: PeriodLog = {
    ...log,
    id: `period-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  data.logs.push(newLog);
  
  // Sort by start date (newest first)
  data.logs.sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  
  // Recalculate averages
  const averages = calculateAverages(data.logs);
  data.averageCycleLength = averages.cycleLength;
  data.averagePeriodLength = averages.periodLength;
  
  saveCycleData(data);
  return newLog;
};

/**
 * Update an existing period log
 */
export const updatePeriodLog = (id: string, updates: Partial<Omit<PeriodLog, 'id'>>): PeriodLog | null => {
  const data = getCycleData();
  const index = data.logs.findIndex(log => log.id === id);
  
  if (index === -1) {
    return null;
  }
  
  data.logs[index] = { ...data.logs[index], ...updates };
  
  // Recalculate averages
  const averages = calculateAverages(data.logs);
  data.averageCycleLength = averages.cycleLength;
  data.averagePeriodLength = averages.periodLength;
  
  saveCycleData(data);
  return data.logs[index];
};

/**
 * Delete a period log
 */
export const deletePeriodLog = (id: string): boolean => {
  const data = getCycleData();
  const initialLength = data.logs.length;
  data.logs = data.logs.filter(log => log.id !== id);
  
  if (data.logs.length === initialLength) {
    return false;
  }
  
  // Recalculate averages
  const averages = calculateAverages(data.logs);
  data.averageCycleLength = averages.cycleLength;
  data.averagePeriodLength = averages.periodLength;
  
  saveCycleData(data);
  return true;
};

/**
 * Get a single period log by ID
 */
export const getPeriodLogById = (id: string): PeriodLog | null => {
  const data = getCycleData();
  return data.logs.find(log => log.id === id) || null;
};

/**
 * Calculate average cycle and period lengths from logs
 */
const calculateAverages = (logs: PeriodLog[]): { cycleLength: number; periodLength: number } => {
  if (logs.length === 0) {
    return { cycleLength: 28, periodLength: 5 };
  }
  
  // Calculate average period length
  const periodLengths = logs.map(log => {
    const start = new Date(log.startDate);
    const end = new Date(log.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  });
  
  const avgPeriodLength = Math.round(
    periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
  );
  
  // Calculate average cycle length (need at least 2 logs)
  if (logs.length < 2) {
    return { cycleLength: 28, periodLength: avgPeriodLength };
  }
  
  // Sort logs by start date (oldest first for cycle calculation)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  const cycleLengths: number[] = [];
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevStart = new Date(sortedLogs[i - 1].startDate);
    const currStart = new Date(sortedLogs[i].startDate);
    const cycleLength = Math.round(
      (currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Only include reasonable cycle lengths (21-45 days)
    if (cycleLength >= 21 && cycleLength <= 45) {
      cycleLengths.push(cycleLength);
    }
  }
  
  const avgCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28;
  
  return { cycleLength: avgCycleLength, periodLength: avgPeriodLength };
};

/**
 * Predict next period, fertile window, and ovulation date
 */
export const getPredictions = (): CyclePrediction | null => {
  const data = getCycleData();
  
  if (data.logs.length === 0) {
    return null;
  }
  
  // Get most recent period start
  const lastLog = data.logs[0]; // Already sorted newest first
  const lastPeriodStart = new Date(lastLog.startDate);
  
  // Calculate next period start
  const nextPeriodStart = new Date(lastPeriodStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + data.averageCycleLength);
  
  // Fertile window is typically days 10-16 of the cycle
  // Ovulation is typically day 14
  const fertileWindowStart = new Date(lastPeriodStart);
  fertileWindowStart.setDate(fertileWindowStart.getDate() + 10);
  
  const fertileWindowEnd = new Date(lastPeriodStart);
  fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 16);
  
  const ovulationDate = new Date(lastPeriodStart);
  ovulationDate.setDate(ovulationDate.getDate() + 14);
  
  return {
    nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
    fertileWindowStart: fertileWindowStart.toISOString().split('T')[0],
    fertileWindowEnd: fertileWindowEnd.toISOString().split('T')[0],
    ovulationDate: ovulationDate.toISOString().split('T')[0],
  };
};

/**
 * Get current cycle phase and day
 */
export const getCurrentCyclePhase = (): CyclePhase | null => {
  const data = getCycleData();
  
  if (data.logs.length === 0) {
    return null;
  }
  
  const lastLog = data.logs[0];
  const lastPeriodStart = new Date(lastLog.startDate);
  const lastPeriodEnd = new Date(lastLog.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate day of cycle
  const dayOfCycle = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // If we're past the expected cycle length, use modulo
  const effectiveDayOfCycle = dayOfCycle <= data.averageCycleLength 
    ? dayOfCycle 
    : ((dayOfCycle - 1) % data.averageCycleLength) + 1;
  
  // Determine phase
  let phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  let daysRemaining: number;
  
  if (effectiveDayOfCycle <= data.averagePeriodLength) {
    phase = 'menstrual';
    daysRemaining = data.averagePeriodLength - effectiveDayOfCycle;
  } else if (effectiveDayOfCycle <= 13) {
    phase = 'follicular';
    daysRemaining = 13 - effectiveDayOfCycle;
  } else if (effectiveDayOfCycle <= 16) {
    phase = 'ovulation';
    daysRemaining = 16 - effectiveDayOfCycle;
  } else {
    phase = 'luteal';
    daysRemaining = data.averageCycleLength - effectiveDayOfCycle;
  }
  
  return {
    phase,
    dayOfCycle: effectiveDayOfCycle,
    daysRemaining: Math.max(0, daysRemaining),
  };
};

/**
 * Check if a date is a period day (from logs)
 */
export const isPeriodDay = (date: Date): boolean => {
  const data = getCycleData();
  const dateStr = date.toISOString().split('T')[0];
  
  return data.logs.some(log => {
    const start = new Date(log.startDate);
    const end = new Date(log.endDate);
    const check = new Date(dateStr);
    return check >= start && check <= end;
  });
};

/**
 * Check if a date is in the fertile window (predicted)
 */
export const isFertileDay = (date: Date): boolean => {
  const predictions = getPredictions();
  if (!predictions) return false;
  
  const dateStr = date.toISOString().split('T')[0];
  const checkDate = new Date(dateStr);
  const fertileStart = new Date(predictions.fertileWindowStart);
  const fertileEnd = new Date(predictions.fertileWindowEnd);
  
  return checkDate >= fertileStart && checkDate <= fertileEnd;
};

/**
 * Check if a date is the predicted ovulation day
 */
export const isOvulationDay = (date: Date): boolean => {
  const predictions = getPredictions();
  if (!predictions) return false;
  
  const dateStr = date.toISOString().split('T')[0];
  return dateStr === predictions.ovulationDate;
};

/**
 * Get period log for a specific date (if any)
 */
export const getPeriodLogForDate = (date: Date): PeriodLog | null => {
  const data = getCycleData();
  const dateStr = date.toISOString().split('T')[0];
  
  return data.logs.find(log => {
    const start = new Date(log.startDate);
    const end = new Date(log.endDate);
    const check = new Date(dateStr);
    return check >= start && check <= end;
  }) || null;
};

/**
 * Clear all period data
 */
export const clearAllPeriodData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing period data:', error);
  }
};

/**
 * Available symptoms for logging
 */
export const SYMPTOMS = [
  'Cramps',
  'Headache',
  'Bloating',
  'Fatigue',
  'Mood swings',
  'Back pain',
  'Breast tenderness',
  'Acne',
] as const;

/**
 * Available moods for logging
 */
export const MOODS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'irritable', label: 'Irritable', emoji: '😤' },
] as const;

/**
 * Flow intensity options
 */
export const FLOW_INTENSITIES = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
] as const;
