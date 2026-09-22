# HealthScan — Project Guidelines & Architecture

## Overview
HealthScan is an edge-computed, privacy-first digital clinical screening platform and PWA. It turns any smartphone or web browser into a multi-modal screening lab using client-side signal processing, computer vision, and audio analysis without requiring cloud processing for core diagnostics.

---

## Commands & Workflows

### Frontend Development
- `npm run dev`: Start Vite development server (runs on `http://localhost:5174`, proxies `/api` and `/auth` to port 3005).
- `npm run build`: Production build with Rollup chunk splitting (`dist/`).
- `npm run build:dev`: Development build mode.
- `npm run preview`: Preview production build locally.
- `npm run lint`: Run ESLint checks across the codebase.

### Backend Development
- `npm run server`: Start Express + WebSocket server (`backend/src/index.js`) on port 3005 (or `PORT` env var).
- `node server.js`: Standalone legacy Express API server on port 3001.

### Testing & Validation
- Check TypeScript types: `npx tsc --noEmit`
- Run test scripts: `node scripts/testMedicineLens.mjs`

---

## Tech Stack & Architecture

### Frontend (Client-Side Edge)
- **Framework**: React 18 (TypeScript), Vite 5
- **Routing**: `react-router-dom` v6 with code-split lazy routes
- **UI & Styling**: Tailwind CSS, Shadcn UI (Radix UI primitives), Lucide React icons, Framer Motion
- **Data Fetching & State**: `@tanstack/react-query`, React Context (`AuthContext`, `EHRContext`, `ThemeContext`, `SettingsContext`)
- **Signal Processing & On-Device ML**:
  - Photoplethysmography (PPG) pulse analysis via Canvas 2D + green channel filtering (`src/utils/pulseDetection.ts`)
  - Voice Biomarkers: Web Audio API autocorrelation, fundamental frequency ($F_0$), jitter/shimmer (`src/components/labs/VoiceLab.tsx`)
  - MediaPipe Hand Landmarker WASM for 4–6 Hz tremor frequency FFT (`src/components/labs/MotorLab.tsx`)
  - TensorFlow.js BlazePose for gait analysis & center-of-mass balance tracking (`src/components/labs/GaitLab.tsx`)
  - Audio tone generation for audiometry (`src/utils/hearingTests.ts`)
- **Offline & Interoperability**:
  - PWA Service Worker (`public/sw.js`) and Web Manifest (`public/manifest.json`)
  - FHIR R4 Bundle generation (`src/utils/fhirConverter.ts`)
  - PDF Clinical Report export via `jspdf` and `jspdf-autotable`
  - Offline 300+ Indian medicine database & interaction resolver (`src/data/indianMedicines.ts`)

### AI Architecture (Secure Server-Side Proxy)
- Managed by `src/services/aiProxyService.ts` and `src/services/medicineVisionService.ts`:
  1. Primary: Authenticated backend/serverless proxy `POST /api/gemini-proxy` (keeps API keys and models strictly server-side).
  2. Fallback: Deterministic offline clinical responses for continuity without requiring network or client-side API keys.
  3. Security: Gemini credentials reside exclusively on the server (`GEMINI_API_KEY`). Zero Gemini API keys exist in the client bundle.

### Backend & API
- **Express Backend** (`backend/src/`):
  - Entry point: `backend/src/index.js` (HTTP + `express-ws` WebSocket server on port 3005).
  - App setup: `backend/src/app.js` with security headers, request IDs, rate limiting, and CORS.
  - Routes:
    - `/api/labs/*`: Gait, tremor, hyperventilation, and generic assessments (`backend/src/routes/labRoutes.js`).
    - `/api/features/*`: Symptoms, period logs, vaccinations, emergency contacts (`backend/src/routes/featureRoutes.js`).
    - `/api/google-fit/*`: Google Fit OAuth2 and fitness metric endpoints (`backend/src/routes/googleFitRoutes.js`).
    - `/api/gemini-proxy`: Proxy endpoint for Gemini 1.5 Flash.
    - `/ws/tremor`: WebSocket feed for real-time tremor streaming.
- **Serverless API Routes** (`api/`):
  - Vercel serverless functions mirroring key endpoints (`api/gemini-proxy.js`, `api/body-temperature.js`, `api/google-fit/*`).

### Data Persistence
- **Client-Side**: `localStorage` stores ABHA profile, demo user session (`healthscan_demo_user`), settings, and cached clinical records. Demo mode seeds automatically on load (`src/services/demoDataSeeder.ts`).
- **Server-Side**: MongoDB via Mongoose (`backend/src/models/`):
  - `User`: Accounts and role-based access.
  - `Assessment`: Polymorphic clinical assessment records with risk levels (`low`, `moderate`, `high`, `critical`) and quality metrics.
  - `FeatureData`: Generic key-value logs for symptoms, period tracking, vaccinations, and predictions.
  - `EmergencyContact`: Contact directory, ICE metadata, and Medical ID.
  - `TremorAssessment`, `GaitAnalysisAssessment`, `HyperventilationAssessment`: Specialized biomechanical assessment models.

---

## Coding Conventions & Key Rules

1. **Safety & Zero-Hallucination for Clinical Code**:
   - Diagnostic heuristics and drug interactions must use deterministic algorithms (e.g., `src/services/medicineSafetyService.ts`), NOT unconstrained LLM outputs.
   - Clinical assessment scores must follow established medical scales (MDS-UPDRS, PHQ-9, GAD-7, Snellen, Rotterdam PCOS criteria).
2. **On-Device First**:
   - Sensor inputs (camera, microphone, touch, pose) must remain on-device. Never transmit raw video or audio frames to backend services.
3. **Graceful Fallbacks & Offline Support**:
   - The app must work seamlessly without Firebase credentials (demo mode fallback).
   - Core screening labs must function completely offline without internet or API keys.
4. **Imports & Aliases**:
   - Use `@/...` for path imports mapping to `src/...`.
5. **Modifications**:
   - Surgical edits: Avoid touching unrelated code or reformatting untouched sections.
   - Adhere to the global rules in `~/.claude/CLAUDE.md`.
