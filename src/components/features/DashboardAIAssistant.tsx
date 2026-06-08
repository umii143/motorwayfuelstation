import React, { useState } from 'react';
import { Sparkles, MessageCircle, Send, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { GlobalSettings, Shift, Customer, Product, BankAccount } from '../../types';
import { t as translate } from '../../lib/translations';

interface DashboardAIAssistantProps {
  settings: GlobalSettings;
  shifts: Shift[];
  customers: Customer[];
  products: Product[];
  banks: BankAccount[];
}

export function DashboardAIAssistant({ settings, shifts, customers, products, banks }: DashboardAIAssistantProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const t = (en: string, ur: string) => translate(en, ur, settings);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const activeShift = shifts.find(s => s.status === 'active');
      const recentShifts = shifts.slice(0, 5).map(s => ({ date: s.date, status: s.status, netCash: s.submittedCash }));
      
      const context = {
        activeShift: activeShift ? { operator: activeShift.staffId, type: activeShift.type } : null,
        recentShifts,
        lowStockProducts: products.filter(p => p.currentStock <= p.minStock).map(p => ({ name: p.name, stock: p.currentStock })),
        highCreditCustomers: customers.filter(c => c.balance > (c.creditLimit || Infinity)).map(c => ({ name: c.name, balance: c.balance })),
        bankBalances: banks.map(b => ({ name: b.name, balance: b.balance }))
      };

      const res = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are the intelligent Dashboard Assistant for a Fuel Station ERP. Answer the user\'s question concisely based ONLY on the provided JSON context about the station\'s current state. If the context does not contain the answer, say so clearly.',
          userMessage: `Context: ${JSON.stringify(context)}\n\nQuery: ${query}`,
          language: settings.language
        })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();
      setResponse(data.reply);
    } catch (error) {
      console.error(error);
      setResponse(t('Sorry, I encountered an error connecting to the AI brain.', 'معذرت، AI برین سے منسلک ہونے میں خرابی پیش آ گئی۔'));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionPills = [
    t("What happened today?", "آج کیا ہوا؟"),
    t("Show critical alerts", "اہم الرٹس دکھائیں"),
    t("Which customers owe money?", "کس کے ذمے ادھار ہے؟")
  ];

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/50 overflow-hidden flex flex-col mt-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-full bg-white/20 p-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold leading-tight">
              {t('AI Dashboard Assistant', 'اے آئی ڈیش بورڈ اسسٹنٹ')}
            </h3>
            <p className="font-sans text-xs text-indigo-100 mt-0.5">
              {t('Ask questions about your live station data', 'اپنے لائیو ڈیٹا کے بارے میں سوالات پوچھیں')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-slate-50 flex-1 flex flex-col justify-end">
        {response ? (
          <div className="mb-6 rounded-xl bg-white border border-indigo-100 p-4 shadow-xs">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">AI Response</p>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
              {response}
            </div>
            <button 
              onClick={() => { setResponse(null); setQuery(''); }}
              className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {t('Ask another question', 'دوسرا سوال پوچھیں')}
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">
              {t('Try asking:', 'پوچھنے کی کوشش کریں:')}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(pill)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleAsk} className="relative">
          <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Ask me anything about your business...', 'اپنے کاروبار کے بارے میں کچھ بھی پوچھیں...')}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading || response !== null}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim() || response !== null}
            className="absolute right-2 top-2 bottom-2 rounded-lg bg-indigo-600 px-3 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
