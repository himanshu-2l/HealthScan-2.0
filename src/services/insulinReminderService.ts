/**
 * AI Insulin + Medicine Reminder Service
 * Smart reminders with dose guidance based on glucose levels
 */

export interface Medication {
  id: string;
  name: string;
  type: 'insulin' | 'oral' | 'other';
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'before-meals' | 'after-meals' | 'as-needed';
  times: string[]; // HH:mm format
  notes?: string;
}

export interface Reminder {
  id: string;
  medicationId: string;
  scheduledTime: string; // ISO timestamp
  status: 'pending' | 'taken' | 'skipped' | 'delayed';
  actualTime?: string; // When actually taken
  glucoseLevel?: number; // mg/dL at reminder time
  recommendation?: string;
  alertLevel?: 'info' | 'warning' | 'danger';
}

export interface DoseGuidance {
  medicationId: string;
  currentGlucose: number;
  recommendation: 'take-normal' | 'reduce-dose' | 'skip-dose' | 'increase-dose' | 'take-immediately';
  message: string;
  reason: string;
  suggestedDosage?: string;
}

const STORAGE_KEY_MEDICATIONS = 'healthScan_medications';
const STORAGE_KEY_REMINDERS = 'healthScan_medication_reminders';

/**
 * Save medication
 */
export const saveMedication = (medication: Omit<Medication, 'id'>): Medication => {
  try {
    const medications = getAllMedications();
    const newMedication: Medication = {
      ...medication,
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    medications.push(newMedication);
    localStorage.setItem(STORAGE_KEY_MEDICATIONS, JSON.stringify(medications));
    
    // Generate reminders for next 7 days
    generateReminders(newMedication.id);
    
    return newMedication;
  } catch (error) {
    console.error('Error saving medication:', error);
    throw new Error('Failed to save medication');
  }
};

/**
 * Get all medications
 */
export const getAllMedications = (): Medication[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MEDICATIONS);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as Medication[];
  } catch (error) {
    console.error('Error retrieving medications:', error);
    return [];
  }
};

/**
 * Delete medication
 */
export const deleteMedication = (id: string): boolean => {
  try {
    const medications = getAllMedications();
    const filtered = medications.filter(m => m.id !== id);
    
    if (filtered.length === medications.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY_MEDICATIONS, JSON.stringify(filtered));
    
    // Delete associated reminders
    const reminders = getAllReminders();
    const filteredReminders = reminders.filter(r => r.medicationId !== id);
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(filteredReminders));
    
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    return false;
  }
};

/**
 * Generate reminders for a medication
 */
export const generateReminders = (medicationId: string, days: number = 7): void => {
  const medication = getAllMedications().find(m => m.id === medicationId);
  if (!medication) {
    return;
  }
  
  const existingReminders = getAllReminders();
  const newReminders: Reminder[] = [];
  const today = new Date();
  
  for (let day = 0; day < days; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    for (const timeStr of medication.times) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const reminderTime = new Date(currentDate);
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // Skip if reminder already exists
      const reminderExists = existingReminders.some(r => 
        r.medicationId === medicationId &&
        new Date(r.scheduledTime).getTime() === reminderTime.getTime()
      );
      
      if (!reminderExists && reminderTime > new Date()) {
        newReminders.push({
          id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          medicationId,
          scheduledTime: reminderTime.toISOString(),
          status: 'pending',
        });
      }
    }
  }
  
  if (newReminders.length > 0) {
    const allReminders = [...existingReminders, ...newReminders];
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(allReminders));
  }
};

/**
 * Get all reminders
 */
export const getAllReminders = (): Reminder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as Reminder[];
  } catch (error) {
    console.error('Error retrieving reminders:', error);
    return [];
  }
};

/**
 * Get upcoming reminders
 */
export const getUpcomingReminders = (hours: number = 24): Reminder[] => {
  const reminders = getAllReminders();
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  return reminders
    .filter(r => {
      const reminderTime = new Date(r.scheduledTime);
      return reminderTime >= now && reminderTime <= future && r.status === 'pending';
    })
    .sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
};

/**
 * Mark reminder as taken
 */
export const markReminderTaken = (reminderId: string, glucoseLevel?: number): boolean => {
  try {
    const reminders = getAllReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder) {
      return false;
    }
    
    reminder.status = 'taken';
    reminder.actualTime = new Date().toISOString();
    if (glucoseLevel !== undefined) {
      reminder.glucoseLevel = glucoseLevel;
    }
    
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
    return true;
  } catch (error) {
    console.error('Error marking reminder as taken:', error);
    return false;
  }
};

/**
 * Get dose guidance based on current glucose level
 */
