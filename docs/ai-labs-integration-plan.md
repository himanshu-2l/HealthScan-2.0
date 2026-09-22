# AI Labs Integration Plan: Medicine Lens

## 1. Architectural Audit & System State

### 1.1 Existing Application Architecture
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
- **Routing**: `src/App.tsx` contains modular lazy-loaded routes for clinical labs under `/labs/*` (Cardiovascular, Motor, Voice, Eye, Gait, Mental Health, Vision/Hearing).
- **Backend**: Express ES module server at `backend/src/` with Gemini 1.5 integration (`@google/generative-ai`), strict security headers, and rate-limiting.
- **Patient Context**: `src/services/patientProfileService.ts` maintains active medications, documented allergies with severity, conditions/history, age/DOB, and gender in local persistent storage.
- **Styling System**: Clean Swiss / Apple Health aesthetic with slate borders, muted badge tones, high-contrast readable typography, and strict rejection of AI rainbow styling.

### 1.2 Open Source Reference License Audit & Attribution

| Repository | Source URL | License | Permitted Use | Direct Code Reuse vs Reimplementation |
|---|---|---|---|---|
| **Medication Companion** | `https://github.com/dwivedialok/medication-companion` | MIT License (2026 Alok Dwivedi) | Permitted with copyright notice | Conceptual reuse: Decoupled multi-stage pipeline, deterministic normalization patterns (British-US salt folding, suffix stripping, combo splitting), interaction severity ranking. Reimplemented cleanly in TypeScript with zero Flutter/Python dependencies. |
| **Indian-Medicine-Dataset** | `https://github.com/junioralive/Indian-Medicine-Dataset` | MIT License (2024 JuniorAlive) | Permitted with copyright notice | Curated data extraction: Top Indian brand-to-composition and manufacturer records compiled into an in-memory indexed dictionary (`src/data/indianMedicines.ts`). |
| **India-Medicine-API** | `https://github.com/miqbal303/india-medicine-api` | MIT License / Open | Permitted | Search & substitute reference patterns. Reimplemented in local TypeScript indexing. |

*Production Guarantee*: All production code, route names, comments, and identifiers use neutral domain terminology (`medicineResolverService`, `medicineSafetyService`, `MedicineLensLab`), never embedding third-party branding.

---

## 2. Decoupled Pipeline Architecture

```text
[ Blister Strip / Box / Label Image / Prescription ]
                         │
                         ▼
             [ 1. Image Quality Guard ]
        (Blur, Glare, Resolution, Edge Crop)
                         │
                         ▼
             [ 2. OCR / Vision Extractor ]
       (Gemini Multimodal with Strict JSON Schema)
        - Brand name, Salt/generics, Strength, Form
                         │
                         ▼
             [ 3. Medicine Resolver ]
         (Exact Normalized -> Fuzzy Candidate Search)
       - Local Indian pharmaceutical indexed database
       - Ambiguity detector (candidate selector if < 80% confidence)
                         │
                         ▼
         [ 4. Deterministic Safety Engine ]
     (NO LLM hallucinations - 100% deterministic rules)
       ├─ Active allergy matching (e.g. Penicillin allergy vs Amoxicillin)
       ├─ Drug-drug interaction matrix (HIGH / MODERATE / LOW)
       ├─ Duplicate ingredient detector (e.g. Paracetamol overdose risk)
       ├─ Age-specific warnings (Pediatric / Geriatric contraindications)
       └─ Profile completeness check (explicit missing context)
                         │
                         ▼
        [ 5. Grounded Educational Generator ]
       - Plain language summary grounded strictly in verified drug facts
       - What it is for, common side effects, storage, warnings
                         │
                         ▼
          [ 6. Medical-Grade Localization ]
       - Supported: English, Hindi (हिंदी), Hinglish
       - Preserves exact drug names, numeric strengths, and negations
                         │
                         ▼
       [ 7. Web Speech TTS & Clinical UI ]
       - Native browser Web Speech API (low latency, zero API cost)
       - Swiss / Apple Health card UI with confidence badge and disclaimers
```

---

## 3. Strict Safety & Non-Negotiable Rules

1. **No Prescriptive Language**: The system will NEVER output "This medicine is safe for you" or "You should take X mg". All outputs are educational.
2. **Deterministic Safety Checks**: Drug interactions and allergy conflicts are computed purely from verified chemical ingredients and known interaction tables. LLMs are never permitted to invent drug interactions or declare combinations "safe" when lookup misses.
3. **Explicit Context Handling**: Missing patient profile data (e.g., unknown kidney disease or unstated allergies) is never assumed to be negative. It is explicitly displayed as: *"Context not provided — verify with your pharmacist."*
4. **Ambiguity Gate**: If an image matches multiple Indian brands with low confidence (e.g., "Ciplox 500" vs "Ciplox-TZ"), the UI triggers `MedicineCandidateSelector` forcing the user to confirm the exact packaging.
5. **Red Flag Escalation**: Emergency symptoms or contraindications prompt immediate clinical referral cards.

---

## 4. Implementation Components

1. `src/types/medicineLens.ts`: Strict schema for `MedicineLensResult`, `DrugIdentity`, `InteractionWarning`, `SafetyEvaluation`.
2. `src/data/indianMedicines.ts`: Curated indexed database of top 300+ Indian brands, generic compositions, manufacturers, classes, and known interaction pairs.
3. `src/services/medicineResolverService.ts`: Pure normalization (stripping dosage tokens, salt suffixes, folding British/US spellings) + exact and fuzzy brand matching.
4. `src/services/medicineSafetyService.ts`: Cross-checks patient profile allergies, existing medications, and contraindications.
5. `src/services/medicineVisionService.ts`: Client/server Gemini 1.5 Flash vision extraction with fallback handling.
6. `src/services/medicineExplanationService.ts`: Grounded educational text generation and localization into English, Hindi, and Hinglish.
7. `src/utils/medicineTTS.ts`: Web Speech API wrapper with pause, resume, and voice pitch controls.
8. `src/components/labs/MedicineLensLab.tsx`: Full clinical UI matching HealthScan's Apple Health design.
9. Route integration in `src/App.tsx`, `src/pages/Labs.tsx`, and `src/pages/MobileAppView.tsx`.
