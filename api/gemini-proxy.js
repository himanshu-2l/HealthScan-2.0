import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../backend/src/config/jwt.js';

/**
 * Gemini AI Proxy — Server-side only.
 * All AI requests route through here so the API key never reaches the client.
 * Supports: symptom-check, chat, bp-chat, doctor-report, health-predictions, recommendations, medicine-vision
 */

const MEDICINE_VISION_PROMPT = `You are a clinical OCR and pharmaceutical vision extraction engine.
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

const CHAT_SYSTEM_GUARDRAIL = `You are the HealthScan Clinical Screening Assistant. Your purpose is strictly limited to explaining health screening metrics, interpreting vital signs and lab results, and providing general wellness information.
CRITICAL INSTRUCTION: If the user asks about anything unrelated to health, medicine, biology, wellness, or clinical screening, politely decline and state that you are exclusively trained to assist with HealthScan health and medical topics.
Never provide definitive medical diagnoses or prescribe medications. Always advise consulting a licensed physician.

User Query: `;

const BP_SYSTEM_GUARDRAIL = `You are the HealthScan Blood Pressure Analysis Assistant. Your purpose is strictly limited to cardiovascular health, blood pressure readings, hypertension management, and heart wellness.
CRITICAL INSTRUCTION: If the user asks about anything unrelated to blood pressure, cardiovascular health, or wellness, politely decline and state that you are exclusively trained to assist with blood pressure and cardiovascular health topics.
Never provide definitive medical diagnoses or prescribe medications. Always advise consulting a licensed physician.

User Query: `;

/**
 * Verify request authentication
 * Accepts either pre-authenticated req.user (from Express requireAuth)
 * or validates the Authorization Bearer JWT directly.
 */
function authenticateRequest(req) {
  if (req.user) {
    return req.user;
  }

  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return null;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const jwtSecret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Fail closed if JWT_SECRET is missing in any environment (including Vercel)
  getJwtSecret();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enforce authentication
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required to access AI services'
    });
  }

  // Validate request body
  const { type, payload } = req.body || {};

  if (!type || !payload) {
    return res.status(400).json({ error: 'Missing type or payload' });
  }

  // Pre-validate medicine-vision payload format
  if (type === 'medicine-vision') {
    const { image } = payload;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing image payload' });
    }

    const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
    }

    const base64Data = match[2];
    // Enforce 7MB base64 cap (~5MB raw image) to avoid memory denial-of-service
    if (base64Data.length > 7 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image size exceeds maximum allowed limit (5MB)' });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Handle medicine-vision (multimodal image analysis)
    if (type === 'medicine-vision') {
      const match = payload.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      const mimeType = match[1];
      const base64Data = match[2];

      const visionResult = await model.generateContent([
        MEDICINE_VISION_PROMPT,
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        }
      ]);

      const responseText = visionResult.response.text().trim();
      const cleanedJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanedJson);
      return res.status(200).json({ result: parsed });
    }

    let prompt;

    switch (type) {
      case 'symptom-check':
        prompt = buildSymptomCheckPrompt(payload);
        break;
      case 'chat':
        prompt = typeof payload.prompt === 'string' ? CHAT_SYSTEM_GUARDRAIL + payload.prompt : '';
        break;
      case 'bp-chat':
        prompt = typeof payload.prompt === 'string' ? BP_SYSTEM_GUARDRAIL + payload.prompt : '';
        break;
      case 'doctor-report':
      case 'health-predictions':
      case 'recommendations':
        prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
        break;
      default:
        return res.status(400).json({ error: `Unknown request type: ${type}` });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid or empty prompt' });
    }

    // Limit prompt length to 5000 characters to prevent abuse
    if (prompt.length > 5000) {
      return res.status(400).json({ error: 'Prompt too long (max 5000 chars)' });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // For symptom-check, parse and return validated JSON
    if (type === 'symptom-check') {
      try {
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
        else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
        if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
        cleanedText = cleanedText.trim();

        const parsed = JSON.parse(cleanedText);
        return res.status(200).json({ result: parsed });
      } catch {
        // Fallback retry with JSON formatting instruction
        try {
          const retryResult = await model.generateContent(prompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown formatting.');
          const retryResponse = await retryResult.response;
          let retryText = retryResponse.text().trim();
          if (retryText.startsWith('```json')) retryText = retryText.slice(7);
          else if (retryText.startsWith('```')) retryText = retryText.slice(3);
          if (retryText.endsWith('```')) retryText = retryText.slice(0, -3);
          retryText = retryText.trim();

          const retryParsed = JSON.parse(retryText);
          return res.status(200).json({ result: retryParsed });
        } catch {
          return res.status(502).json({ error: 'AI returned invalid response format. Please try again.' });
        }
      }
    }

    return res.status(200).json({ result: text });
  } catch (error) {
    // Log error message safely without leaking tokens, keys, medical metrics, or base64 images
    console.error(`[AI Proxy Error - type: ${type}]:`, error.message || 'Unknown error');
    return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
}

function buildSymptomCheckPrompt(payload) {
  const { bodyArea, symptoms, duration, severity } = payload || {};

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
