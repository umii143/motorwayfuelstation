import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Loader2, Cpu, Activity, Clock, Zap, ArrowRight } from 'lucide-react';
import { aiAssistantService, AIActionButton } from '../../../services/aiAssistantService';
import { useStation } from '../../../contexts/StationContext';
import { buildAIContext } from '../../../utils/aiContextBuilder';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  isReceiptFormat?: boolean;
  actionButtons?: AIActionButton[];
  meta?: {
    provider: string;
    model: string;
    latencyMs: number;
    tokensEstimate: number;
  };
}

export const AIAssistantWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      text: "Hello! I'm your ShiftWizard Enterprise AI Copilot.\nAsk me about stock, tank levels, sales, shifts, or supplier credit.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastMeta, setLastMeta] = useState<{ provider: string; model: string; latencyMs: number; tokens: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const store = useStation();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: userMessage }]);
    setIsTyping(true);

    const contextData = buildAIContext({
      products: store.products,
      tanks: store.tanks,
      nozzles: store.nozzles,
      shifts: store.shifts,
      customers: store.customers,
      suppliers: store.suppliers,
      banks: store.banks,
      expenses: store.standaloneExpenses,
    });

    const aiResponse = await aiAssistantService.askQuestion(userMessage, contextData);

    const meta = {
      provider: aiResponse.providerUsed,
      model: aiResponse.modelName,
      latencyMs: aiResponse.latencyMs,
      tokensEstimate: aiResponse.tokensEstimate,
      tokens: aiResponse.tokensEstimate,
    };
    setLastMeta(meta);

    setMessages(prev => [
      ...prev, 
      { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: aiResponse.formattedReceipt,
        isReceiptFormat: true,
        actionButtons: aiResponse.actionButtons,
        meta,
      }
    ]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeProvider = aiAssistantService.getActiveProvider();
  const modelName = aiAssistantService.getModelName();

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl transition-colors active:scale-95 touch-none ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6 pointer-events-none" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-border"></span>
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-8rem)] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Main Header */}
            <div className="bg-indigo-600 px-5 py-3.5 flex items-center justify-between shadow-md z-10 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-card/20 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-sm leading-tight">ShiftWizard AI</h3>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-white/20 text-white rounded-full flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5" />
                      {activeProvider === 'groq' ? 'Groq LLM' : activeProvider === 'gemini' ? 'Gemini LLM' : 'Offline Copilot'}
                    </span>
                  </div>
                  <p className="text-indigo-200 text-xs flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3" /> Powered by Umar Ali ⚡
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                className="p-1.5 text-indigo-200 hover:bg-card/20 hover:text-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Performance Bar */}
            <div className="bg-indigo-950 text-indigo-200 text-[10px] px-4 py-1.5 flex items-center justify-between border-b border-indigo-900 font-mono">
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-subtle relative">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${
                      msg.type === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                        : msg.isReceiptFormat
                        ? 'bg-card border border-border text-foreground rounded-bl-none shadow-sm font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre overflow-x-auto'
                        : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm text-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Interactive Enterprise Action Buttons */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[88%]">
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
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
              
              {isTyping && (
                <div className="flex items-start">
                  <div className="premium-card border border-border text-muted-foreground rounded-bl-none px-4 py-3 flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Executing Operational Analysis...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border">
              <div className="flex items-center gap-2 bg-muted rounded-full p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Why is Petrol stock low? Ask anything..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-slate-400"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  aria-label="Send Message"
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
