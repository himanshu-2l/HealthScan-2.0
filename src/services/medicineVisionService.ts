/**
 * Medicine Vision Service
 * 
 * Handles:
 * 1. Image Quality Assessment (Blur, Glare, Underexposure, Minimum Resolution)
 * 2. Multimodal OCR & Medicine Packaging Extraction via Gemini 1.5 Flash
 * 3. Loose-pill and ambiguous packaging warning flags
 * Grounded in docs/MEDICINE_LENS.md
 */

import { callAIProxy } from './aiProxyService';

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
 * Extracts structured medicine identity from image using the authenticated Gemini AI Proxy.
 */
export async function extractMedicineFromImage(
  base64DataUrl: string,
  qualityReport: ImageQualityReport
): Promise<VisionExtractionResult> {
  const result = await callAIProxy('medicine-vision', {
    image: base64DataUrl,
    qualityReport
  });

  if (!result.ok) {
    throw new Error('AI analysis unavailable, try again or consult a clinician');
  }

  const parsed = result.data;
  if (!parsed) {
    throw new Error('AI analysis unavailable, try again or consult a clinician');
  }

  return {
    rawBrandName: parsed.rawBrandName || parsed.brandName || undefined,
    genericIngredients: Array.isArray(parsed.genericIngredients) ? parsed.genericIngredients : [],
    dosageForm: parsed.dosageForm || 'Tablet',
    manufacturer: parsed.manufacturer || undefined,
    packagingType: parsed.packagingType || 'unknown',
    visibleText: Array.isArray(parsed.visibleText) ? parsed.visibleText : [],
    rawConfidence: typeof parsed.confidenceScore === 'number'
      ? parsed.confidenceScore
      : (typeof parsed.rawConfidence === 'number' ? parsed.rawConfidence : 0.85),
    qualityReport
  };
}
