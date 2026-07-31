import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';

import { useAppStoreProps } from '../hooks/useAppStoreProps';
import { useAuth } from '../contexts/AuthContext';
import { useNativeAuth } from '../contexts/NativeAuthContext';

import { TopHeader } from '../components/layouts/TopHeader';
import { SidebarDrawer } from '../components/layouts/SidebarDrawer';
import { BottomNavigation } from '../components/layouts/BottomNavigation';
import { Footer } from '../components/layouts/Footer';
import OfflineIndicator from '../components/ui/OfflineIndicator';
import { AutoUpdatePrompt } from '../components/shared/AutoUpdatePrompt';
import LocalStorageMigrationWizard from '../components/features/LocalStorageMigrationWizard';
import { CrashCenter as ErrorBoundary } from '../components/ui/CrashCenter';
import LoadingScreen from '../components/ui/LoadingScreen';
import { PageTransition } from '../components/shared/PageTransition';
import AuthInterface from '../components/layouts/AuthInterface';
import { useStationStore } from '../stores/useStationStore';
import { AppModals } from './AppModals';
import { EOCEventSubscriber } from '../services/core/EOCEventSubscriber';

// Dynamically imported components for modals/overlays
const GlobalSearchModal = React.lazy(() => import('../components/shared/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const TankConfigurationWizard = React.lazy(() => import('../components/features/TankConfigurationWizard'));
const SmartSuggestions = React.lazy(() => import('../components/shared/SmartSuggestions').then(m => ({ default: m.SmartSuggestions })));
const AIAssistant = React.lazy(() => import('../components/features/AIAssistant/AIAssistant'));

import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useAppLock } from '../hooks/useAppLock';
import ScreenLock from '../components/ui/ScreenLock';
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { PoweredByUmarAli } from '../components/shared/PoweredByUmarAli';
import { dbFS } from '../lib/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { getBusinessTypeForStation } from '../lib/businessScope';
import { logger } from '../lib/logger';
import { Pump, Product, Tank, Nozzle } from '../types';

export const AppShell = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [searchOpen, setSearchOpen] = useState(false);
 const [isTankWizardOpen, setIsTankWizardOpen] = useState(false);

 const { user: authenticatedUser, isSuperAdmin, logout, organization, checkingAuth } = useAuth();
 const { isLocked } = useNativeAuth();
 const props = useAppStoreProps();
 const { 
 settings, activeStationId, stations, toast, confirmDialog, 
 handleSwitchStation, setSettings, setTanks, setNozzles, setProducts, setStaff, setPumps
 } = props;

 const { isAppLocked, unlockApp } = useAppLock(settings);
 const { isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(async () => {
 await new Promise(resolve => setTimeout(resolve, 800));
 window.location.reload();
 });

  // Automatically close mobile sidebar on location/route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Global Ctrl + K Command Palette Keyboard Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Theme Synchronization
  React.useEffect(() => {
    const root = document.documentElement;
    let theme = settings?.theme || 'cream';
    if (theme === 'white') theme = 'light';
    if (theme === 'sunset' || theme === 'orange') theme = 'cream';
    
    // Reset classes
    root.classList.remove('light', 'dark', 'theme-cream', 'theme-creamy', 'theme-light', 'theme-dark', 'theme-sunset', 'theme-blue', 'theme-emerald', 'theme-orange', 'theme-white');
    
    // Apply current theme
    const isDark = ['dark', 'blue', 'emerald'].includes(theme);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.classList.add(`theme-${theme}`);
    if (theme === 'cream') {
      root.classList.add('theme-creamy');
    }
  }, [settings?.theme]);

 const isLubeBusiness = stations.find(s => s.id === activeStationId)?.businessType === 'lube';

 // Extract subscription logic
 const daysRemaining = React.useMemo(() => {
 if (!organization?.expiryDate && !organization?.trialEndDate) return 0;
 const end = new Date(organization.expiryDate || organization.trialEndDate);
 const now = new Date();
 const diff = end.getTime() - now.getTime();
 return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
 }, [organization?.expiryDate, organization?.trialEndDate]);

 const isExpired = organization?.subscriptionStatus === 'expired' || (organization?.subscriptionStatus === 'trialing' && daysRemaining === 0);

 const handleLogout = async () => {
 await logout();
 navigate('/dashboard');
 };

 const handleNavigate = (view: string) => {
 // Convert old view strings to paths
 let path = `/${view.replace(/_/g, '-')}`;
 if (view === 'dashboard') path = '/';
 navigate(path);
 setIsSidebarOpen(false);
 };

 if (checkingAuth) {
 return <LoadingScreen />;
 }

 if (!authenticatedUser) {
 return (
 <AuthInterface
 settings={settings}
 onLoginSuccess={() => handleNavigate('dashboard')}
 />
 );
 }

 const activeView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1).replace(/-/g, '_');

 return (
 <div className={`h-[100dvh] w-full overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-[var(--color-accent)]/20 selection:text-[var(--color-accent)] transition-colors duration-500`}>
 <EOCEventSubscriber />
 <OfflineIndicator />
 <AutoUpdatePrompt />
 <LocalStorageMigrationWizard />

 {/* Top Header */}
 <TopHeader
 settings={settings}
 stations={stations}
 activeStationId={activeStationId}
 onSwitchStation={handleSwitchStation}
 onCreateStation={() => handleNavigate('onboarding')}
 onMenuClick={() => setIsSidebarOpen(true)}
 onLanguageToggle={() => {
 const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
 const currentIndex = languages.indexOf(settings.language || 'en');
 const nextIndex = (currentIndex + 1) % languages.length;
 setSettings({ ...settings, language: languages[nextIndex] });
 }}
 onThemeToggle={() => {
    const themes: ('cream' | 'light' | 'dark' | 'blue' | 'emerald')[] = ['cream', 'light', 'dark', 'blue', 'emerald'];
    const currentIndex = themes.indexOf((settings.theme as any) || 'cream');
    const nextIndex = (currentIndex + 1) % themes.length;
    setSettings({ ...settings, theme: themes[nextIndex] as any });
  }}
 onSetTheme={(theme) => setSettings({ ...settings, theme: theme as any })}
 onSettingsClick={() => handleNavigate('configuration')}
 onTankWizardTrigger={() => setIsTankWizardOpen(true)}
 onSearchOpen={() => setSearchOpen(true)}
 onJarvisTrigger={() => {
 useStationStore.getState().setAIAssistantVisible?.(true);
 handleNavigate('jarvis');
 }}
 />

 <SidebarDrawer
 isOpen={isSidebarOpen}
 onClose={() => setIsSidebarOpen(false)}
 onViewChange={handleNavigate}
 activeView={activeView}
 settings={settings}
 isLubeBusiness={isLubeBusiness}
 isSuperAdmin={isSuperAdmin}
 stations={stations}
 activeStationId={activeStationId}
 onSwitchStation={handleSwitchStation}
 onCreateStation={() => handleNavigate('onboarding')}
 onLanguageToggle={() => {
 const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
 const currentIndex = languages.indexOf(settings.language || 'en');
 const nextIndex = (currentIndex + 1) % languages.length;
 setSettings({ ...settings, language: languages[nextIndex] });
 }}
 onThemeToggle={() => {
    const themes: ('cream' | 'light' | 'dark' | 'blue' | 'emerald')[] = ['cream', 'light', 'dark', 'blue', 'emerald'];
    const currentIndex = themes.indexOf((settings.theme as any) || 'cream');
    const nextIndex = (currentIndex + 1) % themes.length;
    setSettings({ ...settings, theme: themes[nextIndex] as any });
  }}
 onLogout={handleLogout}
 />

 {/* Main Container Workspace */}
 <main 
 className="flex-1 w-full pt-[64px] pb-0 lg:pl-[280px] flex flex-col overflow-y-auto scroll-container relative bg-background transition-all"
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 >
 {(!isExpired && daysRemaining <= 7 && activeView !== 'subscription_hub') && (
 <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between z-10 shrink-0">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-orange-100 rounded-full text-orange-600 shrink-0"><AlertTriangle className="h-4 w-4" /></div>
 <p className="text-sm font-bold text-orange-900">
 Your FuelPro {organization?.subscriptionTier} subscription will expire in <span className="text-red-600">{daysRemaining} days</span>. 
 </p>
 </div>
 <button onClick={() => handleNavigate('subscription_hub')} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 whitespace-nowrap">
 Renew Now
 </button>
 </div>
 )}
 
 {isRefreshing && (
 <div className="absolute top-16 left-0 right-0 flex justify-center py-4 z-50">
 <div className="bg-card shadow-xl rounded-full p-2 border border-border flex items-center justify-center">
 <RefreshCw className="h-6 w-6 text-orange-600 animate-spin" />
 </div>
 </div>
 )}
 <div className="p-4 lg:p-8 w-full max-w-[1800px] mx-auto flex-1 flex flex-col">
 <div className="flex-grow">
 <PageTransition viewKey={activeView}>
 <ErrorBoundary>
 <React.Suspense fallback={<LoadingScreen />}>
 {/* OUTLET RENDERS THE ACTIVE ROUTE */}
 <Outlet context={props} />
 </React.Suspense>
 </ErrorBoundary>
 </PageTransition>
 </div>
 </div>
 <Footer />
 <BottomNavigation 
    activeView={activeView} 
    onNavigate={handleNavigate} 
    onMenuClick={() => setIsSidebarOpen(true)} 
  />
 </main>


 <AppModals 
 toast={toast}
 confirmDialog={confirmDialog}
 settings={settings}
 shifts={props.shifts}
 products={props.products}
 customers={props.customers}
 tanks={props.tanks}
 nozzles={props.nozzles}
 staff={props.staff}
 />

 <GlobalSearchModal
 isOpen={searchOpen}
 onClose={() => setSearchOpen(false)}
 onNavigate={handleNavigate}
 />


 <AnimatePresence>
 {isTankWizardOpen && (
 <React.Suspense fallback={null}>
 <TankConfigurationWizard
 currentLanguage={settings.language}
 existingProducts={props.products}
 onComplete={(data) => {
 // Merge new products, tanks, nozzles
 if (data.products && data.products.length > 0) {
 const newProducts = data.products.filter(p => !props.products.find(ep => ep.id === p.id));
 if (newProducts.length > 0) props.setProducts([...props.products, ...newProducts as Product[]]);
 }
 if (data.tanks && data.tanks.length > 0) {
 props.setTanks([...props.tanks, ...data.tanks as Tank[]]);
 }
 if (data.nozzles && data.nozzles.length > 0) {
 props.setNozzles([...props.nozzles, ...data.nozzles as Nozzle[]]);
 }
 setIsTankWizardOpen(false);
 import('../stores/useStationStore').then(({ useStationStore }) => {
 useStationStore.getState().showToast(settings.language === 'ur' ? 'ٹینک کنفیگریشن مکمل ہو گئی' : 'Tank Configuration Complete', 'success');
 });
 }}
 onCancel={() => setIsTankWizardOpen(false)}
 />
 </React.Suspense>
 )}
 </AnimatePresence>
 </div>
 );
};
