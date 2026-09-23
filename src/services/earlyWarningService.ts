/**
 * Hypoglycemia / Hyperglycemia Early Warning Alerts Service
 * Integrates heart rate, temperature, and glucose data
 */

export interface SensorData {
  heartRate?: number; // bpm
  temperature?: number; // celsius
  glucose?: number; // mg/dL
  timestamp: string;
}

export interface WarningAlert {
  id: string;
  type: 'hypoglycemia' | 'hyperglycemia' | 'infection-risk' | 'hypoglycemia-risk';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  timestamp: string;
  sensorData: SensorData;
  recommendations: string[];
  requiresImmediateAction: boolean;
}

/**
 * Detect hypoglycemia risk
 * Glucose is evaluated independently of heart rate.
 * - glucose < 54 mg/dL: Critical/severe hypoglycemia
 * - glucose 54-69 mg/dL: Hypoglycemia alert
 * - glucose >= 70 mg/dL: No alert
 * Missing/null heart rate does NOT suppress valid hypoglycemia alerts.
 */
export const detectHypoglycemiaRisk = (sensorData: SensorData): WarningAlert | null => {
  if (sensorData.glucose === undefined || sensorData.glucose === null || isNaN(sensorData.glucose)) {
    return null;
  }

  const glucose = sensorData.glucose;
  const heartRate = sensorData.heartRate;

  // Severe / critical hypoglycemia (< 54 mg/dL)
  if (glucose < 54) {
    const hrContext = heartRate ? ` (Heart rate: ${heartRate} bpm)` : '';
    return {
      id: `alert-${Date.now()}`,
      type: 'hypoglycemia',
      severity: 'critical',
      message: `🚨 CRITICAL: Severe hypoglycemia detected (${glucose} mg/dL)${hrContext} — consume fast-acting carbohydrates immediately and seek assistance if needed!`,
      timestamp: sensorData.timestamp,
      sensorData,
      recommendations: [
        'Consume 15-20g fast-acting carbohydrates (glucose tablets, fruit juice, honey) immediately',
        'Recheck glucose in 15 minutes',
        'If still low, repeat treatment',
        'Contact emergency medical services or your healthcare provider if symptoms worsen',
        'Follow your clinician-prescribed hypoglycemia protocol',
      ],
      requiresImmediateAction: true,
    };
  }

  // Hypoglycemia (54 - 69 mg/dL)
  if (glucose < 70) {
    const hrContext = heartRate ? ` (Heart rate: ${heartRate} bpm)` : '';
    return {
      id: `alert-${Date.now()}`,
      type: 'hypoglycemia',
      severity: 'high',
      message: `⚠️ Hypoglycemia detected (${glucose} mg/dL)${hrContext} — consume fast-acting carbohydrates and recheck.`,
      timestamp: sensorData.timestamp,
      sensorData,
      recommendations: [
        'Consume 15-20g fast-acting carbohydrates (glucose tablets, fruit juice, honey)',
        'Recheck glucose in 15 minutes',
        'Follow your clinician-prescribed diabetes care plan',
        'Contact your diabetes care team if low glucose patterns recur',
      ],
      requiresImmediateAction: true,
    };
  }

  return null;
};

/**
 * Detect hyperglycemia risk
 * High heart rate + high temperature + high glucose = infection risk → sugar rise predicted
 */
