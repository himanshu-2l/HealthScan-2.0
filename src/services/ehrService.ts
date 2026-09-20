/**
 * EHR Service - ABDM (Ayushman Bharat Digital Mission) Integration
 * Handles authentication, data fetching, and uploading to national health records
 */

import type {
  ABHAProfile,
  ABHAAuthRequest,
  ABHAAuthResponse,
  PatientMedicalHistory,
  HealthScanTestResult,
  FHIRDiagnosticReport,
  FHIRObservation,
  EHRAPIResponse,
  HealthDataConsent,
} from '@/types/ehr';

// ABDM API Configuration
const ABDM_CONFIG = {
  baseURL: import.meta.env.VITE_ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway',
  clientId: import.meta.env.VITE_ABDM_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_ABDM_CLIENT_SECRET || '',
  sandboxMode: import.meta.env.VITE_ABDM_SANDBOX === 'true',
};

class EHRService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Check if we're in sandbox mode
   */
  private isSandboxMode(): boolean {
    return ABDM_CONFIG.sandboxMode || !ABDM_CONFIG.clientId;
  }

  /**
   * Generate sample data for sandbox mode
   */
  private generateSampleData(): any {
    return {
      abhaProfile: {
        abhaId: '12-3456-7890-3608',
        abhaAddress: 'demopatient@abdm',
        name: 'Demo Patient',
        gender: 'F' as const,
        dateOfBirth: '2005-05-15',
        mobile: '+91-1234567890',
        email: 'demopatient@gmail.com',
        address: {
          line: 'Shri Shankaracharya Technical Campus',
          district: 'Bhilai',
          state: 'Chhattisgarh',
          pincode: '493221',
        },
      },
      medicalHistory: {
        conditions: [
          {
            code: 'I10',
            name: 'Essential Hypertension',
            diagnosedDate: '2020-03-15',
            status: 'chronic' as const,
            severity: 'moderate' as const,
          },
          {
            code: 'E11',
            name: 'Type 2 Diabetes Mellitus',
            diagnosedDate: '2019-08-22',
            status: 'chronic' as const,
            severity: 'moderate' as const,
          },
        ],
        medications: [
          {
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            startDate: '2019-08-22',
            prescribedBy: 'Dr. Sharma',
            purpose: 'Blood sugar control',
          },
          {
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'Once daily',
            startDate: '2020-03-15',
            prescribedBy: 'Dr. Patel',
            purpose: 'Blood pressure control',
          },
        ],
        allergies: [
          {
            allergen: 'Penicillin',
            reaction: 'Skin rash',
            severity: 'moderate' as const,
            verifiedDate: '2015-06-10',
          },
        ],
        vitals: [
          {
            recordedDate: '2025-01-10',
            bloodPressure: { systolic: 138, diastolic: 88 },
            heartRate: 76,
            temperature: 98.4,
            oxygenSaturation: 97,
            weight: 72,
            height: 170,
          },
        ],
      },
    };
  }

  /**
   * Authenticate with ABDM using ABHA ID
   */
  async authenticateABHA(request: ABHAAuthRequest): Promise<EHRAPIResponse<ABHAAuthResponse>> {
    try {
      // Sandbox mode - return sample data
      if (this.isSandboxMode()) {
        console.log('🏥 EHR: Running in sandbox mode');
        const sampleData = this.generateSampleData();

        return {
          success: true,
          data: {
            accessToken: 'sandbox_token_' + Date.now(),
            expiresIn: 3600,
            refreshToken: 'sandbox_refresh_token',
            profile: sampleData.abhaProfile,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Production mode - call actual ABDM API
      const response = await fetch(`${ABDM_CONFIG.baseURL}/v0.5/users/auth/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CM-ID': ABDM_CONFIG.clientId,
        },
        body: JSON.stringify({
          id: request.abhaId,
          authMode: request.authMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`ABDM API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.tokenExpiry = Date.now() + data.expiresIn * 1000;

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('ABHA authentication error:', error);
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch patient's medical history from ABDM
   */
  async fetchMedicalHistory(abhaId: string): Promise<EHRAPIResponse<PatientMedicalHistory>> {
    try {
      // Sandbox mode - return sample data
      if (this.isSandboxMode()) {
        const sampleData = this.generateSampleData();

        return {
          success: true,
          data: {
            abhaId,
            profile: sampleData.abhaProfile,
            conditions: sampleData.medicalHistory.conditions,
            medications: sampleData.medicalHistory.medications,
            allergies: sampleData.medicalHistory.allergies,
            vitals: sampleData.medicalHistory.vitals,
            lastUpdated: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Production mode
      const response = await fetch(`${ABDM_CONFIG.baseURL}/v0.5/health-information/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-CM-ID': ABDM_CONFIG.clientId,
        },
        body: JSON.stringify({
          patient_abha_id: abhaId,
          date_range: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last 1 year
            to: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medical history: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Fetch medical history error:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch medical history',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Convert Health Scan test results to FHIR DiagnosticReport format
   */
  private convertToFHIR(testResult: HealthScanTestResult): FHIRDiagnosticReport {
    const observations: FHIRObservation[] = [];

    // Add Alzheimer's observations
    if (testResult.alzheimersAssessment) {
      observations.push({
        id: `obs-alzheimers-${testResult.testId}`,
        code: {
          system: 'http://loinc.org',
          code: '72172-0',
          display: 'Cognitive Assessment',
        },
        value: testResult.alzheimersAssessment.overallScore,
        unit: 'score',
        interpretation: testResult.alzheimersAssessment.riskLevel === 'high' || testResult.alzheimersAssessment.riskLevel === 'critical' ? 'abnormal' : 'normal',
      });
    }

    // Add Parkinson's observations
    if (testResult.parkinsonsAssessment) {
      observations.push({
        id: `obs-parkinsons-${testResult.testId}`,
        code: {
          system: 'http://loinc.org',
          code: '89208-8',
          display: 'Motor Function Assessment',
        },
        value: testResult.parkinsonsAssessment.tremorFrequency,
        unit: 'Hz',
        interpretation: testResult.parkinsonsAssessment.riskLevel === 'high' || testResult.parkinsonsAssessment.riskLevel === 'critical' ? 'abnormal' : 'normal',
      });
    }

    // Build FHIR DiagnosticReport
    // Map status to FHIR-compliant values
    const fhirStatus: 'registered' | 'partial' | 'preliminary' | 'final' =
      testResult.status === 'amended' ? 'final' : testResult.status;

    return {
      resourceType: 'DiagnosticReport',
      id: testResult.testId,
      status: fhirStatus,
      category: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'NE',
          display: 'Neurology',
        }],
      },
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72172-0',
          display: 'Neurological Screening - Comprehensive',
        }],
        text: 'Health Scan Comprehensive Health Screening',
      },
      subject: {
        reference: `Patient/abha-${testResult.patientAbhaId}`,
        display: 'Patient',
      },
      effectiveDateTime: testResult.testDate,
      issued: new Date().toISOString(),
      result: observations.map(obs => ({
        reference: `Observation/${obs.id}`,
        display: obs.code.display,
      })),
      conclusion: this.generateConclusion(testResult),
      presentedForm: testResult.attachments.pdfReport ? [{
        contentType: 'application/pdf',
        url: testResult.attachments.pdfReport,
        title: 'Health Scan Detailed Report',
      }] : undefined,
    };
  }

  /**
   * Generate clinical conclusion from test results
   */
  private generateConclusion(testResult: HealthScanTestResult): string {
    const conclusions: string[] = [];

    if (testResult.alzheimersAssessment) {
      conclusions.push(`Alzheimer's Risk: ${testResult.alzheimersAssessment.riskLevel.toUpperCase()} - ${testResult.alzheimersAssessment.interpretation}`);
    }

    if (testResult.parkinsonsAssessment) {
      conclusions.push(`Parkinson's Risk: ${testResult.parkinsonsAssessment.riskLevel.toUpperCase()} - ${testResult.parkinsonsAssessment.interpretation}`);
    }

    if (testResult.epilepsyAssessment) {
      conclusions.push(`Epilepsy Assessment: ${testResult.epilepsyAssessment.riskLevel.toUpperCase()} - ${testResult.epilepsyAssessment.interpretation}`);
    }

    if (testResult.recommendations.length > 0) {
      conclusions.push(`Recommendations: ${testResult.recommendations.join('; ')}`);
    }

    return conclusions.join(' | ');
  }

  /**
   * Upload test results to patient's EHR
   */
  async uploadTestResults(testResult: HealthScanTestResult): Promise<EHRAPIResponse<{ uploadId: string }>> {
    try {
      // Convert to FHIR format
      const fhirReport = this.convertToFHIR(testResult);

      // Sandbox mode - simulate upload
      if (this.isSandboxMode()) {
        console.log('🏥 EHR: Uploading test results (sandbox mode)');
        console.log('Test Result:', testResult);
        console.log('FHIR Report:', fhirReport);

        return {
          success: true,
          data: {
            uploadId: 'upload_' + Date.now(),
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Production mode - upload to ABDM
      const response = await fetch(`${ABDM_CONFIG.baseURL}/v0.5/health-information/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-CM-ID': ABDM_CONFIG.clientId,
        },
        body: JSON.stringify({
          patient_abha_id: testResult.patientAbhaId,
          document: {
            content: btoa(JSON.stringify(fhirReport)), // Base64 encode
            type: 'DiagnosticReport',
            care_context: 'HealthScan_Screening',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload test results: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          uploadId: data.transactionId || data.id,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Upload test results error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload test results',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Request consent for health data sharing
   */
  async requestConsent(
    patientAbhaId: string,
    purpose: string,
    dataTypes: string[],
    grantedTo: { type: 'doctor' | 'hospital' | 'research'; id: string; name: string },
    validityDays: number = 365
  ): Promise<EHRAPIResponse<HealthDataConsent>> {
    try {
      const consentId = 'consent_' + Date.now();
      const grantedDate = new Date();
      const expiryDate = new Date(grantedDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

      // Sandbox mode
      if (this.isSandboxMode()) {
        return {
          success: true,
          data: {
            consentId,
            patientAbhaId,
            purpose,
            dataTypes,
            grantedTo,
            grantedDate: grantedDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: 'active',
            scope: {
              fromDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
              toDate: new Date().toISOString(),
            },
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Production mode - request consent via ABDM
      const response = await fetch(`${ABDM_CONFIG.baseURL}/v0.5/consents/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-CM-ID': ABDM_CONFIG.clientId,
        },
        body: JSON.stringify({
          patient_abha_id: patientAbhaId,
          purpose,
          data_types: dataTypes,
          granted_to: grantedTo,
          validity_days: validityDays,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to request consent: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Request consent error:', error);
      return {
        success: false,
        error: {
          code: 'CONSENT_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Failed to request consent',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Verify ABHA ID format
   */
  isValidABHAId(abhaId: string): boolean {
    // ABHA ID format: XX-XXXX-XXXX-XXXX (14 digits with hyphens)
    const regex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
    return regex.test(abhaId);
  }

  /**
   * Format ABHA ID with hyphens
   */
  formatABHAId(input: string): string {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');

    // Add hyphens: XX-XXXX-XXXX-XXXX
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  }
}

// Export singleton instance
export const ehrService = new EHRService();

