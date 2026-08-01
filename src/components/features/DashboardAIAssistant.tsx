import React, { useState } from 'react';
import { Sparkles, MessageCircle, Send, Loader2 } from 'lucide-react';
import { GlobalSettings, Shift, Customer, Product, BankAccount } from '../../types';
import { t as translate } from '../../lib/translations';
import { logger } from '../../lib/logger';
import { aiAssistantService } from '../../services/aiAssistantService';
import { buildAIContext } from '../../utils/aiContextBuilder';

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
      const contextData = buildAIContext({
        products,
        shifts,
        customers,
        banks,
      });

      const res = await aiAssistantService.askQuestion(query.trim(), contextData);
      setResponse(res.formattedReceipt);
    } catch (error) {
      logger.error('[DashboardAIAssistant] Query error:', error);
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
    <div className="rounded-2xl border border-indigo-100 bg-card shadow-xl shadow-indigo-100/50 overflow-hidden flex flex-col mt-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-full bg-card/20 p-2">
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

      <div className="p-5 bg-subtle flex-1 flex flex-col justify-end">
        {response ? (
          <div className="mb-6 rounded-xl bg-card border border-indigo-100 p-4 shadow-xs">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">AI Response</p>
            <div className="font-mono text-xs max-w-none text-foreground whitespace-pre leading-relaxed overflow-x-auto bg-subtle p-3 rounded-lg border border-border">
              {response}
            </div>
            <button 
              onClick={() => { setResponse(null); setQuery(''); }}
              className="mt-4 text-xs font-bold text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {t('Ask another question', 'دوسرا سوال پوچھیں')}
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-sm font-semibold text-muted-foreground mb-3">
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
          <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Ask me anything about your business...', 'اپنے کاروبار کے بارے میں کچھ بھی پوچھیں...')}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-12 text-sm font-semibold text-foreground shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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
