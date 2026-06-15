import React from 'react';
import { Menu, Globe, ChevronDown, Search, Bell, Fuel, Sun, Moon, Settings } from 'lucide-react';
import { GlobalSettings } from '../../types';

interface TopHeaderProps {
  onMenuClick: () => void;
  onLanguageToggle?: () => void;
  onThemeToggle?: () => void;
  onSettingsClick?: () => void;
  settings: GlobalSettings;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onMenuClick, 
  onLanguageToggle,
  onThemeToggle,
  onSettingsClick,
  settings 
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#151521] border-b border-slate-200 dark:border-white/5 z-[60] flex items-center justify-between px-4 lg:px-6 transition-colors shadow-sm dark:shadow-none">
      
      {/* Left: Logo & Hamburger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-[#FF7A00] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Fuel className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[14px] font-black tracking-tight leading-none text-slate-800 dark:text-white uppercase">PSO Super</span>
            <span className="text-[9px] font-bold tracking-[0.2em] leading-none text-slate-500 dark:text-slate-400 mt-0.5 uppercase">Fuel Station</span>
          </div>
        </div>
      </div>

      {/* Middle: Actions */}
      <div className="flex items-center gap-2 md:gap-5">
        
        {/* Language Switcher */}
        <button 
          onClick={onLanguageToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-transparent dark:border-white/5"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:inline">{settings.language === 'ur' ? 'UR' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={onThemeToggle}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Settings (Tanks/Config) */}
        <button 
          onClick={onSettingsClick}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-48 lg:w-64 h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-[#1A1A24] text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-transparent dark:border-white/5 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#151521]">5</span>
        </button>

        {/* Profile Divider */}
        <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

        {/* Profile */}
        <button 
          onClick={async () => {
            if (window.confirm('Are you sure you want to sign out?')) {
               const { firebaseSignOut } = await import('../../lib/firebase');
               await firebaseSignOut();
               window.location.reload();
            }
          }}
          className="flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 p-1 rounded-full md:rounded-xl md:pr-3 transition-colors">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
              UA
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#151521] rounded-full"></div>
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-bold leading-none text-slate-800 dark:text-white">Umar Ali</span>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">Admin</span>
          </div>
        </button>
        
      </div>
    </header>
  );
};