export const getDoseGuidance = (
  medicationId: string,
  currentGlucose: number
): DoseGuidance => {
  const medication = getAllMedications().find(m => m.id === medicationId);
  if (!medication) {
    return {
      medicationId,
      currentGlucose,
      recommendation: 'take-normal',
      message: 'No guidance available',
      reason: 'Medication not found',
    };
  }
  
  // For insulin medications
  if (medication.type === 'insulin') {
    if (currentGlucose < 70) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'skip-dose',
        message: '⚠️ DO NOT take insulin now - sugar is LOW!',
        reason: 'Hypoglycemia risk - glucose below 70 mg/dL',
        suggestedDosage: 'Skip this dose and consume fast-acting sugar',
      };
    } else if (currentGlucose < 100) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'reduce-dose',
        message: 'Consider reducing insulin dose - sugar is on lower side',
        reason: 'Glucose between 70-100 mg/dL',
        suggestedDosage: 'Reduce by 10-20%',
      };
    } else if (currentGlucose >= 250) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'take-immediately',
        message: 'High sugar detected — take insulin as prescribed',
        reason: 'Severe hyperglycemia - glucose above 250 mg/dL',
        suggestedDosage: medication.dosage,
      };
    } else if (currentGlucose >= 200) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'increase-dose',
        message: 'Elevated sugar — consider consulting doctor about dose adjustment',
        reason: 'Hyperglycemia - glucose above 200 mg/dL',
        suggestedDosage: 'Consult healthcare provider',
      };
    } else {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'take-normal',
        message: 'Take insulin as prescribed',
        reason: 'Glucose in acceptable range',
        suggestedDosage: medication.dosage,
      };
    }
  }
  
  // For oral medications
  if (medication.type === 'oral') {
    if (currentGlucose < 70) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'skip-dose',
        message: '⚠️ Low sugar detected — consult doctor before taking medication',
        reason: 'Hypoglycemia risk',
        suggestedDosage: 'Consult healthcare provider',
      };
    } else if (currentGlucose >= 250) {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'take-immediately',
        message: 'High sugar detected — take medication and drink water + walk 10 mins',
        reason: 'Severe hyperglycemia',
        suggestedDosage: medication.dosage,
      };
    } else {
      return {
        medicationId,
        currentGlucose,
        recommendation: 'take-normal',
        message: 'Take medication as prescribed',
        reason: 'Glucose in acceptable range',
        suggestedDosage: medication.dosage,
      };
    }
  }
  
  // Default
  return {
    medicationId,
    currentGlucose,
    recommendation: 'take-normal',
    message: 'Take medication as prescribed',
    reason: 'Standard guidance',
    suggestedDosage: medication.dosage,
  };
};

/**
 * Check for reminders and generate alerts
 */
export const checkReminders = (currentGlucose?: number): Reminder[] => {
  const upcoming = getUpcomingReminders(2); // Next 2 hours
  const now = new Date();
  
  return upcoming.map(reminder => {
    const scheduledTime = new Date(reminder.scheduledTime);
    const minutesUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Generate recommendation if glucose level available
    if (currentGlucose !== undefined && reminder.medicationId) {
      const guidance = getDoseGuidance(reminder.medicationId, currentGlucose);
      reminder.recommendation = guidance.message;
      reminder.glucoseLevel = currentGlucose;
      
      if (guidance.recommendation === 'skip-dose' || guidance.recommendation === 'take-immediately') {
        reminder.alertLevel = 'danger';
      } else if (guidance.recommendation === 'reduce-dose' || guidance.recommendation === 'increase-dose') {
        reminder.alertLevel = 'warning';
      } else {
        reminder.alertLevel = 'info';
      }
    }
    
    return reminder;
  });
};

/**
 * Get medication adherence stats
 */
export interface AdherenceStats {
  medicationId: string;
  totalReminders: number;
  taken: number;
  skipped: number;
  delayed: number;
  adherenceRate: number; // percentage
  averageDelayMinutes: number;
}

export const getAdherenceStats = (medicationId: string, days: number = 30): AdherenceStats => {
  const reminders = getAllReminders();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const medicationReminders = reminders.filter(r => 
    r.medicationId === medicationId &&
    new Date(r.scheduledTime) >= cutoffDate
  );
  
  const taken = medicationReminders.filter(r => r.status === 'taken').length;
  const skipped = medicationReminders.filter(r => r.status === 'skipped').length;
  const delayed = medicationReminders.filter(r => {
    if (r.status === 'taken' && r.actualTime) {
      const scheduled = new Date(r.scheduledTime);
      const actual = new Date(r.actualTime);
      return actual.getTime() > scheduled.getTime() + 30 * 60 * 1000; // 30 min delay
    }
    return false;
  }).length;
  
  const adherenceRate = medicationReminders.length > 0
    ? Math.round((taken / medicationReminders.length) * 100)
    : 0;
  
  // Calculate average delay
  const delayedReminders = medicationReminders.filter(r => 
    r.status === 'taken' && r.actualTime
  ).map(r => {
    const scheduled = new Date(r.scheduledTime);
    const actual = new Date(r.actualTime!);
    return (actual.getTime() - scheduled.getTime()) / (1000 * 60); // minutes
  }).filter(delay => delay > 0);
  
  const averageDelayMinutes = delayedReminders.length > 0
    ? Math.round(delayedReminders.reduce((a, b) => a + b, 0) / delayedReminders.length)
    : 0;
  
  return {
    medicationId,
    totalReminders: medicationReminders.length,
    taken,
    skipped,
    delayed,
    adherenceRate,
    averageDelayMinutes,
  };
};

