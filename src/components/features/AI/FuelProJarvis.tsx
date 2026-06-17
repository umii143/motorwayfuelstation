import React from 'react';
import { useJarvis } from '../../../hooks/useJarvis';
import { Mic, MicOff, BrainCircuit, Loader2, Sparkles, Phone } from 'lucide-react';

export default function FuelProJarvis() {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    chatHistory,
    startListening,
    stopListening,
    toggleCallMode,
    isCallModeActive
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

      {/* DYNAMIC MAIN AREA */}
      {isCallModeActive ? (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A12] z-10">
          {/* Ambient Background Glow */}
          <div className={`absolute w-96 h-96 rounded-full blur-[100px] transition-all duration-1000 ${
            isSpeaking ? 'bg-indigo-600/40 scale-150' : 
            isProcessing ? 'bg-fuchsia-600/30 animate-pulse' : 
            isListening ? 'bg-cyan-500/20 scale-125' : 'bg-transparent'
          }`} />
          
          {/* The Orb */}
          <div className="relative z-10">
            {/* Outer Rings for Listening */}
            {isListening && !isSpeaking && !isProcessing && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-[spin_3s_linear_infinite] scale-[1.3]" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-[spin_4s_linear_infinite_reverse] scale-[1.6]" />
              </>
            )}
            {/* Ripple Effects for Speaking */}
            {isSpeaking && (
              <>
                <div className="absolute inset-[-30px] rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-[-60px] rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </>
            )}

            {/* Core Orb */}
            <div className={`w-48 h-48 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-500 ${
              isSpeaking ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_80px_-15px_rgba(99,102,241,0.5)] scale-110' :
              isProcessing ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-[0_0_60px_-15px_rgba(192,38,211,0.4)]' :
              'bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]'
            }`}>
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : isSpeaking ? (
                <BrainCircuit className="w-20 h-20 text-white animate-pulse" />
              ) : (
                <Mic className="w-16 h-16 text-cyan-400" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="mt-16 text-center z-10 h-24">
            <h2 className={`text-2xl font-black tracking-widest uppercase mb-3 transition-colors duration-300 ${
              isSpeaking ? 'text-indigo-400' : isProcessing ? 'text-fuchsia-400' : 'text-cyan-400'
            }`}>
              {isSpeaking ? 'Jarvis is Speaking' : isProcessing ? 'Jarvis is Thinking' : 'Jarvis is Listening'}
            </h2>
            {isListening && transcript && (
              <p className="text-slate-300 italic max-w-md mx-auto text-center px-6 text-lg font-medium">"{transcript}"</p>
            )}
          </div>
        </div>
      ) : (
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
      )}

      {/* WAVEFORM ORB (LISTENING STATE OVERLAY) - Only show in one-off mode, not call mode */}
      {isListening && !isCallModeActive && (
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
          {isCallModeActive ? (
            <button
              onClick={toggleCallMode}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all shadow-lg bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-in slide-in-from-bottom-2"
            >
              <Phone className="w-6 h-6 rotate-135" style={{ transform: 'rotate(135deg)' }} /> End Call
            </button>
          ) : (
            <>
              <button
                onClick={startListening}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                  isProcessing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                {isProcessing ? "Processing..." : "Tap to Speak"}
              </button>
              
              <button
                onClick={toggleCallMode}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                  isProcessing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                }`}
              >
                <Phone className="w-6 h-6" /> Start Live Call
              </button>
            </>
          )}
        </div>
        <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Powered by Gemini 2.5 Flash</p>
      </div>
    </div>
  );
}
