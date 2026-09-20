/**
 * EHR Integration Types
 * Supports ABDM (Ayushman Bharat Digital Mission) and FHIR standards
 */

// ABHA ID Types
export interface ABHAProfile {
  abhaId: string; // 14-digit ABHA ID (e.g., 12-3456-7890-1234)
  abhaAddress: string; // username@abdm
  name: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth: string;
  mobile: string;
  email?: string;
  address?: {
    line: string;
    district: string;
    state: string;
    pincode: string;
  };
}

export interface ABHAAuthRequest {
  abhaId: string;
  authMode: 'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD';
}

export interface ABHAAuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  profile: ABHAProfile;
}

// Medical History Types
export interface MedicalCondition {
  code: string; // ICD-10 code
  name: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'chronic';
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  purpose?: string;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  verifiedDate: string;
}

export interface VitalSigns {
  recordedDate: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface PatientMedicalHistory {
  abhaId: string;
  profile: ABHAProfile;
  conditions: MedicalCondition[];
  medications: Medication[];
  allergies: Allergy[];
  vitals: VitalSigns[];
  lastUpdated: string;
}

// Test Results Types (FHIR-compliant)
export interface FHIRObservation {
  id: string;
  code: {
    system: string;
    code: string;
    display: string;
  };
  value: number | string;
  unit?: string;
  interpretation?: 'normal' | 'abnormal' | 'critical';
  referenceRange?: {
    low: number;
    high: number;
  };
}

export interface HealthScanTestResult {
  testId: string;
  patientAbhaId: string;
  testDate: string;
  testType: 'comprehensive' | 'alzheimers' | 'parkinsons' | 'epilepsy';
  status: 'preliminary' | 'final' | 'amended';

  // Alzheimer's Assessment
  alzheimersAssessment?: {
    digitSpanScore: number;
    wordRecallImmediate: number;
    wordRecallDelayed: number;
    recognitionScore: number;
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    interpretation: string;
  };

  // Parkinson's Assessment
  parkinsonsAssessment?: {
    tremorFrequency: number;
    tremorAmplitude: number;
    gaitSpeed: number;
    fingerTappingRate: number;
    coordinationScore: number;
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    interpretation: string;
  };

  // Epilepsy Assessment
  epilepsyAssessment?: {
    seizureDetected: boolean;
    ecgBaseline: string;
    emgBaseline: string;
    abnormalPatterns: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    interpretation: string;
  };

  // Eye & Cognitive Tests
  cognitiveAssessment?: {
    saccadeReactionTime: number;
    stroopAccuracy: number;
    attentionScore: number;
    processingSpeed: number;
    interpretation: string;
  };

  // Voice Analysis
  voiceAssessment?: {
    pitch: number;
    jitter: number;
    loudness: number;
    qualityScore: number;
    interpretation: string;
  };

  // Clinical Recommendations
  recommendations: string[];
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  referralNeeded: boolean;

  // Attachments
  attachments: {
    pdfReport?: string; // URL
    rawData?: string; // URL
    ecgRecording?: string; // URL
    videoRecording?: string; // URL
  };

  // Clinician Info
  reviewedBy?: {
    name: string;
    qualification: string;
    registrationNumber: string;
    reviewDate: string;
  };
}

// FHIR DiagnosticReport
export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final';
  category: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string; // Patient/abha-id
    display: string;
  };
  effectiveDateTime: string;
  issued: string;
  performer?: Array<{
    reference: string;
    display: string;
  }>;
  result: Array<{
    reference: string; // Observation/id
    display: string;
  }>;
  conclusion: string;
  conclusionCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  presentedForm?: Array<{
    contentType: string;
    url: string;
    title: string;
  }>;
}

// Doctor Dashboard Types
export interface DoctorProfile {
  id: string;
  name: string;
  qualification: string;
  specialization: string[];
  registrationNumber: string; // Medical Council Registration
  hospital: string;
  department: string;
  email: string;
  phone: string;
}

export interface PatientSummary {
  abhaId: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  lastTestDate: string;
  highestRiskCondition: {
    condition: 'alzheimers' | 'parkinsons' | 'epilepsy';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    score: number;
  };
  totalTests: number;
  needsFollowUp: boolean;
}

export interface DoctorDashboardData {
  doctor: DoctorProfile;
  patients: PatientSummary[];
  highRiskAlerts: Array<{
    patient: PatientSummary;
    testResult: HealthScanTestResult;
    alertDate: string;
  }>;
  recentScreenings: {
    last7Days: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

// Longitudinal Tracking Types
export interface TrendDataPoint {
  date: string;
  score: number;
  testType: string;
}

export interface LongitudinalData {
  patientAbhaId: string;
  condition: 'alzheimers' | 'parkinsons' | 'epilepsy' | 'cognitive';
  metric: string; // e.g., "Memory Score", "Tremor Frequency"
  dataPoints: TrendDataPoint[];
  trend: 'improving' | 'stable' | 'declining' | 'fluctuating';
  trendSlope?: number; // Points per month
  alerts: Array<{
    date: string;
    type: 'significant_decline' | 'rapid_change' | 'threshold_crossed';
    message: string;
  }>;
}

// Referral System Types
export interface NeurologistProfile {
  id: string;
  name: string;
  qualification: string;
  specialization: string[];
  hospital: string;
  address: string;
  distance: number; // km from patient
  rating: number;
  availableSlots: Array<{
    date: string;
    time: string;
  }>;
  consultationFee: number;
  acceptsABDM: boolean;
}

export interface ReferralRequest {
  referralId: string;
  patientAbhaId: string;
  patientName: string;
  testResultId: string;
  condition: 'alzheimers' | 'parkinsons' | 'epilepsy';
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  referredTo: {
    doctorId: string;
    doctorName: string;
    hospital: string;
  };
  referralDate: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
}

export interface ReferralResponse {
  referralId: string;
  status: 'accepted' | 'declined';
  appointmentDate?: string;
  appointmentTime?: string;
  doctorNotes?: string;
  estimatedWaitTime?: string;
}

// EHR Integration Settings
export interface EHRSettings {
  enabled: boolean;
  provider: 'ABDM' | 'Custom' | 'None';
  abhaId?: string;
  autoUpload: boolean; // Auto-upload test results
  shareWithDoctors: boolean;
  longitudinalTracking: boolean;
  autoReferral: boolean;
  consentGiven: boolean;
  consentDate?: string;
  linkedDoctors: Array<{
    doctorId: string;
    doctorName: string;
    hospital: string;
    accessLevel: 'full' | 'limited' | 'view_only';
  }>;
}

// API Response Types
export interface EHRAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Consent Management
export interface HealthDataConsent {
  consentId: string;
  patientAbhaId: string;
  purpose: string;
  dataTypes: string[]; // e.g., ["DiagnosticReport", "Observation"]
  grantedTo: {
    type: 'doctor' | 'hospital' | 'research';
    id: string;
    name: string;
  };
  grantedDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'revoked';
  scope: {
    fromDate: string;
    toDate: string;
  };
}

