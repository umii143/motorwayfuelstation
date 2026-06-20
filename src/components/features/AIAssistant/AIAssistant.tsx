import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, Loader2, ChevronDown, Zap } from 'lucide-react';
import { GlobalSettings, Shift, Product, Customer, Tank, Nozzle, Staff } from '../../../types';
import { aiAssistantService } from '../../../services/aiAssistantService';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useStationStore } from '../../../stores/useStationStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isReceiptFormat?: boolean;
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
      content: `Assalam-o-alaikum! 👋 I'm your **FuelPro AI Assistant**.\n\nI have full access to your station data. Ask me anything and I will provide you with a structured receipt summary!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rateHistory = useInventoryStore(state => state.rateHistory);
  const { cashAccounts, treasuryTransactions, ownerDrawings } = useTreasuryStore();

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
      const contextData = {
        settings,
        tanks: tanks.map(t => ({ name: t.name, currentVolume: t.currentStock, capacity: t.capacity })),
        recentShifts: shifts.slice(-5),
        products,
        customers: customers.length,
        rateHistory: rateHistory.slice(-10), // provide recent price history
        treasury: {
          cashBalances: cashAccounts.map(a => ({ name: a.name, type: a.type, balance: a.balance })),
          recentTransactions: treasuryTransactions.slice(-5),
          ownerDrawingsTotal: ownerDrawings.reduce((sum, d) => sum + d.amount, 0)
        }
      };

      const aiResponse = await aiAssistantService.askQuestion(text.trim(), contextData);

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: aiResponse.formattedReceipt, isLoading: false, isReceiptFormat: true }
            : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? {
                ...m,
                content: '⚠️ I\'m having trouble connecting to the AI service.',
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isVisible = useStationStore(state => state.isAIAssistantVisible);
  const setAIAssistantVisible = useStationStore(state => state.setAIAssistantVisible);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragConstraints={{ left: -window.innerWidth + 80, right: window.innerWidth - 80, top: -window.innerHeight + 80, bottom: 0 }}
            dragElastic={0.5}
            dragMomentum={false}
            onDragEnd={(e, info) => {
              // Swipe right or left to dismiss
              if (info.offset.x > 100 || info.offset.x < -100 || Math.abs(info.velocity.x) > 500) {
                setAIAssistantVisible(false);
              }
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-28 lg:bottom-10 right-6 z-[250] flex flex-col items-end gap-1 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              id="ai_assistant_trigger"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-shadow"
              title="FuelPro AI Assistant"
            >
              <Sparkles className="h-6 w-6 pointer-events-none" />
              <span className="absolute h-14 w-14 rounded-full bg-violet-500/30 animate-ping pointer-events-none" />
            </motion.button>
          </motion.div>
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
            className="fixed bottom-24 lg:bottom-10 right-6 z-[260] flex flex-col w-[calc(100vw-2rem)] max-w-md h-[580px] max-h-[80vh] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl shadow-black/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-sans font-bold text-sm leading-none">ShiftWizard AI</div>
                  <div className="text-[10px] text-violet-200 font-medium mt-0.5 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> Powered by Umar Ali ⚡
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
                  <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full mt-0.5 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : msg.isReceiptFormat
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre overflow-x-auto'
                        : 'bg-[var(--bg-hover)] text-[var(--text-main)] rounded-tl-sm'
                  }`}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                        <span className="text-xs text-[var(--text-muted)]">Generating Receipt...</span>
                      </div>
                    ) : (
                      <p className={msg.isReceiptFormat ? 'font-mono' : 'font-sans text-xs leading-relaxed whitespace-pre-wrap'}>
                        {msg.content}
                      </p>
                    )}
                    <p className="font-sans text-[9px] mt-1 opacity-50 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Shift shortfalls today?",
                    "Total sales this week?",
                    "Which tanks need refilling?",
                    "Outstanding credit recovery?",
                    "Highest expense category?",
                    "Recommend price revision?",
                    "Generate shift summary",
                    "Pending supplier payments?",
                    "Compare Lube vs Fuel sales",
                    "System health check"
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action)}
                      className="px-2.5 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-main)] hover:border-violet-300 hover:bg-violet-50 text-[10px] text-[var(--text-main)] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border-main)] shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for stock updates, shifts..."
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
