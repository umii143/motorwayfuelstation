import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, tools, systemInstruction } = req.body;
  if (!messages) return res.status(400).json({ error: 'Messages array is required.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
        temperature: 0.2, // Low temperature for factual ERP data
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      return res.status(200).json({
        type: 'function_call',
        functionName: call.name,
        functionArgs: call.args
      });
    }

    if (response.text) {
      return res.status(200).json({
        type: 'text',
        reply: response.text
      });
    }

    return res.status(200).json({ type: 'text', reply: "I'm sorry, I couldn't generate a valid response." });
  } catch (error: any) {
    console.error('[Jarvis] Error generating content:', error);
    res.status(500).json({ error: error.message || 'Failed to process Jarvis request' });
  }
}
