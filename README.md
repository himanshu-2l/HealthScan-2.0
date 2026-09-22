# 🏥 HealthScan 2.0 — Your Phone is Your Lab

<div align="center">

**Turn any smartphone into a clinical screening lab. 60-second multi-modal triage — heart rate via camera PPG, voice biomarkers, motor dexterity — all on-device, zero cloud, ABDM-integrated.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?style=flat-square&logo=tensorflow)](https://www.tensorflow.org/js)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-WASM-00897B?style=flat-square)](https://mediapipe.dev/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)

</div>

---

## 🎯 The Problem

**600 million Indians** lack access to specialist health screening. Early detection of conditions like Parkinson's, cardiovascular disease, and medication errors requires expensive equipment and specialist visits. Rural Primary Health Centers (PHCs) often have a single doctor serving 30,000+ people with no diagnostic instruments beyond a stethoscope.

## 💡 The Solution

HealthScan transforms **any ₹8,000 Android phone** into a multi-modal clinical screening lab:

- **No wearable needed** — uses built-in camera, mic, and touch screen
- **No app download** — runs entirely in the browser as a PWA
- **No cloud uploads** — 100% on-device processing for complete patient privacy
- **No internet required** — works offline after first load

---

## ✨ Core Features

### 🔬 60-Second Multi-Modal Health Scan
One button. Three validated clinical assessments. Under a minute.

| Modality | Technology | What It Measures |
|----------|-----------|-----------------|
| **Heart Rate (PPG)** | Camera + flashlight optical plethysmography | BPM, HRV (RMSSD), SpO₂ estimate |
| **Voice Biomarkers** | Web Audio normalized autocorrelation | Fundamental pitch (F₀), jitter %, dysphonia risk |
| **Motor Assessment** | On-screen bilateral finger tapping (MDS-UPDRS) | Tap cadence, fatigue index, Parkinson's screen |

### 🧪 8 Specialized Clinical Labs

| Lab | Technology | Clinical Application |
|-----|-----------|---------------------|
| **Cardiovascular** | Real camera PPG + Baevsky Stress Index | Heart rate, HRV, cardiac stress |
| **Motor & Tremor** | MediaPipe hand tracking (WASM) + FFT | Parkinson's rest tremor (4-6 Hz) vs essential tremor |
| **Voice & Speech** | Normalized autocorrelation + jitter | Laryngeal health, neurological vocal markers |
| **Eye & Cognition** | Saccade latency + Stroop test + Digit Span | Cognitive processing speed, working memory |
| **Gait & Mobility** | TensorFlow.js BlazePose (33 keypoints) | COM tracking, lateral sway, symmetry |
| **Mental Health** | PHQ-9 + GAD-7 validated questionnaires | Depression and anxiety clinical screening |
| **Vision & Hearing** | Snellen optotypes + stereo audiometry | Visual acuity, color blindness, hearing thresholds |
| **Medicine Lens** | Multimodal OCR + deterministic drug resolver | Indian drug identification, interaction safety check |

### 💊 Medicine Lens (India-Specific)
- Scans medicine blister packaging via camera
- Resolves **300+ Indian pharmaceutical brands** to their salt compositions
- **Zero-hallucination** drug-drug interaction checking (deterministic engine, not LLM)
- Trilingual explanations (English, Hindi, Hinglish) with text-to-speech
- Allergy cross-reference against patient profile

### 📋 ABDM / Ayushman Bharat Integration
- ABHA (Ayushman Bharat Health Account) digital health passport
- FHIR R4 compliant diagnostic bundles
- Downloadable physician clinical PDF reports

### 🩺 Chronic Disease Management
- **Diabetes Hub**: Real pharmacokinetic IOB curves, smart bolus calculator, HbA1c estimation, night safety monitor, insulin stacking alerts
- **BP Tracker**: Voice input ("120 over 80 pulse 72"), AHA/ACC classification, MAP/pulse pressure
- **Period & Hormonal Health**: Cycle phase intelligence, PCOS screening (Rotterdam criteria), skin breakout forecasting
- **AI Health Assistant**: Gemini 1.5 Flash-powered symptom checker, health predictions, personalized recommendations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (PWA)                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Camera   │  │ Mic      │  │ Touch/Motion │   │
│  │ PPG/rPPG │  │ Web Audio│  │ Tap Cadence  │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │               │           │
│  ┌────▼──────────────▼───────────────▼───────┐   │
│  │        On-Device Signal Processing         │   │
│  │  MediaPipe WASM │ TensorFlow.js │ FFT/DSP │   │
│  └────────────────────┬──────────────────────┘   │
│                       │                          │
│  ┌────────────────────▼──────────────────────┐   │
│  │           React UI (Shadcn/Tailwind)       │   │
│  │    localStorage persistence │ FHIR export  │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
├───────────────────────┬──────────────────────────┤
│   Vercel Serverless   │    Optional Backend      │
│  /api/gemini-proxy    │   Google Fit OAuth        │
│  (AI features only)   │   WebSocket tremor view   │
└───────────────────────┴──────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern browser with camera/microphone access

### Run Locally (30 seconds)

```bash
git clone https://github.com/himanshu-2l/HealthScan-2.0.git
cd HealthScan-2.0
npm install
npm run dev
```

Open `http://localhost:5173` — click **"Explore in Demo Mode"** to start immediately.

### Environment Variables (Optional)

Copy `.env.example` to `.env` and configure:

```env
# Required only for AI features (symptom checker, chatbot, predictions)
GEMINI_API_KEY=your_google_ai_key

# Optional: Firebase Auth (Google Sign-In)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

> **Note:** HealthScan works fully without any API keys. AI-powered features (chatbot, symptom checker, predictions) require a Gemini API key. All sensor-based labs (PPG, voice, motor, gait, vision, hearing) work offline with zero configuration.

---

## 🧪 Try It on Your Phone

1. Start the dev server: `npm run dev`
2. Click **"Test on Phone"** button in the top navbar
3. Scan the QR code with your phone camera
4. Place your fingertip over the rear camera lens
5. Watch your pulse waveform appear in real-time

> **Pro tip:** The rear camera + flashlight produces the best PPG signal. Works on any phone with a camera.

---

## 🏆 What Makes This Different

| Feature | HealthScan | Typical Health Apps |
|---------|-----------|-------------------|
| **Sensors used** | Camera + Mic + Touch (3 modalities) | Single sensor or wearable required |
| **Processing** | 100% on-device (MediaPipe WASM, TF.js) | Cloud-dependent |
| **Signal processing** | Real PPG, FFT, autocorrelation | Simulated/fake data |
| **Drug safety** | Deterministic resolver (300+ Indian brands) | LLM-based (hallucination risk) |
| **Privacy** | Zero cloud telemetry, no video upload | Data sent to servers |
| **Accessibility** | Any browser, any phone, no download | App store dependency |
| **Clinical protocols** | MDS-UPDRS, PHQ-9, GAD-7, Snellen, Ishihara | Custom non-validated tests |
| **India-specific** | ABDM/ABHA, Hindi audio, ₹ meal plans | Generic Western-focused |

---

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| **Computer Vision** | MediaPipe Hand Landmarker (WASM), TensorFlow.js BlazePose |
| **Signal Processing** | Web Audio API, Canvas 2D, Normalized Autocorrelation, FFT |
| **AI/ML** | Google Gemini 1.5 Flash (via server proxy) |
| **Data** | localStorage, FHIR R4 export, jsPDF clinical reports |
| **Auth** | Firebase Auth (Google) + demo mode fallback |
| **PWA** | Service Worker, Web App Manifest, installable |
| **Deployment** | Vercel (serverless API routes) |

---

## 📄 Medical Disclaimer

HealthScan is a screening and wellness tool, **not a diagnostic medical device**. Results should be discussed with a qualified healthcare provider. Not intended to replace professional medical advice, diagnosis, or treatment.

---

## 👥 Team

Built by [himanshu-2l](https://github.com/himanshu-2l) and contributors.

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.