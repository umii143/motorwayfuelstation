import { logger } from '../lib/logger';

export interface AIActionButton {
  label: string;
  route: string;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger';
}

export interface AIResponse {
  rawResponse: string;
  formattedReceipt: string;
  providerUsed: 'groq' | 'gemini' | 'local-engine';
  modelName: string;
  latencyMs: number;
  tokensEstimate: number;
  actionButtons?: AIActionButton[];
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

  public getModelName(): string {
    if (this.activeProvider === 'groq') return 'Groq (llama-3.3-70b)';
    if (this.activeProvider === 'gemini') return 'Gemini (2.0-flash)';
    return 'Enterprise Offline Copilot';
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
      ? `\n\n=== 360-DEGREE ENTERPRISE STATION CONTEXT ===\n${JSON.stringify(contextData, null, 2)}\n==============================================\n`
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

    return `You are ShiftWizard Enterprise AI Copilot for a Fuel Station ERP built by Umar Ali.

YOUR MANDATORY INSTRUCTIONS:
1. You MUST format your response strictly as a physical printed ASCII thermal receipt using ASCII box characters.
2. TODAY'S DATE IS: ${todayDate}. NEVER leave the Date field blank! Always populate "Date: ${todayDate}".
3. Always use 'PKR' or 'Rs' for currency and 'Liters' for fuel volume.
4. If asked "Why" or for a stock breakdown, provide a multi-step financial & operational audit:
   - Opening Level
   - Sales Today
   - Deliveries Received
   - Remaining Level
   - Runout Forecast (Days)
   - Actionable Recommendation (e.g. Order X Liters)
5. NEVER hallucinate or output 0 values if the SYSTEM DATA CONTEXT contains live products/tanks!
6. Header MUST be "SHIFTWIZARD ERP".
7. Footer MUST be "Powered by Umar Ali ⚡".

${dataContext}
`;
  }

