# Medicine Lens — Implementation Specification

## Goal
Add a patient-facing Medicine Lens to the existing healthcare web application. A user can photograph/upload a medicine box, blister strip, prescription, or readable label and receive a verified, easy-to-understand explanation in English, Hindi, Hinglish, or another supported language, with optional voice playback.

The feature is an educational medicine-information and safety-assistance layer, not an autonomous prescriber. It must never infer that a medicine is personally safe merely from age or image recognition.

## Core UX
1. User chooses Camera / Upload.
2. Accept medicine box, blister strip, prescription, barcode/QR, or clear label. Loose-pill-only recognition is lower confidence and must be explicitly marked as such.
3. Run image quality checks: blur, glare, crop, text visibility, orientation.
4. Detect barcode/QR when present and OCR visible text.
5. Extract candidates: brand, generic/salt, strength, dosage form, manufacturer, pack text and prescription directions if visible.
6. Resolve Indian brand names to normalized ingredients using deterministic lookup before any generative explanation.
7. Show candidate confirmation when confidence is insufficient. Never silently choose between ambiguous medicines.
8. Retrieve structured medicine information from trusted data sources.
9. If the user voluntarily provides age, allergies, pregnancy status, relevant conditions, kidney/liver issues, and current medicines, run explicit safety/interaction checks. Do not turn missing information into assumptions.
10. Generate a plain-language explanation grounded in retrieved data.
11. Translate/localize after the medical facts are established.
12. Optional TTS reads the explanation aloud.

## Result Contract
Return structured data first, then render UI. Suggested schema:

```ts
interface MedicineLensResult {
  identification: {
    status: 'identified' | 'possible_matches' | 'unidentified';
    confidence: number;
    brandName?: string;
    genericIngredients: Array<{name: string; strength?: string}>;
    dosageForm?: string;
    manufacturer?: string;
    alternatives?: Array<{name: string; confidence: number}>;
    evidence: string[];
  };
  education?: {
    medicineClass?: string;
    commonUses: string[];
    commonSideEffects: string[];
    importantWarnings: string[];
    contraindications: string[];
    prescriptionStatus?: string;
    storage?: string;
  };
  personalizedSafety?: {
    evaluated: boolean;
    missingContext: string[];
    allergyWarnings: string[];
    interactionWarnings: Array<{drug: string; severity?: string; explanation: string}>;
    ageConsiderations: string[];
    pregnancyConsiderations: string[];
    kidneyLiverConsiderations: string[];
  };
  sources: Array<{title: string; url?: string; retrievedAt?: string}>;
  limitations: string[];
  nextSteps: string[];
}
```

## Architecture

```text
Camera / Upload
      ↓
Image validation + preprocessing
      ↓
Barcode/QR ─┐
OCR/Vision ─┼→ Candidate extraction
             ↓
      Medicine resolver
      (exact → normalized → FTS/fuzzy → external normalization)
             ↓
      Structured drug knowledge
             ↓
      Deterministic safety layer
      ├─ allergies
      ├─ interactions
      ├─ age-labelled information
      ├─ contraindication flags
      └─ profile/context completeness
             ↓
      Evidence-grounded explanation
             ↓
      Localization
             ↓
      TTS + UI
```

Keep recognition, medicine resolution, safety rules, explanation, translation and audio as separate modules/services. Do not create one giant prompt that performs all tasks.

## Data Strategy
For India, maintain a local indexed brand → composition layer for fast identification. Community/open datasets can help with brand resolution but must not become the sole authority for dosing, contraindications, interactions, pregnancy safety, or emergency decisions.

Preferred resolution order:
1. Curated corrections/overrides maintained by this project.
2. Exact normalized brand/ingredient match.
3. Local indexed Indian medicine dataset.
4. Full-text/fuzzy candidate search.
5. RxNorm/RxNav or another normalization source where applicable.
6. Ask user to confirm among candidates.
7. Abstain if identity cannot be established.

For authoritative explanatory data, use official/structured labeling where available (for example DailyMed/openFDA/RxNorm), while clearly accounting for jurisdiction differences. Do not imply US labeling automatically represents Indian regulatory labeling.

## Safety Rules — Non-Negotiable
- Never output `This medicine is safe/good for you` based on age alone.
- Never invent dose, duration, frequency, indication, diagnosis or prescription instructions.
- Never infer missing allergies/conditions as `none`.
- Never allow an LLM to fabricate an interaction because the deterministic lookup returned nothing.
- Separate `no interaction found in available data` from `no interaction exists`.
- For ambiguous recognition, require confirmation.
- For emergency red flags, tell the user to seek appropriate urgent medical care rather than continuing an AI workflow.
- Prescription image text and medicine identity must remain visually distinguishable from AI explanations.
- Every result shows Sources, Confidence/identification status, Limitations, and Next steps.
- Treat uploaded prescriptions/medical information as sensitive data: minimize retention, protect transport/storage, enforce access control, and avoid logging raw clinical content unnecessarily.

## UI Components
Create components consistent with the existing design system rather than copying reference-project UI.

