

export interface AIResponse {
  rawResponse: string;
  formattedReceipt: string;
}

export interface AIBusinessInsight {
  recommendation: string;
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export type AIAssistantMode = 'chat' | 'analytics';

// Gemini REST API — works directly in browser without any SDK
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGeminiRest(
  apiKey: string,
  prompt: string,
  temperature = 0.3
): Promise<string> {
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export class AIAssistantService {
  private groqApiKey: string | null = null;
  private geminiApiKey: string | null = null;

  private activeProvider: 'groq' | 'gemini' | 'mock' = 'mock';

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Read keys from localStorage (user settings) or Vite env vars.
    // Both plain and VITE_-prefixed names are checked for compatibility.
    const groqKey =
      localStorage.getItem('VITE_GROQ_API_KEY') ||
      localStorage.getItem('GROQ_API_KEY') ||
      // @ts-ignore
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
      undefined;

    const geminiKey =
      localStorage.getItem('VITE_GEMINI_API_KEY') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      // @ts-ignore
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      undefined;

    // Prefer Groq first — it is explicitly designed for browser use.
    if (groqKey) {
      this.groqApiKey = groqKey;
      this.activeProvider = 'groq';
      console.info('[AIAssistantService] ✅ Groq provider active (via REST API).');
    } else if (geminiKey) {
      this.geminiApiKey = geminiKey;
      this.activeProvider = 'gemini';
      console.info('[AIAssistantService] ✅ Gemini provider active (via REST API).');
    } else {
      this.activeProvider = 'mock';
      console.warn(
        '[AIAssistantService] ⚠️ No API keys found. Running in Mock Mode.\n' +
        'Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY to your .env file.'
      );
    }
  }

  /** Call this after the user saves new API keys in Settings. */
  public reinitialize() {
    this.groqApiKey = null;
    this.geminiApiKey = null;
    this.activeProvider = 'mock';
    this.initializeClients();
  }

  private getSystemPrompt(contextData?: any, mode: AIAssistantMode = 'chat'): string {
    const dataContext = contextData
      ? `\n\n=== SYSTEM DATA CONTEXT ===\n${JSON.stringify(contextData)}\n===========================\n`
      : '';

    if (mode === 'analytics') {
      return `You are ShiftWizard AI, an expert Enterprise Assistant for a Fuel Station ERP.
      
      YOUR CRITICAL INSTRUCTION:
      You must respond ONLY with a valid JSON object. Do not include markdown formatting or any conversational text.
      The JSON object should have the following structure:
      {
        "summary": "Brief summary of the data",
        "insights": ["insight 1", "insight 2"],
        "metrics": {
          "totalSales": 10000,
          "inventoryAlerts": 2
        }
      }
      ${dataContext}`;
    }

    return `You are ShiftWizard AI, an expert Enterprise Assistant for a Fuel Station ERP built by Umar Ali.
    
    YOUR CRITICAL INSTRUCTION:
    You must format your final response to look EXACTLY like a physical printed thermal receipt using ASCII box-drawing characters and alignment.
    
    RULES:
    1. Always use 'PKR' for currency.
    2. Always use 'Liters' for volume.
    3. The receipt MUST be wrapped in an ASCII border.
    4. The header of the receipt MUST be "SHIFTWIZARD ERP".
    5. The footer of the receipt MUST be "Powered by Umar Ali ⚡".
    6. CRITICAL: NEVER hallucinate, make up, or use dummy data. If the SYSTEM DATA CONTEXT shows empty lists ([]), 0 sales, or no active shifts, YOU MUST state exactly that (e.g. "No sales recorded", "0 PKR"). DO NOT copy the example format's dummy numbers.
    7. Be concise, professional, and data-driven. Do not add markdown outside the ASCII box.
    ${dataContext}
    
    EXAMPLE FORMAT (STRUCTURE ONLY - DO NOT USE THESE NUMBERS):
    ┌──────────────────────────────────┐
    │          SHIFTWIZARD ERP         │
    │         Fuel Station AI          │
    ├──────────────────────────────────┤
    │ Date: 2026-06-10                 │
    │ Query: Low Stock Alert           │
    ├──────────────────────────────────┤
    │ ITEM                QTY          │
    │ (Your Data Here)                 │
    ├──────────────────────────────────┤
    │ STATUS: (Your Status Here)       │
    ├──────────────────────────────────┤
    │      Powered by Umar Ali ⚡      │
    └──────────────────────────────────┘
    `;
  }

  public async askQuestion(
    question: string,
    contextData?: any,
    mode: AIAssistantMode = 'chat'
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(contextData, mode);

    try {
      let content = '';

      if (this.activeProvider === 'groq' && this.groqApiKey) {
        // Direct REST call to Groq
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question },
            ],
            temperature: 0.3,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Groq API error ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        content = data?.choices?.[0]?.message?.content ?? '';
      } else if (this.activeProvider === 'gemini' && this.geminiApiKey) {
        // Direct REST call — no SDK issues, works in any browser
        content = await callGeminiRest(
          this.geminiApiKey,
          `${systemPrompt}\n\nUser Query: ${question}`,
          0.3
        );
      } else {
        // MOCK MODE
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (mode === 'analytics') {
          content = JSON.stringify({
            summary: 'Mock analytics response for: ' + question,
            insights: ['Sales are up 10%', 'Inventory is stable'],
            metrics: { totalSales: 50000, inventoryAlerts: 0 },
          });
        } else {
          content = `┌──────────────────────────────────┐
│          SHIFTWIZARD ERP         │
│         Fuel Station AI          │
├──────────────────────────────────┤
│ MOCK MODE ACTIVE                 │
│ No API Key Provided              │
├──────────────────────────────────┤
│ Query:                           │
│ ${question.substring(0, 30).padEnd(30)} │
├──────────────────────────────────┤
│      Powered by Umar Ali ⚡      │
└──────────────────────────────────┘`;
        }
      }

      // Ensure footer exists if AI omitted it
      if (mode === 'chat' && !content.includes('Powered by Umar Ali')) {
        content += '\n\n    Powered by Umar Ali ⚡';
      }

      return { rawResponse: content, formattedReceipt: content };
    } catch (error) {
      console.error('[AIAssistantService] Request failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        rawResponse: 'Error: ' + errorMessage,
        formattedReceipt: `┌──────────────────────────────────┐
│         ERROR OCCURRED           │
│ ${errorMessage.substring(0, 30).padEnd(30)} │
├──────────────────────────────────┤
│ Check API Keys in settings.      │
│ Use VITE_GROQ_API_KEY or         │
│     VITE_GEMINI_API_KEY          │
├──────────────────────────────────┤
│      Powered by Umar Ali ⚡      │
└──────────────────────────────────┘`,
      };
    }
  }



  public async generateBusinessInsights(contextData: any): Promise<AIBusinessInsight[]> {
    const prompt = `
    Analyze the following Business Intelligence (BI) data for a fuel station.
    Generate exactly 3 actionable recommendations to improve profitability or reduce risk.
    You must output ONLY valid JSON in this exact format:
    [
      {
        "recommendation": "Recover ABC Logistics Balance as they are 30 days overdue.",
        "impact": "High",
        "confidence": 92,
        "priority": "Critical"
      }
    ]
    
    Do not add markdown formatting or backticks around the JSON.
    Use ONLY the actual station-backed calculations provided below. No hallucinations.
    
    === STATION DATA CONTEXT ===
    ${JSON.stringify(contextData)}
    ===========================
    `;

    try {
      let content = '';

      if (this.activeProvider === 'groq' && this.groqApiKey) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Groq API error ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        content = data?.choices?.[0]?.message?.content ?? '';
      } else if (this.activeProvider === 'gemini' && this.geminiApiKey) {
        content = await callGeminiRest(this.geminiApiKey, prompt, 0.1);
      } else {
        // MOCK MODE
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return [
          {
            recommendation: 'Increase Super Petrol order by 5000L to prevent Friday stockout.',
            impact: 'High',
            confidence: 88,
            priority: 'High',
          },
          {
            recommendation: 'Follow up with Top Customer XYZ for pending 150k PKR payment.',
            impact: 'Medium',
            confidence: 95,
            priority: 'Critical',
          },
          {
            recommendation: 'Investigate Night Shift 2; variance of -4,200 PKR detected.',
            impact: 'High',
            confidence: 99,
            priority: 'Critical',
          },
        ];
      }

      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(content);
    } catch (error) {
      console.error('[AIAssistantService] Insights generation failed:', error);
      return [];
    }
  }
}

export const aiAssistantService = new AIAssistantService();
