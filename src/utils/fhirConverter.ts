/**
 * FHIR (Fast Healthcare Interoperability Resources) Converter
 * Converts Health Scan test results to FHIR DiagnosticReport format
 * for ABDM (Ayushman Bharat Digital Mission) integration
 */

export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
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
    reference: string;
    display?: string;
  };
  effectiveDateTime: string;
  issued: string;
  performer?: Array<{
    reference: string;
    display: string;
  }>;
  conclusion?: string;
  conclusionCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  result: Array<{
    reference: string;
    display: string;
  }>;
  presentedForm?: Array<{
    contentType: string;
    data?: string;
    url?: string;
    title: string;
  }>;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'document' | 'collection';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: FHIRDiagnosticReport | FHIRObservation;
  }>;
}

/**
 * Convert Voice Lab results to FHIR format
 */
export function convertVoiceLabToFHIR(
  testId: string,
  patientAbhaId: string,
  patientName: string,
  testDate: string,
  results: any
): FHIRBundle {
  const observations: FHIRObservation[] = [];

  // Pitch Observation
  if (results.pitch !== null) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-pitch`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '80353-0',
          display: 'Voice pitch'
        }],
        text: 'Voice Pitch (Fundamental Frequency)'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.pitch,
        unit: 'Hz',
        system: 'http://unitsofmeasure.org',
        code: 'Hz'
      }
    });
  }

  // Loudness Observation
  if (results.loudness !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-loudness`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '80354-8',
          display: 'Voice loudness'
        }],
        text: 'Voice Loudness (RMS)'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.loudness,
        unit: 'dB',
        system: 'http://unitsofmeasure.org',
        code: 'dB'
      }
    });
  }

  // Jitter Observation
  if (results.jitter !== null) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-jitter`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '271598002',
          display: 'Voice quality abnormality'
        }],
        text: 'Voice Jitter (Frequency Variation)'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.jitter,
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      }
    });
  }

  // Diagnostic Report
  const diagnosticReport: FHIRDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: testId,
    status: 'final',
    category: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'OTH',
        display: 'Other'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '271598002',
        display: 'Voice analysis'
      }],
      text: 'Health Scan Voice Analysis - Parkinson\'s Disease Screening'
    },
    subject: {
      reference: `Patient/${patientAbhaId}`,
      display: patientName
    },
    effectiveDateTime: testDate,
    issued: new Date().toISOString(),
    conclusion: `Voice analysis completed. Risk Level: ${results.riskLevel}. Quality Score: ${results.qualityScore}/100.`,
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text
    }))
  };

  // Create FHIR Bundle
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `DiagnosticReport/${testId}`,
        resource: diagnosticReport
      },
      ...observations.map(obs => ({
        fullUrl: `Observation/${obs.id}`,
        resource: obs
      }))
    ]
  };

  return bundle;
}

/**
 * Convert Motor Lab results to FHIR format
 */
export function convertMotorLabToFHIR(
  testId: string,
  patientAbhaId: string,
  patientName: string,
  testDate: string,
  results: any
): FHIRBundle {
  const observations: FHIRObservation[] = [];

  // Finger Taps Observation
  if (results.fingerTaps !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-finger-taps`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '271706000',
          display: 'Finger tapping test'
        }],
        text: 'Finger Tapping Count'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.fingerTaps,
        unit: 'taps',
        system: 'http://unitsofmeasure.org',
        code: '{taps}'
      }
    });
  }

  // Tremor Frequency Observation
  if (results.tremorFrequency !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-tremor-freq`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '26079004',
          display: 'Tremor'
        }],
        text: 'Tremor Frequency'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.tremorFrequency,
        unit: 'Hz',
        system: 'http://unitsofmeasure.org',
        code: 'Hz'
      }
    });
  }

  // Coordination Score Observation
  if (results.coordinationScore !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-coordination`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'exam',
          display: 'Exam'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '106146005',
          display: 'Motor coordination'
        }],
        text: 'Motor Coordination Score'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.coordinationScore,
        unit: 'score',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      }
    });
  }

  // Diagnostic Report
  const diagnosticReport: FHIRDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: testId,
    status: 'final',
    category: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'OTH',
        display: 'Other'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '271706000',
        display: 'Motor function test'
      }],
      text: 'Health Scan Motor Analysis - Parkinson\'s Disease Screening'
    },
    subject: {
      reference: `Patient/${patientAbhaId}`,
      display: patientName
    },
    effectiveDateTime: testDate,
    issued: new Date().toISOString(),
    conclusion: `Motor function analysis completed. Risk Level: ${results.riskLevel}. Quality Score: ${results.qualityScore}/100.`,
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text
    }))
  };

  // Create FHIR Bundle
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `DiagnosticReport/${testId}`,
        resource: diagnosticReport
      },
      ...observations.map(obs => ({
        fullUrl: `Observation/${obs.id}`,
        resource: obs
      }))
    ]
  };

  return bundle;
}

/**
 * Convert Digit Span Test results to FHIR format
 */