export const detectHyperglycemiaRisk = (sensorData: SensorData): WarningAlert | null => {
  if (!sensorData.glucose || !sensorData.heartRate || !sensorData.temperature) {
    return null;
  }
  
  const glucose = sensorData.glucose;
  const heartRate = sensorData.heartRate;
  const temperature = sensorData.temperature;
  
  // Critical hyperglycemia with infection signs
  if (glucose >= 250 && heartRate > 100 && temperature > 37.5) {
    return {
      id: `alert-${Date.now()}`,
      type: 'hyperglycemia',
      severity: 'critical',
      message: '🚨 CRITICAL: Severe hyperglycemia with possible infection — seek immediate medical attention!',
      timestamp: sensorData.timestamp,
      sensorData,
      recommendations: [
        'Seek immediate medical attention',
        'Take prescribed insulin/medication',
        'Drink plenty of water',
        'Monitor glucose every 1-2 hours',
        'Check for ketones if available',
      ],
      requiresImmediateAction: true,
    };
  }
  
  // High glucose with elevated heart rate and temperature
  if (glucose >= 200 && heartRate > 90 && temperature > 37.2) {
    return {
      id: `alert-${Date.now()}`,
      type: 'infection-risk',
      severity: 'high',
      message: '⚠️ High sugar + elevated heart rate + fever detected — infection risk may cause sugar rise',
      timestamp: sensorData.timestamp,
      sensorData,
      recommendations: [
        'Monitor glucose levels more frequently',
        'Stay hydrated',
        'Take prescribed medication as directed',
        'Consider consulting healthcare provider',
        'Rest and avoid strenuous activity',
      ],
      requiresImmediateAction: false,
    };
  }
  
  // High glucose alone
  if (glucose >= 250) {
    return {
      id: `alert-${Date.now()}`,
      type: 'hyperglycemia',
      severity: 'high',
      message: '⚠️ High sugar detected — take action to lower glucose',
      timestamp: sensorData.timestamp,
      sensorData,
      recommendations: [
        'Take prescribed insulin/medication',
        'Drink water and walk 10 minutes if safe',
        'Avoid high-carb foods',
        'Monitor glucose in 1-2 hours',
      ],
      requiresImmediateAction: false,
    };
  }
  
  return null;
};

/**
 * Analyze sensor data and generate alerts
 */
export const analyzeSensorData = (sensorData: SensorData): WarningAlert[] => {
  const alerts: WarningAlert[] = [];
  
  // Check for hypoglycemia
  const hypoAlert = detectHypoglycemiaRisk(sensorData);
  if (hypoAlert) {
    alerts.push(hypoAlert);
  }
  
  // Check for hyperglycemia
  const hyperAlert = detectHyperglycemiaRisk(sensorData);
  if (hyperAlert) {
    alerts.push(hyperAlert);
  }
  
  return alerts;
};

/**
 * Send SMS alert (simulated - would integrate with GSM module)
 */
export const sendSMSAlert = async (
  alert: WarningAlert,
  phoneNumber: string
): Promise<boolean> => {
  try {
    // In production, this would integrate with GSM module or SMS service
    console.log(`SMS Alert to ${phoneNumber}:`, alert.message);
    
    // Simulate API call
    // await fetch('/api/sms/send', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     to: phoneNumber,
    //     message: alert.message,
    //     alert: alert,
    //   }),
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending SMS alert:', error);
    return false;
  }
};

/**
 * Get recent alerts
 */
const STORAGE_KEY_ALERTS = 'healthScan_early_warning_alerts';

export const saveAlert = (alert: WarningAlert): void => {
  try {
    const alerts = getRecentAlerts();
    alerts.unshift(alert);
    
    // Keep only last 100 alerts
    const trimmed = alerts.slice(0, 100);
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving alert:', error);
  }
};

export const getRecentAlerts = (days: number = 7): WarningAlert[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!stored) {
      return [];
    }
    
    const alerts = JSON.parse(stored) as WarningAlert[];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return alerts.filter(alert => 
      new Date(alert.timestamp) >= cutoffDate
    );
  } catch (error) {
    console.error('Error retrieving alerts:', error);
    return [];
  }
};

/**
 * Get critical alerts count
 */
export const getCriticalAlertsCount = (hours: number = 24): number => {
  const alerts = getRecentAlerts(1);
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);
  
  return alerts.filter(alert => 
    alert.severity === 'critical' &&
    new Date(alert.timestamp) >= cutoffTime
  ).length;
};

