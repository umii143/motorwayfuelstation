import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { aiAssistantService } from '../../../services/aiAssistantService';
import { useStation } from '../../../contexts/StationContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  isReceiptFormat?: boolean;
}

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      text: "Hello! I'm your ShiftWizard Assistant.\nAsk me about stock, shifts, or ledgers.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const store = useStation(); // Use global state as context for AI

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add User Message
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: userMessage }]);
    setIsTyping(true);

    // Prepare Context from Store to feed the AI
    const contextData = {
      tanks: store.tanks.map(t => ({ name: t.name, volume: t.currentStock, capacity: t.capacity })),
      recentShifts: store.shifts.slice(0, 3).map(s => ({ date: s.date, status: s.status })),
      suppliers: store.suppliers.length,
      customers: store.customers.length
    };

    // Ask AI Service
    const aiResponse = await aiAssistantService.askQuestion(userMessage, contextData);

    setMessages(prev => [
      ...prev, 
      { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: aiResponse.formattedReceipt,
        isReceiptFormat: true
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
        </span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between shadow-md z-10 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">ShiftWizard AI</h3>
                  <p className="text-indigo-200 text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Powered by Umar Ali ⚡
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-indigo-200 hover:bg-white/20 hover:text-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.type === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                        : msg.isReceiptFormat
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm text-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Generating Receipt...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for stock updates, shifts..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
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
