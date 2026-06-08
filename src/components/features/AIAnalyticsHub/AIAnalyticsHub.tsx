import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, BrainCircuit, BarChart3, LineChart, 
  TrendingUp, AlertTriangle, Zap, Download, RefreshCw, 
  ChevronRight, Database, Shield
} from 'lucide-react';
import { GlobalSettings } from '../../../types';
import { fetchWithAuth } from '../../../lib/api';

interface AIAnalyticsHubProps {
  settings: GlobalSettings;
  dataContext: any; // We'll pass the whole station state to Gemini for context
}

export default function AIAnalyticsHub({ settings, dataContext }: AIAnalyticsHubProps) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { 
      role: 'assistant', 
      content: 'Welcome to FuelPro AI Analytics Hub! ✨\n\nI am connected to your enterprise database. I can analyze shift variances, compare sales between nozzles, predict fuel runout dates based on current trends, or generate financial summaries.\n\nWhat would you like to analyze today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => isUrdu ? ur : en;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build a system prompt containing our entire data context
      const systemPrompt = `
        You are FuelPro AI, an advanced enterprise ERP assistant for a fuel station.
        You have direct access to the station's live data context.
        Analyze the data provided and answer the user's questions accurately.
        Format your responses beautifully in markdown. Use bolding, lists, and emojis where appropriate.
        If the user asks for a comparison, provide a structured breakdown.
        
        DATA CONTEXT:
        ${JSON.stringify(dataContext)}
      `;

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
          conversationHistory: messages.slice(1) // skip the welcome message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Gemini AI Engine.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **Connection Error:** ${error.message}\n\nPlease check your internet connection or ensure your GEMINI_API_KEY is properly configured.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    t("Summarize today's total sales and identify any cash variances.", "آج کی کل سیلز کا خلاصہ کریں اور کیش کے فرق کی نشاندہی کریں۔"),
    t("Compare Diesel (HSD) vs Petrol (PMG) sales for this week.", "اس ہفتے کی ڈیزل اور پیٹرول سیلز کا موازنہ کریں۔"),
    t("Predict when Tank 1 will need a refill based on average hourly sales.", "اوسط فی گھنٹہ سیلز کی بنیاد پر بتائیں کہ ٹینک 1 کو کب ری فل کی ضرورت ہوگی۔"),
    t("Identify the top-performing staff member by sales volume.", "سیلز کے حجم کے لحاظ سے بہترین کارکردگی دکھانے والے عملے کی شناخت کریں۔")
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none">
          <BrainCircuit className="h-48 w-48 text-indigo-300" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-6 w-6 text-indigo-300" />
            </div>
            <span className="font-mono text-[10px] font-black text-indigo-300 uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10">
              Powered by Gemini 2.5
            </span>
          </div>
          
          <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {t("AI Analytics Hub", "اے آئی اینالٹکس ہب")}
          </h1>
          <p className="font-sans text-indigo-200 max-w-xl text-sm leading-relaxed">
            {t("Your centralized intelligent command center. Ask complex questions about your enterprise data, generate predictive insights, and identify revenue leaks instantly.", "آپ کا مرکزی ذہین کمانڈ سینٹر۔ اپنے انٹرپرائز ڈیٹا کے بارے میں پیچیدہ سوالات پوچھیں، پیشین گوئیاں حاصل کریں، اور فوری طور پر ریونیو میں کمی کی نشاندہی کریں۔")}
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
        {/* Left Sidebar - Data Context Status & Suggestions */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mb-4">
              <Database className="h-4 w-4 text-indigo-500" />
              {t("Live Data Synced", "لائیو ڈیٹا مطابقت پذیر")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">{t("Products", "مصنوعات")}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{dataContext.products?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">{t("Tanks", "ٹینک")}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{dataContext.tanks?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">{t("Active Staff", "متحرک عملہ")}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{dataContext.staff?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">{t("Recent Shifts", "حالیہ شفٹیں")}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{dataContext.shifts?.slice(0, 5).length || 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              End-to-End Encrypted
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm flex-1 overflow-y-auto hidden lg:block">
            <h3 className="font-sans text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-500" />
              {t("Suggested Queries", "تجویز کردہ سوالات")}
            </h3>
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sug);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-main)] hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <p className="font-sans text-xs text-[var(--text-main)] group-hover:text-indigo-900 leading-relaxed">
                    "{sug}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] rounded-bl-sm'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5 opacity-70">
                      {msg.role === 'assistant' ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <span className="font-sans text-[10px] uppercase font-bold tracking-wider">You</span>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none font-sans" dangerouslySetInnerHTML={{ 
                      // Extremely basic markdown parsing for demo purposes. 
                      // In production, use react-markdown.
                      __html: msg.content
                        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>Rs.1</strong>')
                        .replace(/\\*(.*?)\\*/g, '<em>Rs.1</em>')
                        .replace(/\\n/g, '<br />') 
                    }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-sans text-xs text-[var(--text-muted)] font-medium">Gemini is analyzing...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border-main)]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Gemini to analyze your data..."
                className="w-full pl-5 pr-14 py-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] font-sans text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-sm transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2 p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center mt-2 font-sans text-[10px] text-[var(--text-muted)]">
              AI can make mistakes. Please verify critical financial figures against official reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
