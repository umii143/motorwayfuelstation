import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, ChevronDown, Search, Bell, Fuel, Sun, Moon, Settings, Palette, Store, Cylinder, BrainCircuit } from 'lucide-react';
import { GlobalSettings, Station } from '../../types';

interface TopHeaderProps {
  onMenuClick: () => void;
  onLanguageToggle?: () => void;
  onThemeToggle?: () => void;
  onSetTheme?: (theme: string) => void;
  onSettingsClick?: () => void;
  onTankWizardTrigger?: () => void;
  onJarvisTrigger?: () => void;
  settings: GlobalSettings;
  stations?: Station[];
  activeStationId?: string;
  onSwitchStation?: (id: string) => void;
  onCreateStation?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onMenuClick, 
  onLanguageToggle,
  onThemeToggle,
  onSetTheme,
  onSettingsClick,
  onTankWizardTrigger,
  onJarvisTrigger,
  settings,
  stations = [],
  activeStationId,
  onSwitchStation,
  onCreateStation
}) => {
  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStationMenuOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableThemes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Executive', icon: Moon },
    { id: 'white', label: 'Pure White', icon: Sun },
    { id: 'blue', label: 'Corporate Blue', icon: Palette },
    { id: 'emerald', label: 'Emerald', icon: Palette },
    { id: 'orange', label: 'Sunset', icon: Palette },
  ];
  
  const currentThemeObj = availableThemes.find(t => t.id === settings.theme) || availableThemes[0];

  const activeStation = stations.find(s => s.id === activeStationId) || stations[0];
  const isLube = activeStation?.businessType === 'lube';

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

        {/* Station Identity (Read-only) */}
        <div className="relative ml-2">
          <div className="flex items-center gap-3 p-1.5 pr-3 rounded-full transition-colors">
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

        {/* Theme Dropdown */}
        <div className="relative" ref={themeDropdownRef}>
          <button 
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-transparent dark:border-white/5"
            title="Select Theme"
          >
            <currentThemeObj.icon className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">{currentThemeObj.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isThemeOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1A1A24] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theme</p>
              </div>
              {availableThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSetTheme?.(theme.id);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    settings.theme === theme.id 
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <theme.icon className="w-4 h-4" />
                  {theme.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings (Tanks/Config) */}
        <button 
          onClick={onSettingsClick}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Tank Wizard */}
        {!isLube && (
          <button 
            onClick={onTankWizardTrigger}
            title="Tank Configuration Wizard"
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <Cylinder className="w-5 h-5" />
          </button>
        )}

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
            <BrainCircuit className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors" />
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
