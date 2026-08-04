import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { validatePromptInput, validateResponseContent } from '../src/services/ai/aiGuardrails';
import { EnterpriseDecisionEngine } from '../src/services/ai/EnterpriseDecisionEngine';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userMessage, conversationHistory = [], contextData = {} } = req.body;
  if (!userMessage) return res.status(400).json({ error: 'User message is required.' });

  // 1. Prompt Injection Guardrail
  const promptCheck = validatePromptInput(userMessage);
  if (!promptCheck.allowed) {
    return res.status(200).json({
      reply: `⚠️ **Security Alert:** ${promptCheck.reason}`,
      safeMode: true
    });
  }

  const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // Startup Validation: Safe Mode if environment variables are unconfigured
  if (!groqApiKey && !geminiApiKey) {
    const decision = EnterpriseDecisionEngine.process(contextData, userMessage);
    return res.status(200).json({
      reply: `⚠️ **AI Cloud Gateway: Safe Mode Enabled**\n\n*GROQ_API_KEY / GEMINI_API_KEY not configured on server env.*\n\n${decision.summary}\n\n**Findings:**\n${decision.findings.join('\n')}`,
      safeMode: true,
      decisionPackage: decision
    });
  }

  const startTime = Date.now();
  let providerUsed = 'Offline Engine';
  let rawReply = '';

  // 2. Groq Primary Provider Router
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const messages: any[] = [
        { role: 'system', content: systemPrompt || 'You are FuelPro AI, an enterprise fuel station business assistant.' }
      ];
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      }
      messages.push({ role: 'user', content: userMessage });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 1024,
      });

      rawReply = response.choices[0]?.message?.content || '';
      providerUsed = 'Groq (llama-3.3-70b)';
    } catch (err: any) {
      console.warn('[AI Gateway] Groq call error:', err?.message);
    }
  }

  // 3. Gemini Fallback Provider Router
  if (!rawReply && geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const contents: any[] = [];
      if (systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will act as FuelPro AI.' }] });
      }
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { temperature: 0.2, maxOutputTokens: 1024 }
      });

      rawReply = response.text || '';
      providerUsed = 'Gemini (2.0-flash)';
    } catch (err: any) {
      console.warn('[AI Gateway] Gemini call error:', err?.message);
    }
  }

  // 4. Response Validation & Provenance Enrichment
  const validated = validateResponseContent(rawReply, ['tanks', 'inventory', 'shifts', 'sales', 'ledger', 'suppliers']);
  const decisionPackage = EnterpriseDecisionEngine.process(contextData, userMessage, validated.text);

  const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const provenanceFooter = `\n\n---\n**Response Provenance:**\n${decisionPackage.sources.join('  ')}\n**Timestamp:** ${timestampStr} UTC  |  **Provider:** ${providerUsed}  |  **Confidence:** ${validated.confidence}%`;

  const finalReply = validated.text + provenanceFooter;

  return res.status(200).json({
    reply: finalReply,
    decisionPackage,
    latencyMs: Date.now() - startTime,
    providerUsed,
    confidence: validated.confidence
  });
}
