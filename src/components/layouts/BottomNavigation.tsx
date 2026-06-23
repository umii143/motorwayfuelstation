import React from 'react';
import { Home, LineChart, BookOpen, Grid, BrainCircuit } from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  onMenuClick?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeView, onNavigate, onMenuClick }) => {
  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed nav */}
      <div className="h-20 w-full block lg:hidden"></div>
      
      <div className="fixed bottom-0 left-0 right-0 min-h-[4rem] pb-[env(safe-area-inset-bottom)] bg-white dark:bg-[#151521] border-t border-slate-200 dark:border-white/5 z-[60] flex items-center justify-around px-2 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        
        {/* Dashboard */}
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeView === 'dashboard' ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        {/* Sales */}
        <button 
          onClick={() => onNavigate('lube_pos')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeView === 'lube_pos' || activeView === 'shift_wizard' ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LineChart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Sales</span>
        </button>

        {/* Center Floating Button (Jarvis) */}
        <div className="relative w-16 h-full flex justify-center">
          <button 
            onClick={() => onNavigate('jarvis')}
            aria-label="Ask AI Assistant"
            className={`absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-[#151521] transition-transform active:scale-95 ${
              activeView === 'jarvis' 
                ? 'bg-indigo-600 shadow-indigo-500/50 scale-110' 
                : 'bg-slate-800 dark:bg-slate-700 hover:bg-indigo-600 hover:shadow-indigo-500/50'
            }`}
          >
            <BrainCircuit className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        {/* Ledger */}
        <button 
          onClick={() => onNavigate('customers')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeView === 'customers' ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Ledger</span>
        </button>

        {/* Menu */}
        <button 
          onClick={() => onMenuClick ? onMenuClick() : onNavigate('settings')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeView === 'settings' ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

      </div>
    </>
  );
};