export function convertDigitSpanToFHIR(
  testId: string,
  patientAbhaId: string,
  patientName: string,
  testDate: string,
  results: any
): FHIRBundle {
  const observations: FHIRObservation[] = [];

  // Forward Span Observation
  if (results.forwardSpan !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-forward-span`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72106-8',
          display: 'Digit span forward'
        }],
        text: 'Digit Span Forward Score'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.forwardSpan,
        unit: 'digits',
        system: 'http://unitsofmeasure.org',
        code: '{digits}'
      }
    });
  }

  // Backward Span Observation
  if (results.backwardSpan !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-backward-span`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72107-6',
          display: 'Digit span backward'
        }],
        text: 'Digit Span Backward Score'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.backwardSpan,
        unit: 'digits',
        system: 'http://unitsofmeasure.org',
        code: '{digits}'
      }
    });
  }

  // Diagnostic Report
  const diagnosticReport: FHIRDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: testId,
    status: 'final',
    category: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'SP',
        display: 'Surgical Pathology'
      }]
    },
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '72106-8',
        display: 'Digit span test'
      }],
      text: 'Health Scan Digit Span Test - Working Memory Assessment'
    },
    subject: {
      reference: `Patient/${patientAbhaId}`,
      display: patientName
    },
    effectiveDateTime: testDate,
    issued: new Date().toISOString(),
    conclusion: `Digit span test completed. Total Score: ${results.totalScore}. Interpretation: ${results.interpretation}.`,
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text
    }))
  };

  // Create FHIR Bundle
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `DiagnosticReport/${testId}`,
        resource: diagnosticReport
      },
      ...observations.map(obs => ({
        fullUrl: `Observation/${obs.id}`,
        resource: obs
      }))
    ]
  };

  return bundle;
}

/**
 * Convert Word List Recall Test results to FHIR format
 */
export function convertWordListToFHIR(
  testId: string,
  patientAbhaId: string,
  patientName: string,
  testDate: string,
  results: any
): FHIRBundle {
  const observations: FHIRObservation[] = [];

  // Immediate Recall Observation
  if (results.immediateRecallScore !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-immediate-recall`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72172-0',
          display: 'Immediate word recall'
        }],
        text: 'Immediate Word Recall Score'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.immediateRecallScore,
        unit: 'words',
        system: 'http://unitsofmeasure.org',
        code: '{words}'
      }
    });
  }

  // Delayed Recall Observation (MOST IMPORTANT for Alzheimer's)
  if (results.delayedRecallScore !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-delayed-recall`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72173-8',
          display: 'Delayed word recall'
        }],
        text: 'Delayed Word Recall Score (Primary Alzheimer\'s Indicator)'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.delayedRecallScore,
        unit: 'words',
        system: 'http://unitsofmeasure.org',
        code: '{words}'
      },
      interpretation: results.delayedRecallScore <= 3 ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'L',
          display: 'Low - Urgent evaluation needed'
        }]
      }] : results.delayedRecallScore <= 5 ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'N',
          display: 'Normal - Follow-up recommended'
        }]
      }] : [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'H',
          display: 'High - Normal range'
        }]
      }]
    });
  }

  // Recognition Score Observation
  if (results.recognitionScore !== undefined) {
    observations.push({
      resourceType: 'Observation',
      id: `${testId}-recognition`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72174-6',
          display: 'Word recognition'
        }],
        text: 'Word Recognition Score'
      },
      subject: {
        reference: `Patient/${patientAbhaId}`
      },
      effectiveDateTime: testDate,
      valueQuantity: {
        value: results.recognitionScore,
        unit: 'words',
        system: 'http://unitsofmeasure.org',
        code: '{words}'
      }
    });
  }

  // Diagnostic Report
  const diagnosticReport: FHIRDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: testId,
    status: 'final',
    category: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'SP',
        display: 'Surgical Pathology'
      }]
    },
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '72172-0',
        display: 'Word list memory test'
      }],
      text: 'Health Scan Word List Recall Test - Gold Standard Alzheimer\'s Screening'
    },
    subject: {
      reference: `Patient/${patientAbhaId}`,
      display: patientName
    },
    effectiveDateTime: testDate,
    issued: new Date().toISOString(),
    conclusion: `Word list recall test completed. Delayed Recall Score: ${results.delayedRecallScore}/10 (PRIMARY METRIC). Risk Level: ${results.riskLevel}. ${results.delayedRecallScore <= 3 ? 'URGENT: Immediate neurological evaluation recommended.' : results.delayedRecallScore <= 5 ? 'Follow-up consultation recommended within 2 weeks.' : 'Normal cognitive function.'}`,
    conclusionCode: results.delayedRecallScore <= 3 ? [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '26929004',
        display: 'Alzheimer\'s disease (disorder)'
      }]
    }] : undefined,
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text
    }))
  };

  // Create FHIR Bundle
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `DiagnosticReport/${testId}`,
        resource: diagnosticReport
      },
      ...observations.map(obs => ({
        fullUrl: `Observation/${obs.id}`,
        resource: obs
      }))
    ]
  };

  return bundle;
}

/**
 * Main converter function that routes to appropriate converter based on test type
 */
export function convertTestResultToFHIR(
  testType: string,
  testId: string,
  patientAbhaId: string,
  patientName: string,
  testDate: string,
  results: any
): FHIRBundle {
  switch (testType) {
    case 'voice':
      return convertVoiceLabToFHIR(testId, patientAbhaId, patientName, testDate, results);
    case 'motor':
      return convertMotorLabToFHIR(testId, patientAbhaId, patientName, testDate, results);
    case 'digitspan':
      return convertDigitSpanToFHIR(testId, patientAbhaId, patientName, testDate, results);
    case 'wordlist':
      return convertWordListToFHIR(testId, patientAbhaId, patientName, testDate, results);
    default:
      throw new Error(`Unsupported test type: ${testType}`);
  }
}

