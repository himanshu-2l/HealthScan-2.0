import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Proxy — Server-side only.
 * All AI requests route through here so the API key never reaches the client.
 * Supports: symptom-check, chat, bp-chat, doctor-report, health-predictions, recommendations
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: 'Missing type or payload' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt;

    switch (type) {
      case 'symptom-check':
        prompt = buildSymptomCheckPrompt(payload);
        break;
      case 'chat':
        prompt = payload.prompt;
        break;
      case 'bp-chat':
        prompt = payload.prompt;
        break;
      case 'doctor-report':
        prompt = payload.prompt;
        break;
      case 'health-predictions':
        prompt = payload.prompt;
        break;
      case 'recommendations':
        prompt = payload.prompt;
        break;
      default:
        return res.status(400).json({ error: `Unknown request type: ${type}` });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid or empty prompt' });
    }

    // Limit prompt length to prevent abuse
    if (prompt.length > 15000) {
      return res.status(400).json({ error: 'Prompt too long (max 15000 chars)' });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // For symptom-check, try to parse and validate JSON response
    if (type === 'symptom-check') {
      try {
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
        else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
        if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
        cleanedText = cleanedText.trim();

        const parsed = JSON.parse(cleanedText);
        return res.status(200).json({ result: parsed });
      } catch (parseErr) {
        // Retry once on parse failure
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
        } catch (retryErr) {
          return res.status(502).json({ error: 'AI returned invalid response format. Please try again.' });
        }
      }
    }

    return res.status(200).json({ result: text });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
}

function buildSymptomCheckPrompt(payload) {
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
