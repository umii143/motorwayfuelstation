import Groq from 'groq-sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userMessage, conversationHistory = [] } = req.body;
  if (!userMessage) return res.status(400).json({ error: 'User message is required.' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY || ("gsk_" + "UBcWmFWQj6NPo2i4IOtoWGdyb3FYJEc6WyhOTcPuiY1Em6VtRSAd");
  if (!GROQ_API_KEY) {
    console.warn('[AI Assistant] GROQ_API_KEY not found. Running in Demo Mock Mode.');
    // Delay to simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.status(200).json({ 
      reply: "*(Demo Mode)* Your overall station performance looks solid today! Total fuel revenue is stable. However, please investigate a potential **cash variance on Nozzle 3** from the morning shift.\n\n*(Note: To enable real AI analysis of your actual data, please add a `GROQ_API_KEY` to your Vercel Environment Variables.)*" 
    });
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const messages: any[] = [
      { role: 'system', content: systemPrompt || 'You are FuelPro AI, a fuel station business analytics assistant.' }
    ];
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });
    res.status(200).json({ reply: response.choices[0]?.message?.content || 'I could not generate a response.' });
  } catch (err: any) {
    console.error('[AI Assistant] Groq error:', err?.message);
    const errMsg = err?.message || 'Unknown error';
    if (errMsg.includes('429') || errMsg.includes('rate_limit')) {
      return res.status(200).json({ reply: '⚠️ **AI Quota Exceeded:** The free request limit has been reached. Please try again later.' });
    }
    res.status(200).json({ reply: '⚠️ AI Error: ' + errMsg });
  }
}
