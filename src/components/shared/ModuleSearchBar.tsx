import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpDown, Download, Mic, MicOff } from 'lucide-react';
import { useStation } from '../../contexts/StationContext';

// Define types for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface ModuleSearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
  onSort?: () => void;
  onExport?: () => void;
  moduleName: string;
  className?: string;
}

export function ModuleSearchBar({
  placeholder,
  onSearch,
  onFilter,
  onSort,
  onExport,
  moduleName,
  className = ''
}: ModuleSearchBarProps) {
  const { settings, showAlert } = useStation();
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isUrdu = settings.language === 'ur';

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // Set language based on app settings
      recognition.lang = isUrdu ? 'ur-PK' : 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        onSearch(transcript);
        setIsListening(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        // eslint-disable-next-line no-console
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        showAlert('error', isUrdu ? 'آواز کی شناخت میں مسئلہ ہوا' : 'Voice recognition failed');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isUrdu, onSearch, showAlert]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      showAlert('error', isUrdu ? 'آپ کا براؤزر آواز کی شناخت کو سپورٹ نہیں کرتا' : 'Voice search is not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  };

  return (
    <div className={`flex flex-row gap-2 items-center justify-between bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-2 sm:p-3 shadow-sm ${className}`}>
      {/* Search Input */}
      <div className="relative w-full sm:max-w-md lg:max-w-lg flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder={isListening ? (isUrdu ? 'سن رہا ہے...' : 'Listening...') : (isUrdu ? `تلاش کریں ${moduleName}...` : placeholder)}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg py-2 pl-9 pr-24 text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-accent)] focus:ring-1 focus:ring-[var(--primary-accent)] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={toggleVoiceSearch}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isListening 
                ? 'bg-rose-100 text-rose-600 animate-pulse' 
                : 'text-[var(--text-muted)] hover:text-[var(--primary-accent)] hover:bg-[var(--bg-hover)]'
            }`}
            title={isUrdu ? 'آواز سے تلاش کریں' : 'Voice Search'}
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          <div className="text-[10px] font-bold text-[var(--text-muted)] hidden sm:block pointer-events-none select-none uppercase tracking-widest pl-2 border-l border-[var(--border-main)]">
            {moduleName}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-auto shrink-0 overflow-x-auto">
        {onFilter && (
          <button
            onClick={onFilter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Filter className="h-3.5 w-3.5 text-[var(--primary-accent)]" />
            <span className="hidden sm:inline">{isUrdu ? 'فلٹر' : 'Filter'}</span>
          </button>
        )}
        
        {onSort && (
          <button
            onClick={onSort}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--primary-accent)]" />
            <span className="hidden sm:inline">{isUrdu ? 'ترتیب' : 'Sort'}</span>
          </button>
        )}
        
        {onExport && (
          <div className="h-6 w-px bg-[var(--border-main)] mx-1 hidden sm:block"></div>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary-accent)] hover:opacity-90 text-white text-xs font-bold transition-opacity shadow-sm cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isUrdu ? 'ایکسپورٹ' : 'Export'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
