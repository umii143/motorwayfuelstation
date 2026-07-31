import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, ChevronDown, Search, Bell, Fuel, Sun, Moon, Settings, Palette, Cylinder, BrainCircuit, Coffee } from 'lucide-react';
import { GlobalSettings, Station } from '../../types';

interface TopHeaderProps {
 onMenuClick: () => void;
 onLanguageToggle?: () => void;
 onSwitchStation?: (stationId: string) => void;
 onCreateStation?: () => void;
 onSetTheme?: (theme: string) => void;
 onThemeToggle?: () => void;
 onSettingsClick?: () => void;
 onTankWizardTrigger?: () => void;
 onJarvisTrigger?: () => void;
 onSearchOpen?: () => void;
 settings: GlobalSettings;
 stations?: Station[];
 activeStationId?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
 onMenuClick, 
 onLanguageToggle,
 onSetTheme,
 onSettingsClick,
 onTankWizardTrigger,
 onJarvisTrigger,
 onSearchOpen,
 settings,
 stations = [],
 activeStationId = ''
}) => {
 const [isThemeOpen, setIsThemeOpen] = useState(false);
 
 const themeDropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {

 if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
 setIsThemeOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const availableThemes = [
 { id: 'cream', label: 'Warm Cream', icon: Coffee },
 { id: 'light', label: 'Classic Light', icon: Sun },
 { id: 'dark', label: 'Executive Dark', icon: Moon },
 { id: 'blue', label: 'Ocean Blue', icon: Palette },
 { id: 'emerald', label: 'Emerald Green', icon: Palette },
 ];
 
 const currentThemeObj = availableThemes.find(t => t.id === settings.theme) || availableThemes[0];

 const activeStation = stations.find(s => s.id === activeStationId) || stations[0];
 const isLube = activeStation?.businessType === 'lube';

 return (
 <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-[60] flex items-center justify-between px-4 lg:px-6 transition-colors shadow-sm dark:shadow-none">
 
 {/* Left: Logo & Hamburger */}
 <div className="flex items-center gap-4">
 <button 
 onClick={onMenuClick}
 aria-label="Open Navigation Menu"
 className="p-2 -ml-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-card/5 rounded-full transition-colors"
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
 <span className="text-[14px] font-black tracking-tight leading-none text-foreground uppercase max-w-[140px] truncate">
 {activeStation?.name || 'PSO Super'}
 </span>
 <span className="text-[9px] font-bold tracking-[0.2em] leading-none text-muted-foreground mt-0.5 uppercase">
 {activeStation?.businessType === 'lube' ? 'Lube Business' : activeStation?.businessType === 'cng' ? 'CNG Station' : 'Fuel Station'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Middle: Actions */}
 <div className="flex items-center gap-2 md:gap-5">
 
 {/* Pro-Level Actions Group */}
 <div className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-full bg-muted border border-border shadow-inner dark:shadow-none transition-colors">
 {/* Language Switcher */}
 <button 
 onClick={onLanguageToggle}
 aria-label="Toggle Language"
 className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-card dark:hover:text-white dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none"
 >
 <Globe className="w-4 h-4" />
 </button>

 {/* Theme Dropdown */}
 <div className="relative" ref={themeDropdownRef}>
 <button 
 onClick={() => setIsThemeOpen(!isThemeOpen)}
 className="flex items-center justify-center w-12 h-8 gap-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-card dark:hover:text-white dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none"
 title="Select Theme"
 aria-label="Select Theme"
 >
 <currentThemeObj.icon className="w-4 h-4" />
 <ChevronDown className={`w-3 h-3 transition-transform${isThemeOpen ? 'rotate-180' : ''}`} />
 </button>
 
 {isThemeOpen && (
 <div className="absolute top-full right-0 mt-3 w-48 bg-card rounded-xl shadow-2xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
 <div className="px-3 pb-2 mb-2 border-b border-border">
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Theme</p>
 </div>
 {availableThemes.map(theme => (
 <button
 key={theme.id}
 onClick={() => {
 onSetTheme?.(theme.id);
 setIsThemeOpen(false);
 }}
 className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors${
 settings.theme === theme.id 
 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold' 
 : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-card/5'
 }`}
 >
 <theme.icon className="w-4 h-4" />
 {theme.label}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Settings */}
 <button 
 onClick={onSettingsClick}
 aria-label="Open Settings"
 className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-card dark:hover:text-white dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none"
 >
 <Settings className="w-4 h-4" />
 </button>

 {/* Tank Wizard */}
 {!isLube && (
 <button 
 onClick={onTankWizardTrigger}
 title="Tank Configuration Wizard"
 aria-label="Tank Configuration Wizard"
 className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-card dark:hover:text-white dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none"
 >
 <Cylinder className="w-4 h-4" />
 </button>
 )}
 </div>

 {/* Search */}
 <div className="hidden sm:flex items-center relative group">
 <Search className="w-4 h-4 text-muted-foreground absolute left-3 transition-colors group-hover:text-indigo-500" />
 <input 
 type="text" 
 placeholder="Search everything..." 
 aria-label="Search or ask Jarvis"
 onFocus={onSearchOpen}
 className="w-56 lg:w-72 h-9 pl-9 pr-10 rounded-full bg-muted text-sm font-medium text-foreground placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent transition-all cursor-pointer"
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 if (onSearchOpen) onSearchOpen();
 else if (onJarvisTrigger) onJarvisTrigger();
 }
 }}
 />
 <button 
 onClick={onJarvisTrigger}
 title="Ask Jarvis"
 aria-label="Ask Jarvis AI Assistant"
 className="absolute right-1.5 p-1.5 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-colors"
 >
 <BrainCircuit className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors" />
 </button>
 </div>

 {/* Notifications */}
 <button aria-label="View Notifications" className="relative p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-card/5 rounded-full transition-colors">
 <Bell className="w-5 h-5" />
 <span className="absolute top-1 right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-border">5</span>
 </button>

 {/* Profile Divider */}
 <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>

 {/* Profile */}
 <button 
 onClick={async () => {
 if (window.confirm('Are you sure you want to sign out?')) {
 const { firebaseSignOut } = await import('../../lib/firebase');
 await firebaseSignOut();
 window.location.reload();
 }
 }}
 aria-label="User Profile and Sign Out"
 className="flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-card/5 p-1 rounded-full md:rounded-xl md:pr-3 transition-colors">
 <div className="relative">
 <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground">
 UA
 </div>
 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-border rounded-full"></div>
 </div>
 <div className="hidden md:flex flex-col items-start">
 <span className="text-xs font-bold leading-none text-foreground">Umar Ali</span>
 <span className="text-[10px] font-semibold text-muted-foreground mt-1">Admin</span>
 </div>
 </button>
 
 </div>
 </header>
 );
};
