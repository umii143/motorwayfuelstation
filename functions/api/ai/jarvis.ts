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

    const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'VITE_GEMINI_API_KEY is not configured in Cloudflare Pages.' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const payload = {
      contents: messages,
      systemInstruction: systemInstruction,
      tools: tools ? [{ functionDeclarations: tools }] : undefined,
      generationConfig: {
        temperature: 0.2
      }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Failed to call Gemini API' }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      return new Response(JSON.stringify({ type: 'text', reply: "No response generated." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const parts = candidate.content?.parts || [];
    
    // Check for function call
    const functionCallPart = parts.find((p: any) => p.functionCall);
    if (functionCallPart) {
      return new Response(JSON.stringify({
        type: 'function_call',
        functionName: functionCallPart.functionCall.name,
        functionArgs: functionCallPart.functionCall.args
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Check for text
    const textPart = parts.find((p: any) => p.text);
    if (textPart) {
      return new Response(JSON.stringify({
        type: 'text',
        reply: textPart.text
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
