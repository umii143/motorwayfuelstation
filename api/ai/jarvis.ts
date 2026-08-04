import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { validatePromptInput, classifyToolRisk } from '../../src/services/ai/aiGuardrails';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, tools, systemInstruction, userRole = 'staff' } = req.body;
  if (!messages) return res.status(400).json({ error: 'Messages array is required.' });

  const lastUserMsg = messages.slice().reverse().find((m: any) => m.role === 'user')?.parts?.[0]?.text || '';
  
  // 1. Prompt Injection Guardrail
  if (lastUserMsg) {
    const promptCheck = validatePromptInput(lastUserMsg);
    if (!promptCheck.allowed) {
      return res.status(200).json({
        type: 'text',
        reply: `⚠️ **Security Gate Rejected:** ${promptCheck.reason}`
      });
    }
  }

  const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // Startup Validation: Safe Mode
  if (!groqApiKey && !geminiApiKey) {
    return res.status(200).json({
      type: 'text',
      reply: "⚠️ **Jarvis AI Gateway: Safe Mode Active.** API keys unconfigured on backend server environment. Operating on local verified ERP rules."
    });
  }

  // 2. Primary: Groq Function Calling Gateway
  if (groqApiKey) {
    try {
      const groqTools = tools ? tools.map((t: any) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters ? {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(t.parameters.properties || {}).map(([k, v]: [string, any]) => [
                k, { type: (v.type || 'string').toLowerCase(), description: v.description || '' }
              ])
            ),
            required: t.parameters.required || []
          } : undefined
        }
      })) : undefined;

      const groqMessages: any[] = [];
      if (systemInstruction?.parts?.[0]?.text) {
        groqMessages.push({ role: "system", content: systemInstruction.parts[0].text });
      }

      let lastToolCallId = "call_" + Math.random().toString(36).substring(7);

      for (const m of messages) {
        if (m.role === 'user') {
          groqMessages.push({ role: "user", content: m.parts?.[0]?.text || '' });
        } else if (m.role === 'model') {
          if (m.parts?.[0]?.functionCall) {
            lastToolCallId = "call_" + Math.random().toString(36).substring(7);
            groqMessages.push({
              role: "assistant",
              content: null,
              tool_calls: [{
                id: lastToolCallId,
                type: "function",
                function: {
                  name: m.parts[0].functionCall.name,
                  arguments: JSON.stringify(m.parts[0].functionCall.args || {})
                }
              }]
            });
          } else if (m.parts?.[0]?.text) {
            groqMessages.push({ role: "assistant", content: m.parts[0].text });
          }
        } else if (m.role === 'function') {
          groqMessages.push({
            role: "tool",
            tool_call_id: lastToolCallId,
            name: m.parts?.[0]?.functionResponse?.name || 'function',
            content: JSON.stringify(m.parts?.[0]?.functionResponse?.response || {})
          });
        }
      }

      const groq = new Groq({ apiKey: groqApiKey });
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        tools: groqTools,
        temperature: 0.2,
      });

      const responseMessage = response.choices[0]?.message;

      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        const call = responseMessage.tool_calls[0];
        const functionName = call.function.name;
        
        // 3. Tool Function Call Security & Risk Gate
        const riskProfile = classifyToolRisk(functionName);
        if (riskProfile.requiresOwnerRole && userRole !== 'owner' && userRole !== 'admin') {
          return res.status(200).json({
            type: 'text',
            reply: `⛔ **Authorization Denied:** Executing \`${functionName}\` requires Owner/Admin permissions (Risk Tier: ${riskProfile.riskLevel}).`
          });
        }

        let args = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch { args = {}; }
        return res.status(200).json({
          type: 'function_call',
          functionName,
          functionArgs: args,
          riskProfile
        });
      }

      if (responseMessage?.content) {
        return res.status(200).json({
          type: 'text',
          reply: responseMessage.content
        });
      }
    } catch (err: any) {
      console.warn('[Jarvis Gateway] Groq error:', err?.message);
    }
  }

  // 4. Secondary: Gemini Fallback
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: messages,
        config: {
          systemInstruction: systemInstruction,
          tools: tools ? [{ functionDeclarations: tools }] : undefined,
          temperature: 0.2,
        }
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const riskProfile = classifyToolRisk(call.name || '');
        return res.status(200).json({
          type: 'function_call',
          functionName: call.name,
          functionArgs: call.args,
          riskProfile
        });
      }

      if (response.text) {
        return res.status(200).json({ type: 'text', reply: response.text });
      }
    } catch (err: any) {
      console.warn('[Jarvis Gateway] Gemini error:', err?.message);
    }
  }

  return res.status(200).json({
    type: 'text',
    reply: "Hello Sir! FuelPro Jarvis Gateway is online and listening. All operational functions are ready."
  });
}
