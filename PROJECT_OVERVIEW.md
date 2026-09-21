# 🏥 HealthScan — Deep Project Overview, Architecture & Clinical Engineering Blueprint

> **Privacy-First Multi-Modal Browser Lab Bench for On-Device Preventive Health Screening, Neurological Biomarkers, Chronic Disease Management, and ABDM/FHIR Interoperability.**

---

## 📌 1. Executive Summary

**HealthScan** is an end-to-end, edge-computed digital health screening platform. It turns any commodity smartphone, laptop, or tablet equipped with a standard webcam, microphone, and touchscreen into a clinical-grade screening lab bench.

Instead of requiring proprietary hospital equipment or sending sensitive biometric data to third-party cloud servers, **all primary signal processing and machine learning inference occurs strictly client-side** using WebAssembly, WebGL, TensorFlow.js, and the Web Audio API.

The platform bridges three historically disconnected healthcare pillars:
1. **Early Neurological & Cognitive Screening** (Parkinson's, Alzheimer's, Essential Tremor, Dysarthria, Saccadic Latency).
2. **Chronic Disease & Hormonal Intelligence** (Type 1/2 Diabetes insulin pharmacokinetics, PCOS, and cycle-glucose sync).
3. **National Health Interoperability** (India's Ayushman Bharat Digital Mission — ABDM — and global HL7/FHIR R4 standards).

---

## 🎯 2. The Problems Identified & Healthcare Gaps

### Problem 1: The "Too Late" Neurological Diagnostic Curve
- **The Issue**: Neurodegenerative diseases like Parkinson's and Alzheimer's develop asymptomatically for 5 to 10 years before classic clinical manifestation. By the time a patient experiences visible motor resting tremors or severe memory loss, up to **60–80% of dopamine-producing neurons in the substantia nigra have already degenerated**.
- **The Barrier**: Formal assessments (MDS-UPDRS, PET scans, neuropsychological batteries) cost upwards of \$1,000, take months on specialist waitlists, and are virtually inaccessible to rural and low-income populations.

### Problem 2: The Hardware Monopoly on Vital Signs
- **The Issue**: Continuous monitoring of cardiovascular metrics (Heart Rate, Heart Rate Variability, Arrhythmia, Bradycardia) traditionally requires dedicated electrocardiogram (ECG) patches or \$300+ smartwatches.
- **The Barrier**: Millions of people in developing countries own a smartphone with a camera and flash, but lack access to basic cardiovascular telemetry.

### Problem 3: The Insulin Stacking & Nighttime Hypoglycemia Dilemma
- **The Issue**: Over 530 million people live with diabetes. Diabetic patients often administer correction insulin boluses without accounting for active **Insulin on Board (IOB)** from previous doses. This leads to **insulin stacking**, causing severe hypoglycemic episodes that frequently strike during sleep (nocturnal hypoglycemia) and can be fatal.
- **The Barrier**: Continuous Glucose Monitors (CGMs) and smart insulin pumps cost thousands of dollars per year. Manual pen injectors provide zero pharmacokinetic memory.

### Problem 4: The Siloed Nature of Women's Hormonal Health
- **The Issue**: Conditions like Polycystic Ovary Syndrome (PCOS) affect 1 in 5 women of reproductive age, yet up to 70% remain undiagnosed. Furthermore, luteal phase progesterone surges dramatically increase insulin resistance in diabetic women, yet traditional diabetes tools treat metabolic rates as static.

### Problem 5: The Medical Privacy & Interoperability Paradox
- **The Issue**: Uploading video, voice audio, or biometric traces to proprietary AI cloud platforms violates medical privacy and raises severe HIPAA/GDPR red flags. At the same time, when patients do visit hospitals, their home health logs are trapped in siloed consumer apps rather than national electronic health records (EHR).

---

## 💡 3. What HealthScan Has Solved (Detailed Technical Breakdown)

HealthScan addresses each of these gaps with specific on-device clinical screening engines:

```
+----------------------------------------------------------------------------------------------------+
|                                    HEALTHSCAN PLATFORM ARCHITECTURE                                 |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ USER PERIPHERALS ]                                                                             |
|      Camera / Flash ------------> Photoplethysmography (PPG) Pulse & Arrhythmia Detection           |
|      Microphone ---------------> Web Audio API F0 Autocorrelation, Jitter, Shimmer, HNR             |
|      Touch / Keyboard ---------> MDS-UPDRS Tapping Rhythm, Bradykinesia, Fatigue Decay              |
|      Display / Target ---------> Visual Saccades, Stroop Interference, Digit Span, Word Recall      |
|      Full Body Video ----------> TensorFlow.js BlazePose Keypoints, Center of Mass, Bilateral Gait  |
|                                                                                                    |
|   [ ON-DEVICE PROCESSING ENGINES (Client-Side Edge) ]                                              |
|      +-----------------------+  +-----------------------+  +------------------------------------+  |
|      |  Neuro Motor & Voice  |  |   Cognitive & Memory  |  |    Cardiovascular & Audiometry     |  |
|      |  - 4-6Hz Tremor FFT   |  |   - Millisecond RT    |  |    - Green-channel PPG filter  |  |
|      |  - Tap Cadence Decays |  |   - Stroop Inhibitory |  |    - HRV: RMSSD, SDNN, pNN50   |  |
|      |  - Audio Perturbation |  |   - Episodic Recall   |  |    - Pure Tone Sweeps (250-8k) |  |
|      +-----------------------+  +-----------------------+  +------------------------------------+  |
|      +--------------------------------------------------+  +------------------------------------+  |
|      |         Metabolic & Hormonal Intelligence        |  |     EHR & Interoperability Engine  |  |
|      |  - Bilinear Insulin-on-Board (IOB) Decay         |  |   - FHIR R4 Bundle Serializer      |  |
|      |  - Nighttime Hypo Risk Prediction Engine         |  |   - ABDM Gateway Sandbox / HIU     |  |
|      |  - Rotterdam PCOS Biomarker Scorer               |  |   - Google Fit OAuth Sync          |  |
|      |  - Luteal Phase Insulin Resistance Compensation  |  |   - Encrypted Local Vault (AES)    |  |
|      +--------------------------------------------------+  +------------------------------------+  |
|                                                                                                    |
|   [ BACKEND MICROSERVICES (Node.js / Express / WebSockets) ]                                        |
|      - Real-Time Tremor Broadcast (/ws/tremor)                                                      |
|      - IoT Virtual Sensor Simulation (Body Temperature, Vitals Telemetry)                          |
|      - Google Fit Token Exchange & OAuth Proxy                                                      |
|      - LLM Clinical Summarization Pipeline (Gemini Pro Medical Synthesis)                          |
+----------------------------------------------------------------------------------------------------+
```

---

### 🔬 3.1. Testing Labs & Diagnostic Algorithms

#### 1. Motor & Tremor Lab (`src/components/labs/MotorLab.tsx` & `src/utils/advancedMotorAnalysis.ts`)
- **Clinical Standard**: Movement Disorder Society Unified Parkinson's Disease Rating Scale (MDS-UPDRS Part III).
- **Bradykinesia Detection**: Measures alternating finger tap intervals. Computes mean tap cadence, standard deviation, and Coefficient of Variation (CV).
  - Normal: $5 - 12\text{ taps/s}$
  - Mild Impairment: $3 - 5\text{ taps/s}$
  - Moderate: $2 - 3\text{ taps/s}$
  - Severe Bradykinesia: $< 2\text{ taps/s}$
- **Fatigue Index**: Compares the first half of a 10–30 second tapping trial with the second half:
  $$\text{Fatigue Index} = \frac{\Delta \bar{T}_{\text{second}} - \bar{T}_{\text{first}}}{\bar{T}_{\text{first}}} \times 100$$
  Deceleration in cadence is a primary clinical marker of Parkinsonian motor deterioration.
- **Tremor Frequency Spectral Decomposition**:
  - **Parkinsonian Rest Tremor**: 4–6 Hz band.
  - **Essential / Postural Tremor**: 6–12 Hz band.
  - **Physiological Tremor**: $<4\text{ Hz}$ or high frequency ($>12\text{ Hz}$).

#### 2. Voice & Speech Lab (`src/components/labs/VoiceLab.tsx`)
- **Acoustic Biomarker Pipeline**:
  1. Captures uncompressed PCM audio via `AudioContext` and `AnalyserNode` at 44.1 kHz.
  2. Extracts fundamental frequency ($F_0$) in real time using a normalized autocorrelation algorithm optimized for human vocal range (50 Hz to 800 Hz):
     $$R(\tau) = \frac{\sum_{t} x(t) x(t + \tau)}{\sqrt{\sum_t x^2(t) \sum_t x^2(t + \tau)}}$$
  3. **Jitter (Pitch Perturbation)**: Cycle-to-cycle frequency variations. Elevated jitter indicates vocal fold instability, typical of hypophonia.
  4. **Shimmer (Amplitude Perturbation)**: Cycle-to-cycle amplitude variations.
  5. **Harmonics-to-Noise Ratio (HNR)**: Detects breathiness and dysphonia.
  6. **Multi-Disease Profiling**: Stratifies risk across Parkinson's disease, Alzheimer's speech degradation, and acute laryngeal disorders.

#### 3. Eye & Cognition Lab (`src/components/labs/EyeLab.tsx`)
- **Pro-Saccade & Anti-Saccade Reaction Tests**: Measures visual reaction latency in milliseconds using high-precision browser timestamps (`performance.now()`). Delayed saccades and fixation drift are early indicators of frontostriatal disruption.
- **Stroop Color-Word Interference Test**: Evaluates executive inhibition and selective attention (anterior cingulate cortex). Measures accuracy, congruent vs. incongruent reaction time delta, and interference resistance.
- **Digit Span Memory Test (`DigitSpanTest.tsx`)**: Evaluates short-term and working memory (forward span and backward span).
- **Word List Memory Test (`WordListTest.tsx`)**: Modeled after the CERAD and Rey Auditory Verbal Learning Test (RAVLT). Tests immediate recall over multiple learning trials and delayed recall to detect amnestic Mild Cognitive Impairment (MCI) and early Alzheimer's.

#### 4. Cardiovascular Lab (`src/components/labs/CardiovascularLab.tsx` & `src/utils/pulseDetection.ts`)
- **Camera Photoplethysmography (PPG)**:
  1. Requests webcam stream with video constraints optimized for high frame rate.
  2. Samples the average green and red channel pixel intensity over the fingertip:
     $$I_{\text{green}}(t) = \frac{1}{N} \sum_{(x,y) \in \text{ROI}} G(x, y, t)$$
     The green wavelength (520–540 nm) exhibits optimal absorption contrast with hemoglobin.
  3. Applies rolling average DC-offset subtraction and peak detection to extract inter-beat intervals (RR intervals).
- **Heart Rate Variability (HRV)** (`src/utils/hrvAnalysis.ts`):
  - **RMSSD**: Root mean square of successive RR differences (parasympathetic/vagal tone).
  - **SDNN**: Standard deviation of all NN intervals (overall autonomic health).
  - **pNN50**: Percentage of adjacent intervals differing by $>50\text{ ms}$.
  - **Autonomic Flagging**: Detects signs of autonomic neuropathy, chronic stress, or cardiac fatigue.

#### 5. Gait & Posture Lab (`src/components/labs/GaitLab.tsx` & `src/services/labs/gaitService.ts`)
- **MediaPipe BlazePose On-Device Neural Model**: Loads `@tensorflow-models/pose-detection` with WebGL hardware acceleration.
- **Biomechanical Metrics**:
  - **Center of Mass (COM)** tracking via hip midpoints.
  - **Lateral & Vertical Sway Index**: Quantifies balance instability.
  - **Bilateral Limb Symmetry**: Computes Euclidean length ratios of left vs. right thigh/shank vectors.
  - **Dynamic Joint Angles**: Measures left/right hip, knee, and ankle angles in real-time.

#### 6. Mental Health Lab (`src/components/labs/MentalHealthLab.tsx` & `src/utils/mentalHealthScoring.ts`)
- Implements clinically validated psychometric screening tools:
  - **PHQ-9 (Patient Health Questionnaire)**: 9 DSM-5 depression criteria (Minimal 0-4, Mild 5-9, Moderate 10-14, Moderately Severe 15-19, Severe 20-27). Includes hard trigger safeguards on Item 9 (self-harm/suicidal ideation).
  - **GAD-7 (Generalized Anxiety Disorder)**: 7-item anxiety severity scale.

#### 7. Vision & Hearing Lab (`src/components/labs/VisionHearingLab.tsx`)
- **Vision**: Screen-calibrated Snellen visual acuity optotypes, astigmatism fan tests, and Ishihara pseudo-isochromatic color deficiency plates.
- **Hearing**: Pure-tone audiometry generator using Web Audio oscillators playing calibrated sine waves across 250 Hz, 500 Hz, 1000 Hz, 2000 Hz, 4000 Hz, and 8000 Hz to map bilateral hearing threshold loss.

---

### 🩺 3.2. Metabolic & Chronic Disease Management

#### Diabetes Intelligence Suite (`src/components/diabetes/` & `src/services/`)
- **Insulin on Board (IOB) Calculator (`IOBCalculator.tsx`, `iobService.ts`)**: Models rapid-acting insulin pharmacokinetics (e.g., Novolog/Humalog) with a 3–5 hour decay curve:
  $$\text{IOB}(t) = \text{Dose} \times \left(1 - \frac{t}{T_{\text{duration}}}\right)^2$$
- **Insulin Stacking Alert (`StackingAlert.tsx`)**: Alerts users if they attempt to inject a correction bolus before previously injected insulin has decayed, preventing severe hypoglycemic crashes.
- **Nighttime Hypoglycemia Monitor (`NightSafetyMonitor.tsx`, `nightSafetyService.ts`)**: Assesses bedtime glucose, current IOB, daytime exercise intensity, and bedtime snack carb ratios to flag overnight risk.
- **eA1c Estimator (`HbA1cEstimator.tsx`)**: Translates 14–90 day mean glucose readings into estimated HbA1c using the clinical ADAG formula:
  $$\text{HbA1c (\%)} = \frac{\text{Mean Glucose (mg/dL)} + 46.7}{28.7}$$
- **Smart Dose Recommendation (`SmartDoseRecommendation.tsx`)**: Computes meal boluses from Carbohydrate-to-Insulin Ratio (CIR) and correction boluses from Insulin Sensitivity Factor (ISF).

#### Hormonal Health & Cycle Intelligence (`src/components/hormonal/` & `src/services/hormonalHealthService.ts`)
- **4-Phase Endocrine Modeling**: Simulates estrogen, progesterone, LH, and FSH curves across Menstrual, Follicular, Ovulatory, and Luteal phases.
- **PCOS Risk Detector (`PCOSRiskDetector.tsx`)**: Implements Rotterdam criteria and Ferriman-Gallwey hirsutism scoring combined with cycle length variance.
- **Diabetes-Cycle Synchronization (`DiabetesCycleIntegration.tsx`)**: Recognizes that the progesterone surge during the mid-to-late luteal phase induces temporary insulin resistance, automatically recommending proportional basal/bolus adjustments.
- **Skin Breakout & Pain Predictors (`SkinPredictor.tsx`, `PainTracker.tsx`)**: Predicts sebum flares and dysmenorrhea based on hormone transition points.

---

### 🌐 3.3. Interoperability, EHR & National Health Infrastructure

#### ABDM (Ayushman Bharat Digital Mission) Integration (`src/services/ehrService.ts`)
- **ABHA Account Architecture**: Connects to the National Health Authority (NHA) gateway (`https://dev.abdm.gov.in/gateway`).
- **M1/M2/M3 Milestone Readiness**:
  - **M1**: ABHA creation, verification, and profile retrieval.
  - **M2**: Health Information User (HIU) consent request creation and status polling.
  - **M3**: Health Information Provider (HIP) push of clinical health documents.
- **Sandbox & Production Toggle**: Seamlessly switches between live NHA sandbox endpoints and local deterministic demo mocks.

#### FHIR R4 Standardization (`src/utils/fhirConverter.ts`)
Every test executed on HealthScan transforms into international standard HL7 FHIR (Fast Healthcare Interoperability Resources) R4 bundles:
- `FHIRDiagnosticReport`: Contains metadata, practitioner, patient reference, clinical conclusion, and observation links.
- `FHIRObservation`: Encapsulates specific biomarkers (e.g., LOINC codes for Tremor Frequency, Pitch Jitter, Resting Heart Rate, Blood Glucose, Blood Pressure).
- Allows medical records to be exported to hospital systems, Epic, Cerner, or Ayushman Bharat Health Lockers.

---

### 🤖 3.4. Generative AI & Clinical Report Synthesis

#### Doctor Report Generation (`src/components/DoctorReport.tsx`)
- Integrates Google Gemini LLM (`@google/generative-ai`) to aggregate fragmented multi-modal test results (blood pressure trends, voice jitter, motor tap cadence, glucose logs) into a unified, professional medical report.
- Formats reports with:
  1. Patient Demographics & Known Conditions.
  2. Objective Diagnostic Metrics with normal clinical reference ranges.
  3. AI-Generated Clinical Synthesis (plain-English interpretation for the patient + medical terminology for the physician).
  4. Suggested Follow-Up & Specialty Consultations.
  5. Built-in PDF generation (`jspdf` + `jspdf-autotable`) and printable medical charts.

---

## 📂 4. Complete Codebase Structure & Directory Map

```
Health-Scan/
├── .env / .env.example              # Client & Server Environment Variables
├── package.json                     # Dependencies (React 18, Vite, TensorFlow, MediaPipe, Lucide, Radix)
├── vite.config.ts                   # Vite bundler, proxy configuration for /api and /auth
├── index.html                       # HTML5 entry with mobile viewport and font assets
│
├── src/
│   ├── main.tsx                     # React root initialization
│   ├── App.tsx                      # Master routing with ProtectedRoute wrappers
│   ├── index.css                    # Tailwind CSS definitions, themes, glassmorphism tokens
│   │
│   ├── contexts/                    # Global React State Providers
│   │   ├── AuthContext.tsx          # Firebase Google Auth + Local Demo Mode session management
│   │   ├── EHRContext.tsx           # ABDM / ABHA patient profile and record state
│   │   ├── SettingsContext.tsx      # Application configurations & Gemini API key storage
│   │   └── ThemeContext.tsx         # Dark / Light / Medical Glass theme management
│   │
│   ├── pages/                       # Full-Page Screen Views
│   │   ├── Index.tsx                # Public Landing Page with platform overview
│   │   ├── Login.tsx                # Authentication page (Google Sign-In + Demo Mode)
│   │   ├── Dashboard.tsx            # Main Health Overview dashboard
│   │   ├── Labs.tsx                 # Multi-modal testing lab hub
│   │   ├── BPTrackerPage.tsx        # Blood pressure trends, charts, and logging
│   │   ├── DiabetesManagementPage.tsx # Comprehensive diabetes metabolic suite
│   │   ├── PeriodTrackerPage.tsx    # Hormonal health & menstrual cycle intelligence
│   │   ├── EHRPage.tsx              # ABDM ABHA integration & medical history records
│   │   ├── ReportsPage.tsx          # Past test history & medical exports
│   │   ├── DoctorReportPage.tsx     # Physician report generator with Gemini AI
│   │   ├── PatientProfilePage.tsx   # Comprehensive medical profile & ID cards
│   │   ├── CaregiverDashboard.tsx   # Remote monitoring view for family / doctors
│   │   ├── SymptomCheckerPage.tsx   # Guided clinical symptom diagnostic assistant
│   │   ├── VaccinationPage.tsx      # Immunization tracking & reminders
│   │   ├── EmergencyContactsPage.tsx# Emergency SOS & contact management
│   │   ├── HealthPredictionsPage.tsx# Predictive health analytics
│   │   ├── RecommendationsPage.tsx  # Personalized diet, lifestyle, and exercise advice
│   │   ├── SmartwatchPage.tsx       # Wearables & smartwatch sync status
│   │   ├── VoiceEntryPage.tsx       # Voice-driven vital sign data entry
│   │   ├── DeviceModel.tsx          # 3D/interactive hardware kiosk demonstration
│   │   ├── Purpose.tsx & About.tsx  # Institutional mission & scientific background
│   │   └── NotFound.tsx             # 404 Fallback page
│   │
│   ├── components/
│   │   ├── labs/                    # Core Diagnostic Lab Engines
│   │   │   ├── MotorLab.tsx         # Parkinson's finger tapping & tremor analysis
│   │   │   ├── VoiceLab.tsx         # Real-time vocal biomarker & pitch autocorrelation
│   │   │   ├── EyeLab.tsx           # Saccade latency & Stroop interference test
│   │   │   ├── DigitSpanTest.tsx    # Working memory assessment
│   │   │   ├── WordListTest.tsx     # Immediate & delayed episodic memory recall
│   │   │   ├── CardiovascularLab.tsx# Camera-based photoplethysmography (PPG) & HRV
│   │   │   ├── GaitLab.tsx          # Real-time pose estimation & walking balance
│   │   │   ├── MentalHealthLab.tsx  # PHQ-9 and GAD-7 screening batteries
│   │   │   └── VisionHearingLab.tsx # Snellen, Ishihara & Pure-Tone Audiometry
│   │   │
│   │   ├── diabetes/                # Specialized Diabetes Sub-Components
│   │   │   ├── IOBCalculator.tsx    # Insulin on Board decay tracker
│   │   │   ├── StackingAlert.tsx    # Bolus stacking warning banner
│   │   │   ├── NightSafetyMonitor.tsx# Nocturnal hypo risk monitor
│   │   │   ├── HbA1cEstimator.tsx   # ADAG formula eA1c estimator
│   │   │   ├── PatternAnalysis.tsx  # Hyper/hypo trend recognition
│   │   │   ├── GlucosePredictionChart.tsx # ML forecasted glucose curves
│   │   │   ├── SmartDoseRecommendation.tsx # CIR & ISF calculation
│   │   │   └── CaregiverView.tsx    # Remote family monitoring portal
│   │   │
│   │   ├── hormonal/                # Women's Endocrine & Cycle Sub-Components
│   │   │   ├── CyclePhaseIntelligence.tsx # Phase-specific hormone guidance
│   │   │   ├── PCOSRiskDetector.tsx # Rotterdam & Ferriman-Gallwey screening
│   │   │   ├── DiabetesCycleIntegration.tsx # Luteal insulin resistance sync
│   │   │   ├── PainTracker.tsx      # Dysmenorrhea tracking & body mapping
│   │   │   ├── MoodTracker.tsx      # PMDD & cycle-correlated mood analysis
│   │   │   └── SkinPredictor.tsx    # Hormonal breakout forecasting
│   │   │
│   │   ├── GlassNavbar.tsx          # Responsive navigation bar with user status
│   │   ├── SiteFooter.tsx           # Site footer & legal disclaimers
│   │   ├── ProtectedRoute.tsx       # Authentication guard for private routes
│   │   ├── ErrorBoundary.tsx        # React runtime error boundary
│   │   ├── ChatBot.tsx              # Gemini AI health assistant
│   │   ├── BPChatBot.tsx            # Specialized hypertension assistant
│   │   ├── GoogleFitIntegration.tsx # Google Fit sync card & telemetry charts
│   │   ├── BodyTemperature.tsx      # IoT simulated real-time temperature monitor
│   │   ├── DoctorReport.tsx         # Comprehensive PDF and printable reports
│   │   ├── EarlyWarningAlerts.tsx   # Anomaly detection warning toasts/cards
│   │   └── ui/                      # Reusable Radix / Tailwind component library
│   │
│   ├── services/                    # Business Logic, Analytics & Storage Layer
│   │   ├── advancedMotorAnalysis.ts # MDS-UPDRS clinical math
│   │   ├── anomalyDetectionService.ts# Statistical outlier & trend detector
│   │   ├── bpService.ts             # Blood pressure calculation & AHA staging
│   │   ├── diabeticRiskService.ts   # ADA Diabetes Risk Assessment
│   │   ├── doseRecommendationService.ts# Insulin dose computation
│   │   ├── earlyWarningService.ts   # System-wide alert aggregator
│   │   ├── ehrService.ts            # ABDM Gateway client & token manager
│   │   ├── glucoseService.ts        # Glucose logging & storage
│   │   ├── glucosePredictionService.ts# Autoregressive glucose forecasting
│   │   ├── healthDataService.ts     # Centralized test result persistence
│   │   ├── healthScoreService.ts    # Composite 0-100 wellness index
│   │   ├── hormonalHealthService.ts # Cycle, hormone, and PCOS analytics
│   │   ├── iobService.ts            # Pharmacokinetic decay mathematics
│   │   ├── mealPlannerService.ts    # Nutritional and glycemic index advice
│   │   ├── nightSafetyService.ts    # Night risk scoring logic
│   │   ├── patientProfileService.ts # Local patient profile management
│   │   ├── patternRecognitionService.ts# Glucose & BP pattern recognition
│   │   ├── pdfReportService.ts      # Client-side PDF builder using jsPDF
│   │   ├── periodTrackerService.ts  # Menstrual cycle dates & lengths
│   │   ├── vaccinationService.ts    # Immunization schedules & WHO guidelines
│   │   └── labs/
│   │       └── gaitService.ts       # TensorFlow BlazePose model runner
│   │
│   ├── utils/                       # Mathematical & Clinical Math Helpers
│   │   ├── advancedMotorAnalysis.ts # Upgraded motor math & clinical cutoffs
│   │   ├── fhirConverter.ts         # HL7 FHIR R4 Bundle conversion
│   │   ├── hearingTests.ts          # Pure-tone frequencies & dB threshold maps
│   │   ├── hrvAnalysis.ts           # Time-domain HRV (RMSSD, SDNN, pNN50)
│   │   ├── mentalHealthScoring.ts   # PHQ-9 / GAD-7 scoring algorithms
│   │   ├── pulseDetection.ts        # Video color photoplethysmography (PPG)
│   │   ├── statisticalAccuracy.ts   # Median, trimmed mean, confidence intervals
│   │   └── visionTests.ts           # Visual acuity & color blindness scoring
│   │
│   └── types/                       # TypeScript Type Definitions
│       ├── ehr.ts                   # ABDM, ABHA & FHIR R4 data contracts
│       ├── health.ts                # Test results, vitals, lab reports
│       └── hormonal.ts              # Endocrine levels, cycles, symptoms
│
├── backend/                         # Node.js Server & WebSockets
│   ├── googleFitService.cjs         # Google Fitness REST API OAuth & data parser
│   └── src/
│       ├── index.js                 # HTTP server + express-ws WebSocket engine
│       ├── app.js                   # Express application, security headers, rate limiters
│       ├── config/
│       │   └── db.js                # MongoDB Mongoose connector with retry backoff
│       ├── middleware/
│       │   ├── auth.js              # JWT & session verification
│       │   ├── rateLimiter.js       # In-memory sliding window rate limiter
│       │   └── validate.js          # Request schema validation
│       ├── models/
│       │   ├── User.js              # User account schema
│       │   ├── Assessment.js        # Generic assessment record
│       │   ├── FeatureData.js       # Flexible metric storage
│       │   ├── TremorAssessment.js  # Dedicated tremor time-series schema
│       │   ├── GaitAnalysisAssessment.js # 3D gait keypoints schema
│       │   ├── HyperventilationAssessment.js # Breathing assessment schema
│       │   └── EmergencyContact.js  # Emergency contact info schema
│       └── routes/
│           ├── featureRoutes.js     # Symptoms, period, predictions, vaccines
│           ├── labRoutes.js         # Lab submission & historical query endpoints
│           └── googleFitRoutes.js   # Google Fit OAuth, status, and proxy endpoints
│
└── api/                             # Vercel Serverless Functions (Cloud Deployment)
    ├── body-temperature.js          # IoT sensor endpoint
    ├── generate-report.js           # Gemini API cloud proxy
    ├── test.js                      # Vercel health check
    └── google-fit/                  # Serverless Google Fit OAuth handlers
        ├── auth.js
        ├── callback.js
        └── data.js
```

---

## 📊 5. Current Implementation Status Audit

| Domain / Lab | Clinical Foundation | Real Implementation Status | Data Source / Technology |
| :--- | :--- | :--- | :--- |
| **Motor & Tremor Lab** | MDS-UPDRS Part III | **100% Functional** | On-device touch events, timer deltas, cadence fatigue math |
| **Voice & Speech Lab** | Acoustic Dysarthria | **100% Functional** | Web Audio API autocorrelation, $F_0$ extraction, Jitter/Shimmer |
| **Eye & Cognition Lab** | Saccades, Stroop, RAVLT | **100% Functional** | High-precision `performance.now()` reaction timers, Stroop engine |
| **Cardiovascular PPG** | AHA Guidelines | **100% Functional** | Video canvas green channel photoplethysmography, peak detection |
| **Gait & Balance Lab** | Biomechanical Kinematics | **100% Functional** | TensorFlow.js + BlazePose running on client WebGL |
| **Mental Health Lab** | DSM-5 (PHQ-9 & GAD-7) | **100% Functional** | Standardized psychometric scoring & suicide risk safeguards |
| **Vision & Hearing Lab**| Snellen / Ishihara / PTA | **100% Functional** | Canvas rendering, Web Audio oscillator sweeps (250-8000 Hz) |
| **Diabetes Intelligence**| ADA / ADAG / IOB | **100% Functional** | Bilinear IOB decay, stacking prevention, nocturnal hypo risk |
| **Hormonal Intelligence**| Rotterdam / Endocrine | **100% Functional** | 4-phase hormone curves, PCOS scoring, cycle-glucose sync |
| **Doctor Report Generator**| FHIR / Clinical PDF | **100% Functional** | Gemini LLM integration + client-side jsPDF rendering |
| **ABDM / ABHA Gateway** | NHA India Specification | **Functional (Dual-Mode)**| Sandbox mode with demo profiles; production-ready for NHA keys |
| **FHIR R4 Serializer** | HL7 International | **100% Functional** | Converts any test to valid `DiagnosticReport` / `Observation` JSON |
| **Google Fit Integration**| Google Fitness REST API | **Functional** | Backend OAuth proxy, dynamic port detection, and fallback data |
| **Authentication** | Firebase + Local Vault | **Dual Mode Active** | Real Firebase Google OAuth + Instant Demo Mode bypass |
| **IoT Sensor Simulation**| Medical Device Telemetry| **100% Functional** | Backend simulated temperature streams + WebSocket `/ws/tremor` |

---

## 🚀 6. Actionable Enhancement & Upgrade Roadmap

Based on the Karpathy Guidelines (surgical changes, solving real bottlenecks, goal-driven execution), here is the structured development roadmap for upcoming iterations:

### Phase 1: Signal Processing & Sensor Optimization
1. **Camera PPG Stability**: Add ambient light calibration and automatic flash/torch toggling via `MediaTrackConstraints` (`torch: true` on mobile Chromium) for higher signal-to-noise ratio in blood pulse readings.
2. **Audio FFT Visualization**: Upgrade the canvas in `VoiceLab.tsx` with a real-time spectrogram and formant ($F_1, F_2$) tracking to enhance dysarthria detection.
3. **Audio Noise Suppression**: Add a Web Audio biquad high-pass filter (cutoff at 70 Hz) to eliminate low-frequency microphone rumble and AC hum.

### Phase 2: Native Hardware & Wearables
1. **Web Bluetooth API (BLE)**: Connect directly in-browser to standard Bluetooth Low Energy heart rate monitors (GATT Service `0x180D`), pulse oximeters, and smart continuous glucose monitors.
2. **Offline Web Vitals PWA**: Add a service worker to enable 100% offline functionality so patients in rural areas without internet connectivity can execute all neurological, motor, cognitive, and vision tests.

### Phase 3: Longitudinal Patient Intelligence
1. **Patient Trend Regression**: Build trend visualization comparing motor tapping decay over 30/60/90 days to track disease progression or medication effectiveness (e.g., Levodopa on/off cycles).
2. **Caregiver SMS/WhatsApp Alerts**: Add Twilio or WhatsApp Business API webhooks when emergency flags trigger (e.g., nocturnal hypoglycemia risk, PHQ-9 severe distress).

---

## 🔒 7. Privacy, Ethics & Regulatory Disclaimer

- **On-Device Safety**: All video feeds (camera PPG, gait analysis) and microphone audio streams are processed strictly in volatile browser RAM and discarded after frame analysis. No raw video or audio is ever uploaded to a server.
- **Regulatory Notice**: HealthScan is an AI-powered screening and preliminary biomarker tracking platform designed to support early detection and facilitate physician consultations. It is **not a substitute for definitive medical diagnosis, prescription, or clinical treatment**. Users are consistently instructed to consult certified medical professionals upon abnormal screening indicators.
