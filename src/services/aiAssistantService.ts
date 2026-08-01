import { logger } from '../lib/logger';

export interface AIResponse {
  rawResponse: string;
  formattedReceipt: string;
  providerUsed: 'groq' | 'gemini' | 'local-engine';
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

  private activeProvider: 'groq' | 'gemini' | 'local-engine' = 'local-engine';

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const groqKey =
      localStorage.getItem('VITE_GROQ_API_KEY') ||
      localStorage.getItem('GROQ_API_KEY') ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
      undefined;

    const geminiKey =
      localStorage.getItem('VITE_GEMINI_API_KEY') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      undefined;

    if (groqKey) {
      this.groqApiKey = groqKey;
      this.activeProvider = 'groq';
      console.info('[AIAssistantService] ✅ Groq provider active (via REST API).');
    } else if (geminiKey) {
      this.geminiApiKey = geminiKey;
      this.activeProvider = 'gemini';
      console.info('[AIAssistantService] ✅ Gemini provider active (via REST API).');
    } else {
      this.activeProvider = 'local-engine';
      logger.info(
        '[AIAssistantService] ℹ️ Running in Local Enterprise Deterministic Engine mode.\n' +
        'Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY for Cloud LLM processing.'
      );
    }
  }

  public getActiveProvider(): 'groq' | 'gemini' | 'local-engine' {
    return this.activeProvider;
  }

  public saveApiKey(provider: 'groq' | 'gemini', key: string) {
    if (provider === 'groq') {
      localStorage.setItem('VITE_GROQ_API_KEY', key);
    } else {
      localStorage.setItem('VITE_GEMINI_API_KEY', key);
    }
    this.reinitialize();
  }

  public reinitialize() {
    this.groqApiKey = null;
    this.geminiApiKey = null;
    this.activeProvider = 'local-engine';
    this.initializeClients();
  }

  private getSystemPrompt(contextData?: any, mode: AIAssistantMode = 'chat'): string {
    const todayDate = contextData?.date || new Date().toISOString().split('T')[0];
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

YOUR CRITICAL INSTRUCTIONS:
1. You MUST format your response strictly as a physical printed ASCII thermal receipt.
2. TODAY'S DATE IS: ${todayDate}. NEVER leave the Date field blank! Always populate "Date: ${todayDate}".
3. Always use 'PKR' or 'Rs' for currency and 'Liters' for fuel volume.
4. Extract item names, stock quantities, rates, and operational statuses directly from the SYSTEM DATA CONTEXT provided below.
5. NEVER hallucinate or output 0 values if the SYSTEM DATA CONTEXT contains live products/tanks!
6. Header MUST be "SHIFTWIZARD ERP".
7. Footer MUST be "Powered by Umar Ali ⚡".

${dataContext}

REQUIRED ASCII FORMAT:
┌──────────────────────────────────┐
│          SHIFTWIZARD ERP         │
│          Fuel Station AI         │
├──────────────────────────────────┤
│ Date: ${todayDate}                 │
│ Query: (Short Title)             │
├──────────────────────────────────┤
│ ITEM          QTY (Liters) RATE  │
│ (Real Data From System Context)  │
├──────────────────────────────────┤
│ STATUS: (Real Live Status)       │
├──────────────────────────────────┤
│        Powered by Umar Ali ⚡    │
└──────────────────────────────────┘
`;
  }

  private generateDeterministicReceipt(question: string, contextData?: any): string {
    const dateStr = contextData?.date || new Date().toISOString().split('T')[0];
    const qLower = question.toLowerCase();

    const pad = (text: string, width = 32) => {
      const truncated = text.length > width ? text.substring(0, width - 2) + '..' : text;
      return truncated.padEnd(width, ' ');
    };

    const formatLine = (left: string, right: string, width = 32) => {
      const totalLen = left.length + right.length;
      if (totalLen >= width) {
        return `${left.substring(0, width - right.length - 1)} ${right}`;
      }
      return `${left}${ ' '.repeat(width - totalLen)}${right}`;
    };

    let title = 'General Query';
    const lines: string[] = [];

    const products: any[] = contextData?.products || [];
    const tanks: any[] = contextData?.tanks || [];

    if (qLower.includes('stock') || qLower.includes('petrol') || qLower.includes('diesel') || qLower.includes('tank') || qLower.includes('inventory') || qLower.includes('lube') || qLower.includes('item')) {
      title = 'Stock & Inventory';

      if (products.length > 0) {
        lines.push('ITEM         QTY         RATE');
        lines.push('--------------------------------');
        products.forEach(p => {
          const qtyStr = `${p.currentStock.toLocaleString()} ${p.unit || 'L'}`;
          const rateStr = p.rate > 0 ? `Rs ${p.rate}` : '-';
          lines.push(formatLine(p.name.padEnd(12).substring(0, 12), `${qtyStr.padEnd(10)} ${rateStr}`));
        });
      } else if (tanks.length > 0) {
        lines.push('TANK/PRODUCT     STOCK (L)');
        lines.push('--------------------------------');
        tanks.forEach(t => {
          lines.push(formatLine(`${t.name} (${t.productName})`, `${t.currentStock.toLocaleString()} L`));
        });
      } else {
        lines.push('No stock records found in DB.');
      }
    } else if (qLower.includes('shift') || qLower.includes('sale') || qLower.includes('cash')) {
      title = 'Shift & Sales Status';
      const activeShift = contextData?.activeShift;
      if (activeShift) {
        lines.push(`Active Shift: ${activeShift.id}`);
        lines.push(`Staff: ${activeShift.staffId}`);
        lines.push(`Submitted Cash: Rs ${activeShift.submittedCash.toLocaleString()}`);
        lines.push(`Status: ${activeShift.status.toUpperCase()}`);
      } else {
        lines.push('No active shift currently open.');
      }
    } else if (qLower.includes('credit') || qLower.includes('customer') || qLower.includes('udhar')) {
      title = 'Customer Credit Summary';
      const cust = contextData?.customers;
      lines.push(`Total Customers: ${cust?.totalCount || 0}`);
      lines.push(`Total Credit Owed: Rs ${(cust?.totalCredit || 0).toLocaleString()}`);
    } else if (qLower.includes('supplier') || qLower.includes('payable') || qLower.includes('vendor')) {
      title = 'Supplier Payables';
      const sup = contextData?.suppliers;
      lines.push(`Total Suppliers: ${sup?.totalCount || 0}`);
      lines.push(`Total Payable: Rs ${(sup?.totalPayable || 0).toLocaleString()}`);
    } else if (qLower.includes('bank') || qLower.includes('treasury') || qLower.includes('balance')) {
      title = 'Treasury & Bank';
      const tr = contextData?.treasury;
      lines.push(`Total Bank Bal: Rs ${(tr?.totalBankBalance || 0).toLocaleString()}`);
      if (tr?.banks && tr.banks.length > 0) {
        tr.banks.forEach((b: any) => {
          lines.push(formatLine(b.name, `Rs ${b.balance.toLocaleString()}`));
        });
      }
    } else {
      title = 'Station Status';
      if (products.length > 0) {
        lines.push('ACTIVE INVENTORY STOCK:');
        products.slice(0, 4).forEach(p => {
          lines.push(formatLine(p.name, `${p.currentStock.toLocaleString()} ${p.unit || 'L'}`));
        });
      } else {
        lines.push('All station systems online.');
      }
    }

    let statusText = 'Database Verified ✓';
    const lowStockAlerts = products.filter(p => p.isLowStock);
    if (lowStockAlerts.length > 0) {
      statusText = `ALERT: ${lowStockAlerts.length} item(s) low stock`;
    }

    const header = [
      '┌──────────────────────────────────┐',
      '│          SHIFTWIZARD ERP         │',
      '│          Fuel Station AI         │',
      '├──────────────────────────────────┤',
      `│ Date: ${pad(dateStr, 26)} │`,
      `│ Query: ${pad(title, 25)} │`,
      '├──────────────────────────────────┤',
    ];

    const bodyLines = lines.map(line => `│ ${pad(line, 32)} │`);

    const footer = [
      '├──────────────────────────────────┤',
      `│ STATUS: ${pad(statusText, 24)} │`,
      '├──────────────────────────────────┤',
      '│        Powered by Umar Ali ⚡    │',
      '└──────────────────────────────────┘',
    ];

    return [...header, ...bodyLines, ...footer].join('\n');
  }

  public async askQuestion(
    question: string,
    contextData?: any,
    mode: AIAssistantMode = 'chat'
  ): Promise<AIResponse> {
    const todayDate = contextData?.date || new Date().toISOString().split('T')[0];
    if (contextData && !contextData.date) {
      contextData.date = todayDate;
    }

    const systemPrompt = this.getSystemPrompt(contextData, mode);

    try {
      let content = '';
      let providerUsed: 'groq' | 'gemini' | 'local-engine' = this.activeProvider;

      if (this.activeProvider === 'groq' && this.groqApiKey) {
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
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Groq API error ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        content = data?.choices?.[0]?.message?.content ?? '';
      } else if (this.activeProvider === 'gemini' && this.geminiApiKey) {
        content = await callGeminiRest(
          this.geminiApiKey,
          `${systemPrompt}\n\nUser Query: ${question}`,
          0.2
        );
      } else {
        // LOCAL ENTERPRISE DETERMINISTIC ENGINE
        providerUsed = 'local-engine';
        if (mode === 'analytics') {
          content = JSON.stringify({
            summary: `Live Station Context Analysis for "${question}"`,
            insights: [
              `Products tracked: ${contextData?.products?.length || 0}`,
              `Tanks online: ${contextData?.tanks?.length || 0}`,
            ],
            metrics: {
              totalSales: contextData?.activeShift?.submittedCash || 0,
              inventoryAlerts: contextData?.products?.filter((p: any) => p.isLowStock)?.length || 0,
            },
          });
        } else {
          content = this.generateDeterministicReceipt(question, contextData);
        }
      }

      if (mode === 'chat' && !content.includes('Powered by Umar Ali')) {
        content += '\n\n Powered by Umar Ali ⚡';
      }

      return { rawResponse: content, formattedReceipt: content, providerUsed };
    } catch (error) {
      logger.error('[AIAssistantService] Cloud API failed, falling back to Local Enterprise Engine:', error);
      const fallbackContent = this.generateDeterministicReceipt(question, contextData);
      return {
        rawResponse: fallbackContent,
        formattedReceipt: fallbackContent,
        providerUsed: 'local-engine',
      };
    }
  }

  public async generateBusinessInsights(contextData: any): Promise<AIBusinessInsight[]> {
    const prompt = `
Analyze the following Business Intelligence (BI) data for a fuel station.
Generate exactly 3 actionable recommendations to improve profitability or reduce risk.
Output ONLY valid JSON array:
[
  {
    "recommendation": "Recover ABC Logistics Balance as they are 30 days overdue.",
    "impact": "High",
    "confidence": 92,
    "priority": "Critical"
  }
]
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

        if (!res.ok) throw new Error(`Groq error ${res.status}`);
        const data = await res.json();
        content = data?.choices?.[0]?.message?.content ?? '';
      } else if (this.activeProvider === 'gemini' && this.geminiApiKey) {
        content = await callGeminiRest(this.geminiApiKey, prompt, 0.1);
      } else {
        // LOCAL DETERMINISTIC INSIGHTS
        const lowStockCount = contextData?.products?.filter((p: any) => p.isLowStock)?.length || 0;
        const totalCredit = contextData?.customers?.totalCredit || 0;
        return [
          {
            recommendation: lowStockCount > 0 ? `Refill ${lowStockCount} low stock product(s) immediately.` : 'Maintain current tank replenishment cycle.',
            impact: lowStockCount > 0 ? 'High' : 'Low',
            confidence: 95,
            priority: lowStockCount > 0 ? 'Critical' : 'Low',
          },
          {
            recommendation: totalCredit > 0 ? `Follow up on outstanding customer credit of Rs ${totalCredit.toLocaleString()}.` : 'Customer credit balances are fully clear.',
            impact: 'Medium',
            confidence: 90,
            priority: totalCredit > 50000 ? 'High' : 'Medium',
          },
          {
            recommendation: 'Perform daily shift dip reconciliation to ensure zero loss.',
            impact: 'High',
            confidence: 98,
            priority: 'Medium',
          },
        ];
      }

      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(content);
    } catch (error) {
      logger.error('[AIAssistantService] Insights generation failed:', error);
      return [];
    }
  }
}

export const aiAssistantService = new AIAssistantService();
