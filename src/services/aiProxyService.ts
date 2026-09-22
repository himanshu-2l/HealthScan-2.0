import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Universal AI Caller for HealthScan.
 * 1. Tries the /api/gemini-proxy endpoint (local dev backend / Express).
 * 2. If unavailable or fails (e.g. static CDN Vercel deployment), falls back seamlessly
 *    to direct client-side Google Generative AI using VITE_GEMINI_API_KEY.
 */

function buildSymptomCheckPrompt(payload: any): string {
  const { bodyArea, symptoms, duration, severity } = payload;
  return `You are a medical information assistant. Based on the following symptoms, provide a structured analysis. This is NOT a diagnosis - only general health information.

Body Area: ${bodyArea || 'Not specified'}
Symptoms: ${symptoms || 'Not specified'}
Duration: ${duration || 'Not specified'}
Severity: ${severity || 'Not specified'}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "possibleConditions": [
    {
      "name": "Condition name",
      "likelihood": "High" | "Medium" | "Low",
      "description": "Brief description of the condition"
    }
  ],
  "riskLevel": "Low" | "Moderate" | "High" | "Urgent",
  "whenToSeeDoctor": ["Reason 1", "Reason 2"],
  "selfCareTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Provide 2-4 possible conditions, 2-4 reasons to see a doctor, and 3-5 self-care tips. Be informative but always recommend consulting a healthcare professional.`;
}

export async function callAIProxy(type: string, payload: any): Promise<any> {
  // Strategy 1: Attempt /api/gemini-proxy
  try {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.result !== undefined) {
          return data.result;
        }
      }
    }
  } catch (proxyError) {
    console.warn('[AI Service] /api/gemini-proxy unreachable, falling back to client-side Gemini:', proxyError);
  }

  // Strategy 2: Direct Client-Side Fallback via GoogleGenerativeAI
  const apiKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null);

  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY or configure your API key in Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let prompt = '';
  switch (type) {
    case 'symptom-check':
      prompt = buildSymptomCheckPrompt(payload);
      break;
    case 'chat':
    case 'bp-chat':
    case 'doctor-report':
    case 'health-predictions':
    case 'recommendations':
      prompt = payload?.prompt || '';
      break;
    default:
      prompt = typeof payload === 'string' ? payload : (payload?.prompt || JSON.stringify(payload));
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt provided for AI analysis');
  }

  const result = await model.generateContent(prompt);
  const resp = await result.response;
  const text = resp.text();

  if (type === 'symptom-check') {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
    else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
    if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
    return JSON.parse(cleanedText.trim());
  }

  return text;
}
