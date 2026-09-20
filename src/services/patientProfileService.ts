/**
 * Patient Profile Service
 * Manages patient profile data, medications, medical history, etc.
 */

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "Once daily", "Twice daily", "As needed"
  startDate: string;
  endDate?: string; // Optional for ongoing medications
  prescribedBy?: string;
  notes?: string;
  isActive: boolean;
}

export interface Allergy {
  id: string;
  allergen: string; // e.g., "Penicillin", "Peanuts"
  reaction: string; // e.g., "Rash", "Difficulty breathing"
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface MedicalHistory {
  id: string;
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface VitalSign {
  id: string;
  type: 'blood-pressure' | 'heart-rate' | 'temperature' | 'weight' | 'height' | 'blood-sugar';
  value: string;
  unit: string;
  date: string;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: string;
  
  // Medical Information
  medications: Medication[];
  allergies: Allergy[];
  medicalHistory: MedicalHistory[];
  emergencyContacts: EmergencyContact[];
  
  // Insurance
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  
  // Family History
  familyHistory?: string;
  
  // Lifestyle
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'none' | 'occasional' | 'regular';
  exerciseFrequency?: 'none' | 'rare' | 'weekly' | 'daily';
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'patient_profile';

export const getPatientProfile = (): PatientProfile | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading patient profile:', error);
    return null;
  }
};

export const savePatientProfile = (profile: PatientProfile): boolean => {
  try {
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving patient profile:', error);
    return false;
  }
};

export const createPatientProfile = (data: Partial<PatientProfile>): PatientProfile => {
  const now = new Date().toISOString();
  const profile: PatientProfile = {
    id: data.id || `profile_${Date.now()}`,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    dateOfBirth: data.dateOfBirth || '',
    gender: data.gender || 'prefer-not-to-say',
    medications: data.medications || [],
    allergies: data.allergies || [],
    medicalHistory: data.medicalHistory || [],
    emergencyContacts: data.emergencyContacts || [],
    createdAt: data.createdAt || now,
    updatedAt: now,
    ...data,
  };
  savePatientProfile(profile);
  return profile;
};

export const updatePatientProfile = (updates: Partial<PatientProfile>): boolean => {
  const existing = getPatientProfile();
  if (!existing) {
    createPatientProfile(updates);
    return true;
  }
  
  const updated: PatientProfile = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return savePatientProfile(updated);
};

// Medication Management
export const addMedication = (medication: Omit<Medication, 'id'>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const newMedication: Medication = {
    ...medication,
    id: `med_${Date.now()}`,
  };
  
  profile.medications.push(newMedication);
  return savePatientProfile(profile);
};

export const updateMedication = (medicationId: string, updates: Partial<Medication>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const index = profile.medications.findIndex(m => m.id === medicationId);
  if (index === -1) return false;
  
  profile.medications[index] = { ...profile.medications[index], ...updates };
  return savePatientProfile(profile);
};

export const deleteMedication = (medicationId: string): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  profile.medications = profile.medications.filter(m => m.id !== medicationId);
  return savePatientProfile(profile);
};

// Allergy Management
export const addAllergy = (allergy: Omit<Allergy, 'id'>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const newAllergy: Allergy = {
    ...allergy,
    id: `allergy_${Date.now()}`,
  };
  
  profile.allergies.push(newAllergy);
  return savePatientProfile(profile);
};

export const updateAllergy = (allergyId: string, updates: Partial<Allergy>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const index = profile.allergies.findIndex(a => a.id === allergyId);
  if (index === -1) return false;
  
  profile.allergies[index] = { ...profile.allergies[index], ...updates };
  return savePatientProfile(profile);
};

export const deleteAllergy = (allergyId: string): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  profile.allergies = profile.allergies.filter(a => a.id !== allergyId);
  return savePatientProfile(profile);
};

// Emergency Contact Management
export const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const newContact: EmergencyContact = {
    ...contact,
    id: `contact_${Date.now()}`,
  };
  
  // If this is set as primary, unset others
  if (newContact.isPrimary) {
    profile.emergencyContacts.forEach(c => c.isPrimary = false);
  }
  
  profile.emergencyContacts.push(newContact);
  return savePatientProfile(profile);
};

export const updateEmergencyContact = (contactId: string, updates: Partial<EmergencyContact>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const index = profile.emergencyContacts.findIndex(c => c.id === contactId);
  if (index === -1) return false;
  
  // If setting as primary, unset others
  if (updates.isPrimary) {
    profile.emergencyContacts.forEach(c => c.isPrimary = false);
  }
  
  profile.emergencyContacts[index] = { ...profile.emergencyContacts[index], ...updates };
  return savePatientProfile(profile);
};

export const deleteEmergencyContact = (contactId: string): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  profile.emergencyContacts = profile.emergencyContacts.filter(c => c.id !== contactId);
  return savePatientProfile(profile);
};

// Medical History Management
export const addMedicalHistory = (history: Omit<MedicalHistory, 'id'>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const newHistory: MedicalHistory = {
    ...history,
    id: `history_${Date.now()}`,
  };
  
  profile.medicalHistory.push(newHistory);
  return savePatientProfile(profile);
};

export const updateMedicalHistory = (historyId: string, updates: Partial<MedicalHistory>): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  const index = profile.medicalHistory.findIndex(h => h.id === historyId);
  if (index === -1) return false;
  
  profile.medicalHistory[index] = { ...profile.medicalHistory[index], ...updates };
  return savePatientProfile(profile);
};

export const deleteMedicalHistory = (historyId: string): boolean => {
  const profile = getPatientProfile();
  if (!profile) return false;
  
  profile.medicalHistory = profile.medicalHistory.filter(h => h.id !== historyId);
  return savePatientProfile(profile);
};

