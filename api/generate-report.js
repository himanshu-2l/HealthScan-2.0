import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metrics, note } = req.body;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (!metrics) {
      return res.status(400).json({ 
        error: 'Metrics data is required' 
      });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Generate a clinical-style report based on the following motor skills assessment data.
      Explain the results, potential clinical implications, and recommended next steps in plain English for a patient.

      Metrics:
      - Finger Taps: ${metrics.fingerTaps}
      - Test Duration: ${metrics.testDuration.toFixed(1)}s
      - Tap Rate: ${metrics.tapRate.toFixed(2)} taps/sec
      - Coordination Score: ${metrics.coordinationScore}%
      - Movement Quality (0-100): ${metrics.movementQuality}
      - Estimated Tremor Frequency: ${metrics.tremorFreq.toFixed(2)} Hz
      - Tremor Amplitude (normalized): ${metrics.tremorAmpPercent.toFixed(3)}%

      Patient Note: ${note || 'No additional notes provided.'}

      Structure the report with the following sections:
      1.  **Summary of Results**: Briefly explain what each metric means and the patient's score.
      2.  **Interpretation**: What do these results suggest about the patient's motor function?
      3.  **Recommendations**: What are the suggested next steps? (e.g., "Consult a neurologist for a formal evaluation," "Repeat the test in 3 months," "No immediate concerns.").
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      report: text 
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
}

