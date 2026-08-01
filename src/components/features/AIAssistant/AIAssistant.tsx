import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, User, Loader2, ChevronDown, Zap, Clock, Activity, ArrowRight, Cpu } from 'lucide-react';
import { GlobalSettings, Shift, Product, Customer, Tank, Nozzle, Staff } from '../../../types';
import { aiAssistantService, AIActionButton } from '../../../services/aiAssistantService';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useShallow } from 'zustand/react/shallow';
import { useStationStore } from '../../../stores/useStationStore';
import { buildAIContext } from '../../../utils/aiContextBuilder';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isReceiptFormat?: boolean;
  actionButtons?: AIActionButton[];
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nozzles,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  staff,
}: AIAssistantProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Assalam-o-alaikum! 👋 I'm your **FuelPro Enterprise Action Copilot**.\n\nI have full 360° access to your station operational database. Ask me anything or request reorder recommendations!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState<{ provider: string; model: string; latencyMs: number; tokens: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { cashAccounts } = useTreasuryStore(useShallow(s => ({
    cashAccounts: s.cashAccounts,
  })));

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
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
      const contextData = buildAIContext({
        products,
        tanks,
        nozzles,
        shifts,
        customers,
        banks: cashAccounts.map(a => ({ id: a.id, name: a.name, balance: a.balance } as any)),
      });

      const aiResponse = await aiAssistantService.askQuestion(text.trim(), contextData);

      setLastMeta({
        provider: aiResponse.providerUsed,
        model: aiResponse.modelName,
        latencyMs: aiResponse.latencyMs,
        tokens: aiResponse.tokensEstimate,
      });

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? {
                ...m,
                content: aiResponse.formattedReceipt,
                isLoading: false,
                isReceiptFormat: true,
                actionButtons: aiResponse.actionButtons,
              }
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

  const activeProvider = aiAssistantService.getActiveProvider();
  const modelName = aiAssistantService.getModelName();

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
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-shadow cursor-pointer"
              title="FuelPro AI Action Copilot"
              aria-label="Open FuelPro AI Action Copilot"
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
            className="fixed bottom-24 lg:bottom-10 right-6 z-[260] flex flex-col w-[calc(100vw-2rem)] max-w-md h-[600px] max-h-[82vh] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl shadow-black/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-sans font-bold text-sm leading-none">ShiftWizard AI</div>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-white/20 text-white rounded-full flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5" />
                      {activeProvider === 'groq' ? 'Groq' : activeProvider === 'gemini' ? 'Gemini' : 'Enterprise Engine'}
                    </span>
                  </div>
                  <div className="text-[10px] text-violet-200 font-medium mt-0.5 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> Powered by Umar Ali ⚡
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/15 hover:bg-card/25 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Diagnostic Bar */}
            <div className="bg-indigo-950 text-indigo-200 text-[10px] px-4 py-1.5 flex items-center justify-between border-b border-indigo-900 font-mono shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate font-semibold text-white">{modelName}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lastMeta && (
                  <>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-amber-300" />
                      {lastMeta.latencyMs}ms
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Activity className="w-2.5 h-2.5 text-indigo-300" />
                      ~{lastMeta.tokens} tok
                    </span>
                  </>
                )}
                <span className="text-emerald-400 font-bold">LIVE</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} w-full`}>
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
                        ? 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre overflow-x-auto'
                        : 'bg-[var(--bg-hover)] text-[var(--text-main)] rounded-tl-sm'
                    }`}>
                      {msg.isLoading ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                          <span className="text-xs text-[var(--text-muted)]">Executing Operational Analysis...</span>
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

                  {/* Interactive Action Copilot Buttons */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                      {msg.actionButtons.map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(btn.route);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                            btn.variant === 'danger'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : btn.variant === 'warning'
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-violet-600 text-white hover:bg-violet-700'
                          }`}
                        >
                          {btn.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Why is Petrol stock low?",
                    "Shift shortfalls today?",
                    "Total sales this week?",
                    "Which tanks need refilling?",
                    "Outstanding credit recovery?",
                    "Pending supplier payments?",
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
                placeholder="Why is Petrol stock 2000L? Ask anything..."
                aria-label="Message to AI Assistant"
                disabled={isLoading}
                className="flex-1 rounded-xl border border-[var(--border-main)] bg-[var(--bg-hover)] px-3.5 py-2.5 font-sans text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-60"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
