import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, ChevronDown, Search, Bell, Fuel, Sun, Moon, Settings, Palette, Store } from 'lucide-react';
import { GlobalSettings, Station } from '../../types';

interface TopHeaderProps {
  onMenuClick: () => void;
  onLanguageToggle?: () => void;
  onThemeToggle?: () => void;
  onSettingsClick?: () => void;
  onJarvisTrigger?: () => void;
  settings: GlobalSettings;
  stations?: Station[];
  activeStationId?: string;
  onSwitchStation?: (id: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onMenuClick, 
  onLanguageToggle,
  onThemeToggle,
  onSettingsClick,
  onJarvisTrigger,
  settings,
  stations = [],
  activeStationId,
  onSwitchStation,
  onCreateStation
}) => {
  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeStation = stations.find(s => s.id === activeStationId) || stations[0];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#151521] border-b border-slate-200 dark:border-white/5 z-[60] flex items-center justify-between px-4 lg:px-6 transition-colors shadow-sm dark:shadow-none">
      
      {/* Left: Logo & Hamburger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Station Switcher / Identity */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setIsStationMenuOpen(!isStationMenuOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-[#FF7A00] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Fuel className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex flex-col hidden sm:flex text-left">
              <span className="text-[14px] font-black tracking-tight leading-none text-slate-800 dark:text-white uppercase max-w-[140px] truncate">
                {activeStation?.name || 'PSO Super'}
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] leading-none text-slate-500 dark:text-slate-400 mt-0.5 uppercase">
                {activeStation?.businessType === 'lube' ? 'Lube Business' : activeStation?.businessType === 'cng' ? 'CNG Station' : 'Fuel Station'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block ml-1 transition-transform ${isStationMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isStationMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1f2937] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700/50 py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Station</span>
              </div>
              {stations.map(station => (
                <button
                  key={station.id}
                  onClick={() => {
                    onSwitchStation?.(station.id);
                    setIsStationMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${station.id === activeStationId ? 'bg-orange-50 dark:bg-orange-500/10' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${station.id === activeStationId ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${station.id === activeStationId ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {station.name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {station.businessType === 'lube' ? 'Lube Business' : station.businessType === 'cng' ? 'CNG Station' : 'Fuel Station'}
                    </div>
                  </div>
                </button>
              ))}
              <div className="px-3 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    onCreateStation?.();
                    setIsStationMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-dashed border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500/30"
                >
                  <span>+ Create New Business</span>
                </button>
              </div>
            </div>
          )}
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
          <Palette className="w-5 h-5" />
        </button>

        {/* Settings (Tanks/Config) */}
        <button 
          onClick={onSettingsClick}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 transition-colors group-hover:text-indigo-500" />
          <input 
            type="text" 
            placeholder="Search or ask Jarvis..." 
            className="w-56 lg:w-72 h-9 pl-9 pr-10 rounded-full bg-slate-100 dark:bg-[#1A1A24] text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent dark:border-white/5 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onJarvisTrigger) {
                onJarvisTrigger();
              }
            }}
          />
          <button 
            onClick={onJarvisTrigger}
            title="Ask Jarvis"
            className="absolute right-1.5 p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
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
