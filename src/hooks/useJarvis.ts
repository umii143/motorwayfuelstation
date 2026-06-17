import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api';
import { jarvisFunctionDeclarations, executeJarvisFunction } from '../lib/AIFunctionRegistry';

interface Message {
  role: 'user' | 'model' | 'function';
  parts: { text?: string; functionCall?: any; functionResponse?: any }[];
}

export function useJarvis() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallModeActive, setIsCallModeActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: "Hello Sir. I am Jarvis, your FuelPro AI Assistant. How can I help you today?" }]
    }
  ]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const callModeRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ur-PK'; // Urdu by default, supports mixed English

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current) return;
    setIsSpeaking(true);
    
    // Quick language detection heuristic: if mostly ASCII, use English, else use Urdu/Hindi
    const isUrdu = /[ا-ی]/.test(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isUrdu ? 'ur-PK' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callModeRef.current) {
        // Restart listening after speaking finishes
        setTimeout(() => {
          if (callModeRef.current) {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              console.error("Auto-restart failed", e);
            }
          }
        }, 500);
      }
    };
    synthRef.current.speak(utterance);
  };

  const processAudioInput = async (finalTranscript: string) => {
    if (!finalTranscript.trim()) return;
    
    // Check if user wants to end call manually via voice
    const lowerText = finalTranscript.toLowerCase();
    if (callModeRef.current && (lowerText.includes('stop') || lowerText.includes('bye') || lowerText.includes('end') || lowerText.includes('band karo') || lowerText.includes('khatam karo') || lowerText.includes('shukriya'))) {
      callModeRef.current = false;
      setIsCallModeActive(false);
      speak("Goodbye Sir, ending the call.");
      return;
    }

    setIsProcessing(true);
    const newUserMsg: Message = { role: 'user', parts: [{ text: finalTranscript }] };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);

    try {
      const systemInstruction = {
        parts: [{ text: "You are FuelPro Jarvis, an advanced AI Operating System for a Fuel Station in Pakistan. You must respond to the user in their preferred language (mostly Urdu or Roman Urdu). You have access to real-time ERP data via function calls. Keep answers concise, professional, and business-focused." }]
      };

      // 1. Send text to backend
      const res = await fetchWithAuth('/api/ai/jarvis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({ role: m.role === 'function' ? 'user' : m.role, parts: m.parts })), // Formatting for Gemini 2.5
          tools: jarvisFunctionDeclarations,
          systemInstruction
        })
      });

      const data = await res.json();

      if (data.error) {
        console.error('Backend returned error:', data.error);
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: `System Error: ${data.error}` }] }]);
        speak("Sir, there is a server error: " + (data.error.includes("configured") ? "API key is missing" : data.error));
        return;
      }

      // 2. Handle Function Call
      if (data.type === 'function_call') {
        const funcCallMsg: Message = { role: 'model', parts: [{ functionCall: { name: data.functionName, args: data.functionArgs } }] };
        setChatHistory(prev => [...prev, funcCallMsg]);

        // Execute local DB function
        const mockStores = {}; // In a real implementation, bind Zustand hooks here or pass them as args
        const result = await executeJarvisFunction(data.functionName, data.functionArgs, mockStores);

        const funcResMsg: Message = { 
          role: 'function', 
          parts: [{ functionResponse: { name: data.functionName, response: result } }] 
        };
        const historyWithFunc = [...updatedHistory, funcCallMsg, funcResMsg];
        setChatHistory(historyWithFunc);

        // 3. Send result back to Gemini for natural language response
        const secondRes = await fetchWithAuth('/api/ai/jarvis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: historyWithFunc.map(m => ({ role: m.role === 'function' ? 'user' : m.role, parts: m.parts })),
            systemInstruction
          })
        });

        const secondData = await secondRes.json();
        if (secondData.type === 'text') {
          setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: secondData.reply }] }]);
          speak(secondData.reply);
        }
      } 
      // 4. Handle Direct Text
      else if (data.type === 'text') {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: data.reply }] }]);
        speak(data.reply);
      }

    } catch (err) {
      console.error('Jarvis Error:', err);
      speak("Sorry Sir, I encountered a network error connecting to the backend gateway.");
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      setIsListening(true);
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Microphone already started", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      processAudioInput(transcript);
    }
  }, [isListening, transcript]);

  const toggleCallMode = useCallback(() => {
    if (callModeRef.current) {
      // Turn off
      callModeRef.current = false;
      setIsCallModeActive(false);
      if (isListening) stopListening();
      if (synthRef.current?.speaking) synthRef.current.cancel();
    } else {
      // Turn on
      callModeRef.current = true;
      setIsCallModeActive(true);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    isProcessing,
    isCallModeActive,
    transcript,
    chatHistory,
    startListening,
    stopListening,
    toggleCallMode
  };
}
