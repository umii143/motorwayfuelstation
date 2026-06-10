import { Groq } from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

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

export class AIAssistantService {
  private groqClient: Groq | null = null;
  private geminiClient: GoogleGenAI | null = null;
  
  private activeProvider: 'groq' | 'gemini' | 'mock' = 'mock';

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Attempt to load from localStorage first (User Settings)
    const storedGroq = localStorage.getItem('GROQ_API_KEY');
    const storedGemini = localStorage.getItem('GEMINI_API_KEY');

    // Fallback to Vite env variables
    // @ts-ignore
    const envGroq = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : undefined;
    // @ts-ignore
    const envGemini = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined;

    const finalGroq = storedGroq || envGroq;
    const finalGemini = storedGemini || envGemini;

    if (finalGroq) {
      this.groqClient = new Groq({ apiKey: finalGroq, dangerouslyAllowBrowser: true });
      this.activeProvider = 'groq';
    } else if (finalGemini) {
      this.geminiClient = new GoogleGenAI({ apiKey: finalGemini });
      this.activeProvider = 'gemini';
    } else {
      this.activeProvider = 'mock';
      console.warn('[AIAssistantService] No API keys found. Falling back to local Mock Mode.');
    }
  }

  /**
   * Refreshes clients, useful if the user updates API keys in settings.
   */
  public reinitialize() {
    this.initializeClients();
  }

  private getSystemPrompt(contextData?: any, mode: AIAssistantMode = 'chat'): string {
    const dataContext = contextData ? `\n\n=== SYSTEM DATA CONTEXT ===\n${JSON.stringify(contextData)}\n===========================\n` : '';
    
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
    6. Be concise, professional, and data-driven. Do not add markdown outside the ASCII box.
    ${dataContext}
    
    EXAMPLE FORMAT:
    ┌──────────────────────────────────┐
    │          SHIFTWIZARD ERP         │
    │         Fuel Station AI          │
    ├──────────────────────────────────┤
    │ Date: 2026-06-10                 │
    │ Query: Low Stock Alert           │
    ├──────────────────────────────────┤
    │ ITEM                QTY          │
    │ HSD Diesel          450 Liters   │
    │ Super Petrol        1200 Liters  │
    ├──────────────────────────────────┤
    │ STATUS: ACTION REQUIRED          │
    │ Please reorder HSD Diesel        │
    ├──────────────────────────────────┤
    │      Powered by Umar Ali ⚡      │
    └──────────────────────────────────┘
    `;
  }

  public async askQuestion(question: string, contextData?: any, mode: AIAssistantMode = 'chat'): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(contextData, mode);

    try {
      let content = "";

      if (this.activeProvider === 'groq' && this.groqClient) {
        const completion = await this.groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          model: 'llama3-70b-8192',
          temperature: 0.3,
        });
        content = completion.choices[0]?.message?.content || "";
      } 
      else if (this.activeProvider === 'gemini' && this.geminiClient) {
        // GenAI SDK v2 approach
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Query: " + question }] }
          ],
          config: {
            temperature: 0.3,
          }
        });
        content = response.text || "";
      } 
      else {
        // MOCK MODE
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (mode === 'analytics') {
          content = JSON.stringify({
            summary: "Mock analytics response for: " + question,
            insights: ["Sales are up 10%", "Inventory is stable"],
            metrics: { totalSales: 50000, inventoryAlerts: 0 }
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

      // Ensure footer exists even if AI hallucinated it out in chat mode
      if (mode === 'chat' && !content.includes('Powered by Umar Ali')) {
        content += '\n\n    Powered by Umar Ali ⚡';
      }

      return {
        rawResponse: content,
        formattedReceipt: content
      };

    } catch (error) {
      console.error("[AIAssistantService] Request failed:", error);
      return {
        rawResponse: "Error connecting to AI Provider.",
        formattedReceipt: `┌──────────────────────────────────┐\n│         ERROR OCCURRED           │\n│ Check API Keys in settings.      │\n├──────────────────────────────────┤\n│      Powered by Umar Ali ⚡      │\n└──────────────────────────────────┘`
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
      let content = "";

      if (this.activeProvider === 'groq' && this.groqClient) {
        const completion = await this.groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-70b-8192',
          temperature: 0.1,
        });
        content = completion.choices[0]?.message?.content || "";
      } else if (this.activeProvider === 'gemini' && this.geminiClient) {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.1 }
        });
        content = response.text || "";
      } else {
        // MOCK MODE
        await new Promise(resolve => setTimeout(resolve, 1500));
        return [
          {
            recommendation: "Increase Super Petrol order by 5000L to prevent Friday stockout.",
            impact: "High",
            confidence: 88,
            priority: "High"
          },
          {
            recommendation: "Follow up with Top Customer XYZ for pending 150k PKR payment.",
            impact: "Medium",
            confidence: 95,
            priority: "Critical"
          },
          {
            recommendation: "Investigate Night Shift 2; variance of -4,200 PKR detected.",
            impact: "High",
            confidence: 99,
            priority: "Critical"
          }
        ];
      }

      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      console.error("[AIAssistantService] Insights generation failed:", error);
      return [];
    }
  }
}

export const aiAssistantService = new AIAssistantService();
