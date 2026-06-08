import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, Loader2, ChevronDown, Zap } from 'lucide-react';
import { GlobalSettings, Shift, Product, Customer, Tank, Nozzle, Staff } from '../../../types';
import { formatCurrency } from '../../../lib/currency';
import { fetchWithAuth } from '../../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIAssistantProps {
  settings: GlobalSettings;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  tanks: Tank[];
  nozzles: Nozzle[];
  staff: Staff[];
}

// Build a context summary of the station's data for Gemini to reason over
function buildStationContext(
  settings: GlobalSettings,
  shifts: Shift[],
  products: Product[],
  customers: Customer[],
  tanks: Tank[],
  nozzles: Nozzle[],
  staff: Staff[]
): string {
  const closedShifts = shifts.filter(s => s.status === 'closed');
  const recentShifts = closedShifts.slice(-30);

  const totalSales = recentShifts.reduce((sum, s) => {
    const nozzleTotal = Object.keys(s.closingReadings || {}).reduce((nSum, nId) => {
      const close = s.closingReadings[nId] || 0;
      const open = s.openingReadings[nId] || 0;
      const diff = Math.max(0, close - open);
      const nozzle = nozzles.find(n => n.id === nId);
      const product = nozzle ? products.find(p => p.id === nozzle.productId) : null;
      return nSum + diff * (product?.rate || 0);
    }, 0);
    return sum + nozzleTotal;
  }, 0);

  const avgCashVariance = recentShifts.length > 0
    ? recentShifts.reduce((sum, s) => sum + Math.abs(s.shortage || 0), 0) / recentShifts.length
    : 0;

  const totalCreditDue = customers.reduce((sum, c) => sum + c.balance, 0);

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);

  const tankSummary = tanks.map(t => {
    const product = products.find(p => p.id === t.productId);
    const pct = t.capacity > 0 ? Math.round((t.currentStock / t.capacity) * 100) : 0;
    return `${t.name} (${product?.name || 'unknown'}): ${t.currentStock}L / ${t.capacity}L (${pct}%)`;
  }).join(', ');

  const shiftsByDate: Record<string, { count: number; cashVariance: number }> = {};
  recentShifts.forEach(s => {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = { count: 0, cashVariance: 0 };
    shiftsByDate[s.date].count++;
    shiftsByDate[s.date].cashVariance += Math.abs(s.shortage || 0);
  });

  // Find worst days
  const worstDay = Object.entries(shiftsByDate)
    .sort((a, b) => b[1].cashVariance - a[1].cashVariance)[0];

  return `
FUEL STATION MANAGEMENT SYSTEM — LIVE DATA CONTEXT
Station: ${settings.stationName} | Currency: ${settings.currency || 'PKR'}
Date: ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

RECENT PERFORMANCE (last ${recentShifts.length} shifts):
- Total Fuel Revenue: ${formatCurrency(totalSales, settings)}
- Total Shifts Analyzed: ${recentShifts.length} shifts across ${Object.keys(shiftsByDate).length} days
- Avg Cash Variance per Shift: ${formatCurrency(avgCashVariance, settings)}
- Worst Cash Variance Day: ${worstDay ? `${worstDay[0]} (${formatCurrency(worstDay[1].cashVariance, settings)})` : 'None'}

INVENTORY & TANKS:
- Tank Levels: ${tankSummary || 'No tanks configured'}
- Low Stock Alerts: ${lowStockProducts.length > 0 ? lowStockProducts.map(p => `${p.name} (${p.currentStock} ${p.unit})`).join(', ') : 'None'}

CUSTOMERS:
- Total Customers: ${customers.length}
- Total Credit Due (Udhar): ${formatCurrency(totalCreditDue, settings)}
- Over-limit customers: ${customers.filter(c => c.balance > c.creditLimit).length}

STAFF:
- Total Staff: ${staff.length} | Active: ${staff.filter(s => s.status === 'active' || s.active).length}

PRODUCTS:
${products.map(p => `- ${p.name}: Rate ${p.rate} ${settings.currency || 'PKR'}, Stock ${p.currentStock} ${p.unit}`).join('\n')}
  `.trim();
}

const SUGGESTED_QUERIES = [
  "What's my cash variance this week?",
  "Which products are running low?",
  "How much udhar is pending from customers?",
  "What's my best performing day?",
  "Give me a financial health summary",
  "Are my tank levels safe?",
];

export default function AIAssistant({
  settings,
  shifts,
  products,
  customers,
  tanks,
  nozzles,
  staff,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Assalam-o-alaikum! 👋 I'm your **FuelPro AI Assistant**, powered by Gemini.\n\nI have full access to your station data — shifts, inventory, customers, and cash records. Ask me anything in plain English or Urdu!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stationContext = buildStationContext(settings, shifts, products, customers, tanks, nozzles, staff);

      const systemPrompt = `You are FuelPro AI, an intelligent business analytics assistant for a Pakistani fuel station management system. 

${stationContext}

INSTRUCTIONS:
- Answer questions based ONLY on the data above
- Be concise, actionable, and specific with numbers
- Use Pakistani context (PKR currency, petrol/diesel/CNG terminology)
- If data is insufficient, say so honestly
- Format numbers with commas (e.g., 1,234,567)
- You can respond in Urdu if the user writes in Urdu
- Highlight urgent issues (low tanks, high cash variance, over-limit customers) proactively
- Keep responses under 200 words unless a detailed breakdown is needed`;

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userMessage: text.trim(),
          conversationHistory: messages
            .filter(m => !m.isLoading && m.id !== 'welcome')
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: data.reply || 'Sorry, I could not process that.', isLoading: false }
            : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? {
                ...m,
                content: '⚠️ I\'m having trouble connecting to the AI service. Please check your API key configuration in the server settings.',
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            id="ai_assistant_trigger"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-shadow"
            title="FuelPro AI Assistant"
          >
            <Sparkles className="h-6 w-6" />
            {/* Pulse ring */}
            <span className="absolute h-14 w-14 rounded-full bg-violet-500/30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[calc(100vw-2rem)] max-w-md h-[580px] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl shadow-black/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-sans font-bold text-sm leading-none">FuelPro AI</div>
                  <div className="text-[10px] text-violet-200 font-medium mt-0.5 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> Powered by Gemini
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full mt-0.5 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-[var(--bg-hover)] text-[var(--text-main)] rounded-tl-sm'
                  }`}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                        <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
                      </div>
                    ) : (
                      <p className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                        {msg.content.replace(/\*\*(.*?)\*\*/g, 'Rs.1')}
                      </p>
                    )}
                    <p className="font-sans text-[9px] mt-1 opacity-50">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                {SUGGESTED_QUERIES.slice(0, 3).map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="shrink-0 rounded-full border border-[var(--border-main)] bg-[var(--bg-hover)] px-3 py-1.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-600 transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border-main)] shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your station data..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-[var(--border-main)] bg-[var(--bg-hover)] px-3.5 py-2.5 font-sans text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-60"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