Suggested components:
- `MedicineLensEntry`
- `MedicineCapture`
- `ImageQualityFeedback`
- `MedicineCandidateSelector`
- `MedicineIdentityCard`
- `WhatItIsForCard`
- `SafetyWarningsCard`
- `InteractionCard`
- `ProfileContextCard`
- `SourcesDrawer`
- `VoiceControls`
- `ConfidenceBadge`
- `LimitationsNotice`

Support mobile camera capture and desktop upload. Preserve accessibility, keyboard navigation and screen-reader labels.

## Voice + Language
Medical facts must be generated/validated before translation. Translation must preserve medicine names, strengths, units, negations, severity and uncertainty. Provide English, Hindi and Hinglish first; add more languages through the existing localization architecture. TTS must read the final validated localized text rather than independently regenerate it.

## Testing
Add unit, integration and adversarial tests for:
- clear blister strip
- crumpled/glare-heavy strip
- similar brand names
- fixed-dose combinations
- multiple medicines in one prescription
- handwritten/partially readable prescription
- incorrect OCR strength
- loose unidentified pill
- allergy match
- duplicate active ingredient
- known interaction
- missing patient context
- child/elderly age context
- translation preserving strength and negation
- prompt injection printed inside uploaded image
- malicious filename/metadata
- unsupported image
- model/data-source timeout
- hallucination/unsupported-claim checks

Build an evaluation set from legally usable/de-identified examples and track identification precision, candidate recall, false confident identification rate, safety-rule precision/recall, source-grounding rate, localization fidelity and latency.

## Open-Source References — Study/Clone in a Separate Workspace
These repositories are references for architecture, algorithms, testing patterns and implementation ideas. Before reusing code, inspect each license and preserve all obligations. Do not remove attribution/license notices when a license requires them. Do not copy project branding, README wording, UI identity, package names, comments, or repository names into the application. The production code should use this project's own neutral domain terminology.

### Primary prescription/medicine architecture
Clone:
```bash
git clone https://github.com/dwivedialok/medication-companion.git
```
Reference:
https://github.com/dwivedialok/medication-companion

Study especially its separation of prescription reading, deterministic brand resolution, interaction/safety logic, patient education, localization/TTS, guardrails, typed tools, behavioral specs, tests and data-index build process. Its repository is MIT licensed at the time this specification was prepared; verify the current license before reuse.

### Indian medicine data/API reference
```bash
git clone https://github.com/miqbal303/india-medicine-api.git
```
Reference:
https://github.com/miqbal303/india-medicine-api

Use as a reference for Indian medicine search/resolution and API organization. Verify dataset provenance and licensing independently before shipping any bundled data.

### Indian medicine dataset reference
```bash
git clone https://github.com/junioralive/Indian-Medicine-Dataset.git
```
Reference:
https://github.com/junioralive/Indian-Medicine-Dataset

Use primarily for brand/composition resolution experiments, not as an authoritative clinical-safety source. Verify data and license before redistribution.

### OCR references
```bash
git clone https://github.com/PaddlePaddle/PaddleOCR.git
git clone https://github.com/JaidedAI/EasyOCR.git
git clone https://github.com/tesseract-ocr/tesseract.git
```
References:
- https://github.com/PaddlePaddle/PaddleOCR
- https://github.com/JaidedAI/EasyOCR
- https://github.com/tesseract-ocr/tesseract

Benchmark OCR engines on real Indian medicine packaging rather than selecting one by popularity.

### Structured drug-information services
- RxNorm/RxNav: https://lhncbc.nlm.nih.gov/RxNav/
- DailyMed API: https://dailymed.nlm.nih.gov/dailymed/webservices-help/v2/
- openFDA Drug APIs: https://open.fda.gov/apis/drug/

## Integration Rules for the Coding Agent
1. Inspect the existing repository first: stack, routing, auth, database, state management, component library, API conventions, tests and deployment.
2. Do not rewrite unrelated modules or introduce a parallel design system.
3. Create a feature branch/module that fits existing conventions.
4. Clone references outside the production source tree, e.g. `.reference-repos/` excluded by `.gitignore`, or another temporary workspace.
5. Produce a short internal architecture comparison before coding: what can be reused conceptually, what can legally be reused directly, and what should be reimplemented.
6. Check licenses/dependencies before copying any code. Preserve legally required notices. If compatibility is uncertain, reimplement the concept.
7. Production identifiers must describe the domain (`medicineResolver`, `interactionService`, etc.), not the reference repository.
8. Do not leave reference repository names/branding in UI, routes, API names, comments, analytics, prompts or application copy. Legal attribution files required by licenses are the exception and must not be hidden.
9. Prefer deterministic code for identification, normalization, interactions and policy gates; use generative models for extraction where useful and patient-friendly explanation.
10. Add tests before marking the feature complete.
11. Do not expose the feature as clinically validated unless actual validation/regulatory work supports that claim.

## Definition of Done
- Camera/upload works responsively.
- Medicine identity has confidence/ambiguity handling.
- Indian brand → generic resolution works with a tested local/indexed path.
- Safety logic is separated from free-form generation.
- Profile information is optional and missing fields are explicit.
- English/Hindi/Hinglish explanations work.
- Voice playback works.
- Sources + limitations + next steps are visible.
- Sensitive-data handling follows the existing application's privacy architecture.
- Tests and evaluation fixtures pass.
- No reference-project branding appears in product-facing code/UI.
- Third-party license obligations are satisfied.
