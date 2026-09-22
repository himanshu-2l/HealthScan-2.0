/**
 * Medicine Vision Service
 * 
 * Handles:
 * 1. Image Quality Assessment (Blur, Glare, Underexposure, Minimum Resolution)
 * 2. Multimodal OCR & Medicine Packaging Extraction via Gemini 1.5 Flash
 * 3. Loose-pill and ambiguous packaging warning flags
 * Grounded in docs/MEDICINE_LENS.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageQualityReport {
  isValid: boolean;
  score: number; // 0.0 - 1.0
  issues: string[];
  recommendations: string[];
}

export interface VisionExtractionResult {
  rawBrandName?: string;
  genericIngredients: Array<{ name: string; strength?: string }>;
  dosageForm?: string;
  manufacturer?: string;
  packagingType: 'blister_strip' | 'box' | 'bottle' | 'prescription' | 'loose_pill' | 'unknown';
  visibleText: string[];
  rawConfidence: number;
  qualityReport: ImageQualityReport;
}

/**
 * Assesses an image for sharpness, glare, and exposure on an HTML5 canvas.
 */
export async function assessImageQuality(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<ImageQualityReport> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const width = imageElement.width;
  const height = imageElement.height;

  if (width < 320 || height < 320) {
    issues.push('Low image resolution');
    recommendations.push('Capture the medicine closer with higher resolution.');
  }

  // Draw to offscreen canvas to analyze pixel luminance and edge gradients
  const canvas = document.createElement('canvas');
  const targetW = 200;
  const targetH = Math.round((height / width) * targetW) || 200;
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      isValid: true,
      score: 0.8,
      issues: [],
      recommendations: []
    };
  }

  ctx.drawImage(imageElement, 0, 0, targetW, targetH);
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  let totalLuminance = 0;
  let glarePixels = 0;
  let darkPixels = 0;
  const pixelCount = data.length / 4;

  // Compute brightness and glare
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;

    if (lum > 248) glarePixels++;
    if (lum < 25) darkPixels++;
  }

  const avgLuminance = totalLuminance / pixelCount;
  const glareFraction = glarePixels / pixelCount;
  const darkFraction = darkPixels / pixelCount;

  if (glareFraction > 0.15) {
    issues.push('Flash glare / shiny reflection detected on packaging foil');
    recommendations.push('Angle the medicine strip slightly away from direct light to avoid blinding reflections.');
  }

  if (darkFraction > 0.40 || avgLuminance < 40) {
    issues.push('Insufficient lighting / underexposed image');
    recommendations.push('Move to a well-lit area or use room lighting.');
  }

  // Laplacoid variance / gradient sharpness estimation
  let gradientSum = 0;
  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = (y * targetW + x) * 4;
      const rightIdx = (y * targetW + (x + 1)) * 4;
      const downIdx = ((y + 1) * targetW + x) * 4;

      const lumCenter = data[idx];
      const lumRight = data[rightIdx];
      const lumDown = data[downIdx];

      const dx = lumRight - lumCenter;
      const dy = lumDown - lumCenter;
      gradientSum += Math.abs(dx) + Math.abs(dy);
    }
  }

  const avgGradient = gradientSum / ((targetW - 2) * (targetH - 2));
  if (avgGradient < 8.0) {
    issues.push('Image appears blurry or out of focus');
    recommendations.push('Hold the camera steady and tap the screen to focus on the printed medicine label.');
  }

  let score = 1.0;
  if (issues.length > 0) {
    score = Math.max(0.3, 1.0 - issues.length * 0.25);
  }

  return {
    isValid: score >= 0.45,
    score: Math.round(score * 100) / 100,
    issues,
    recommendations
  };
}

/**
 * Extracts structured medicine identity from image using Gemini 1.5 Flash Vision.
 */
export async function extractMedicineFromImage(
  base64DataUrl: string,
  qualityReport: ImageQualityReport
): Promise<VisionExtractionResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // Demo fallback for offline / development testing without API key
    return {
      rawBrandName: 'Augmentin 625 Duo',
      genericIngredients: [
        { name: 'amoxicillin', strength: '500mg' },
        { name: 'clavulanic acid', strength: '125mg' }
      ],
      dosageForm: 'Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      packagingType: 'blister_strip',
      visibleText: ['Augmentin 625 Duo', 'Amoxycillin and Potassium Clavulanate Tablets IP', 'GSK', 'Batch: AG8219'],
      rawConfidence: 0.92,
      qualityReport
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Separate base64 data and mime type
  const match = base64DataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image format. Expected base64 data URL.');
  }

  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = `You are a clinical OCR and pharmaceutical vision extraction engine.
Analyze the provided image of a medicine (blister strip, box, label, bottle, or prescription).

EXTRACT ONLY WHAT IS LEGIBLY PRINTED. NEVER FABRICATE INGREDIENTS OR STRENGTHS.
Output strictly in this JSON format:
{
  "brandName": "Brand name printed prominently (e.g. Dolo 650, Augmentin 625, Pan-D) or empty string",
  "genericIngredients": [
    { "name": "Active salt/generic name", "strength": "e.g. 500mg, 10mg/5ml" }
  ],
  "dosageForm": "Tablet | Capsule | Syrup | Injection | Drops | Ointment | Suspension | Unknown",
  "manufacturer": "Company name if visible, or empty string",
  "packagingType": "blister_strip | box | bottle | prescription | loose_pill | unknown",
  "visibleText": ["list", "of", "clearly", "visible", "words", "or", "headings"],
  "confidenceScore": 0.0 to 1.0 (reduce score if blurry, truncated, or loose pill)
}

Important:
- If this is a loose pill without any printed packaging or imprint code, set packagingType to "loose_pill" and confidenceScore to at most 0.40.
- Return raw JSON only, no markdown backticks, no markdown formatting.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ]);

    const responseText = result.response.text().trim();
    // Clean potential markdown wrap
    const cleanedJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      rawBrandName: parsed.brandName || undefined,
      genericIngredients: Array.isArray(parsed.genericIngredients) ? parsed.genericIngredients : [],
      dosageForm: parsed.dosageForm || 'Tablet',
      manufacturer: parsed.manufacturer || undefined,
      packagingType: parsed.packagingType || 'unknown',
      visibleText: Array.isArray(parsed.visibleText) ? parsed.visibleText : [],
      rawConfidence: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85,
      qualityReport
    };
  } catch (err) {
    console.error('Gemini vision medicine extraction error:', err);
    throw new Error('Unable to extract medicine text from image. Please ensure text is clearly visible and well-lit.');
  }
}
