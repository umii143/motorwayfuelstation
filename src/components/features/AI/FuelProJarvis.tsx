import React from 'react';
import { useJarvis } from '../../../hooks/useJarvis';
import { Mic, MicOff, BrainCircuit, Loader2, Sparkles } from 'lucide-react';

export default function FuelProJarvis() {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    chatHistory,
    startListening,
    stopListening
  } = useJarvis();

  return (
    <div className="w-full h-[calc(100vh-80px)] md:h-full bg-slate-50 dark:bg-[#0B0F19] rounded-[32px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER */}
      <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#151521] flex justify-between items-center z-10 shadow-sm relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-lg ${isSpeaking ? 'animate-pulse shadow-indigo-500/50' : ''}`}>
              <BrainCircuit className="w-6 h-6" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#151521] rounded-full animate-bounce" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              FuelPro Jarvis <Sparkles className="w-4 h-4 text-indigo-500" />
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Enterprise AI Voice Assistant</p>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {chatHistory.map((msg, idx) => {
          if (msg.role === 'function') return null; // Hide raw function responses
          if (msg.parts[0]?.functionCall) {
            return (
              <div key={idx} className="flex justify-center">
                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Executing {msg.parts[0].functionCall.name}...
                </div>
              </div>
            );
          }
          
          const isUser = msg.role === 'user';
          
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                  : 'bg-white dark:bg-[#1A1A24] text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm border border-slate-200 dark:border-white/5'
              }`}>
                <p className={`text-base leading-relaxed ${isUser ? 'font-medium' : 'font-medium'}`}>
                  {msg.parts[0].text}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Real-time transcript preview */}
        {isListening && transcript && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
            <div className="max-w-[80%] rounded-2xl p-4 bg-indigo-600/50 text-white/80 rounded-br-sm shadow-md italic">
              <p className="text-base leading-relaxed font-medium">
                {transcript}
              </p>
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-[#1A1A24] p-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-200 dark:border-white/5 flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* WAVEFORM ORB (LISTENING STATE OVERLAY) */}
      {isListening && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50 relative z-10">
              <Mic className="w-12 h-12 text-white animate-pulse" />
            </div>
            {/* Ripple Effects */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-20px] rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
          <p className="mt-8 text-white font-bold text-lg tracking-widest uppercase">Listening...</p>
          <button 
            onClick={stopListening}
            className="mt-12 px-8 py-3 bg-white text-slate-900 rounded-full font-black shadow-xl hover:scale-105 transition-transform"
          >
            Done Speaking
          </button>
        </div>
      )}

      {/* FOOTER CONTROLS */}
      <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#151521] z-10">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
              isListening 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25' 
                : isProcessing
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6" /> Stop Recording
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Processing AI...
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" /> Tap to Speak
              </>
            )}
          </button>
        </div>
        <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Powered by Gemini 2.5 Flash</p>
      </div>
    </div>
  );
}