  private generateDeterministicReceipt(question: string, contextData?: any): { text: string; buttons: AIActionButton[] } {
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
    const buttons: AIActionButton[] = [];

    const products: any[] = contextData?.products || [];
    const tanks: any[] = contextData?.tanks || [];
    const activeShift = contextData?.activeShift;
    const customers = contextData?.customers;
    const suppliers = contextData?.suppliers;
    const treasury = contextData?.treasury;

    const isWhyQuery = qLower.includes('why') || qLower.includes('reason') || qLower.includes('explain') || qLower.includes('because');

    if (isWhyQuery && (qLower.includes('petrol') || qLower.includes('diesel') || qLower.includes('stock'))) {
      title = 'Stock Audit & Reasoning';
      const targetProd = products.find(p => qLower.includes(p.name.toLowerCase())) || products[0];
      if (targetProd) {
        lines.push(`PRODUCT: ${targetProd.name}`);
        lines.push(`Current Level:   ${targetProd.currentStock.toLocaleString()} ${targetProd.unit}`);
        lines.push(`Opening Level:   ${targetProd.openingStock.toLocaleString()} ${targetProd.unit}`);
        lines.push(`Sales Today:     -${targetProd.salesToday.toLocaleString()} ${targetProd.unit}`);
        lines.push(`Deliveries:      +0 ${targetProd.unit}`);
        lines.push('--------------------------------');
        lines.push(`Runout Forecast: ${targetProd.daysRemaining} Days`);
        lines.push(`Status:          ${targetProd.isLowStock ? 'LOW STOCK WARNING' : 'HEALTHY'}`);
        lines.push('--------------------------------');
        lines.push(`RECOMMENDED ACTION:`);
        lines.push(targetProd.isLowStock ? `Order ${targetProd.recommendedReorder.toLocaleString()} L from PSO` : 'Stock level is sufficient.');
        
        if (targetProd.isLowStock) {
          buttons.push({ label: '📦 Create Purchase Order', route: '/inventory', variant: 'primary' });
        }
      }
    } else if (qLower.includes('stock') || qLower.includes('petrol') || qLower.includes('diesel') || qLower.includes('tank') || qLower.includes('inventory') || qLower.includes('lube') || qLower.includes('item')) {
      title = 'Stock & Inventory';

      if (products.length > 0) {
        lines.push('ITEM         QTY         RATE');
        lines.push('--------------------------------');
        products.forEach(p => {
          const qtyStr = `${p.currentStock.toLocaleString()} ${p.unit || 'L'}`;
          const rateStr = p.rate > 0 ? `Rs ${p.rate}` : '-';
          lines.push(formatLine(p.name.padEnd(12).substring(0, 12), `${qtyStr.padEnd(10)} ${rateStr}`));

          if (p.isLowStock) {
            buttons.push({ label: `📦 Reorder ${p.name}`, route: '/inventory', variant: 'warning' });
          }
        });
      } else if (tanks.length > 0) {
        lines.push('TANK/PRODUCT     STOCK (L)');
        lines.push('--------------------------------');
        tanks.forEach(t => {
          lines.push(formatLine(`${t.name} (${t.productName})`, `${t.currentStock.toLocaleString()} L`));
        });
        buttons.push({ label: '📐 Open Wet Stock Calculator', route: '/dip-calculator' });
      } else {
        lines.push('No stock records found in DB.');
      }
    } else if (qLower.includes('shift') || qLower.includes('sale') || qLower.includes('cash')) {
      title = 'Shift & Sales Status';
      if (activeShift) {
        lines.push(`Active Shift: ${activeShift.id}`);
        lines.push(`Staff: ${activeShift.staffId}`);
        lines.push(`Submitted Cash: Rs ${activeShift.submittedCash.toLocaleString()}`);
        lines.push(`Status: ${activeShift.status.toUpperCase()}`);
        buttons.push({ label: '🔍 Investigate Active Shift', route: '/shift-wizard' });
      } else {
        lines.push('No active shift currently open.');
        buttons.push({ label: '🚀 Open Shift Wizard', route: '/shift-wizard', variant: 'primary' });
      }
    } else if (qLower.includes('credit') || qLower.includes('customer') || qLower.includes('udhar')) {
      title = 'Customer Credit Summary';
      lines.push(`Total Customers: ${customers?.totalCount || 0}`);
      lines.push(`Total Credit Owed: Rs ${(customers?.totalCredit || 0).toLocaleString()}`);
      if (customers?.highRiskOverdue && customers.highRiskOverdue.length > 0) {
        lines.push('--------------------------------');
        lines.push('HIGH RISK OVERDUE:');
        customers.highRiskOverdue.forEach((c: any) => {
          lines.push(formatLine(c.name, `Rs ${c.balance.toLocaleString()}`));
        });
      }
      buttons.push({ label: '💳 Open Customer Credit Center', route: '/customers', variant: 'danger' });
    } else if (qLower.includes('supplier') || qLower.includes('payable') || qLower.includes('vendor')) {
      title = 'Supplier Payables';
      lines.push(`Total Suppliers: ${suppliers?.totalCount || 0}`);
      lines.push(`Total Payable: Rs ${(suppliers?.totalPayable || 0).toLocaleString()}`);
      buttons.push({ label: '💰 Settle Supplier Payment', route: '/suppliers', variant: 'warning' });
    } else if (qLower.includes('bank') || qLower.includes('treasury') || qLower.includes('balance')) {
      title = 'Treasury & Bank';
      lines.push(`Total Bank Bal: Rs ${(treasury?.totalBankBalance || 0).toLocaleString()}`);
      if (treasury?.banks && treasury.banks.length > 0) {
        treasury.banks.forEach((b: any) => {
          lines.push(formatLine(b.name, `Rs ${b.balance.toLocaleString()}`));
        });
      }
      buttons.push({ label: '🏦 Open Treasury Hub', route: '/treasury' });
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
      '│       Action Copilot v4.0        │',
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

    return {
      text: [...header, ...bodyLines, ...footer].join('\n'),
      buttons,
    };
  }

  public async askQuestion(
    question: string,
    contextData?: any,
    mode: AIAssistantMode = 'chat'
  ): Promise<AIResponse> {
    const startTime = performance.now();
    const todayDate = contextData?.date || new Date().toISOString().split('T')[0];
    if (contextData && !contextData.date) {
      contextData.date = todayDate;
    }

    const systemPrompt = this.getSystemPrompt(contextData, mode);
    const tokensEstimate = Math.ceil((systemPrompt.length + question.length) / 4);

    try {
      let content = '';
      let providerUsed: 'groq' | 'gemini' | 'local-engine' = this.activeProvider;
      let actionButtons: AIActionButton[] = [];

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
        providerUsed = 'local-engine';
        const deterministicResult = this.generateDeterministicReceipt(question, contextData);
        content = deterministicResult.text;
        actionButtons = deterministicResult.buttons;
      }

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (mode === 'chat' && !content.includes('Powered by Umar Ali')) {
        content += '\n\n Powered by Umar Ali ⚡';
      }

      // Auto-extract action buttons if not present
      if (actionButtons.length === 0 && contextData?.activeAlerts) {
        contextData.activeAlerts.slice(0, 2).forEach((alert: any) => {
          actionButtons.push({
            label: alert.actionLabel,
            route: alert.actionRoute,
            variant: alert.severity === 'high' ? 'danger' : 'warning',
          });
        });
      }

      return {
        rawResponse: content,
        formattedReceipt: content,
        providerUsed,
        modelName: this.getModelName(),
        latencyMs,
        tokensEstimate,
        actionButtons,
      };
    } catch (error) {
      const endTime = performance.now();
      logger.error('[AIAssistantService] Cloud API failed, falling back to Local Enterprise Engine:', error);
      const deterministicResult = this.generateDeterministicReceipt(question, contextData);
      return {
        rawResponse: deterministicResult.text,
        formattedReceipt: deterministicResult.text,
        providerUsed: 'local-engine',
        modelName: 'Enterprise Offline Copilot (Fallback)',
        latencyMs: Math.round(endTime - startTime),
        tokensEstimate,
        actionButtons: deterministicResult.buttons,
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
