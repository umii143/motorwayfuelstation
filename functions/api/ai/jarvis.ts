import { GoogleGenAI } from '@google/genai';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { messages, tools, systemInstruction } = body;

    if (!messages) {
      return new Response(JSON.stringify({ error: 'Messages array is required.' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Cloudflare passes environment variables in context.env
    const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'VITE_GEMINI_API_KEY is not configured in Cloudflare Pages.' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

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
      return new Response(JSON.stringify({
        type: 'function_call',
        functionName: call.name,
        functionArgs: call.args
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (response.text) {
      return new Response(JSON.stringify({
        type: 'text',
        reply: response.text
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ type: 'text', reply: "I'm sorry, I couldn't generate a valid response." }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error('[Jarvis] Error generating content:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process Jarvis request' }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
