import { StationProvider, useStation } from './contexts/StationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ScannerProvider } from './contexts/ScannerContext';
import LocalStorageMigrationWizard from './components/features/LocalStorageMigrationWizard';
import { AutoUpdatePrompt } from './components/shared/AutoUpdatePrompt';
import { firestoreDb } from './data/firestore';
import { writeBatch, doc, setDoc } from 'firebase/firestore';
import { dbFS } from './lib/firebase';
import { fetchWithAuth } from './lib/api';
import { migrateAccountsPayable } from './utils/migrations';
import { getBusinessTypeForStation, resolveViewForBusiness } from './lib/businessScope';
import { initDatabase } from './data/db';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { PoweredByUmarAli } from './components/shared/PoweredByUmarAli';
import { TopHeader } from './components/layouts/TopHeader';
import { BottomNavigation } from './components/layouts/BottomNavigation';
import { SidebarDrawer } from './components/layouts/SidebarDrawer';
import { SyncEngine } from './services/core/SyncEngine';
import OfflineIndicator from './components/ui/OfflineIndicator';

// Start the enterprise offline-first sync engine immediately
SyncEngine.start().catch(console.error);
const Dashboard = React.lazy(() => import('./components/features/Dashboard'));
const ShiftWizard = React.lazy(() => import('./components/features/ShiftWizard'));
const ShiftLogs = React.lazy(() => import('./components/features/ShiftLogs'));
const CustomerIntelligenceCenter = React.lazy(() => import('./components/features/CustomerIntelligenceCenter/CustomerIntelligenceCenter'));
const SupplierCommandCenter = React.lazy(() => import('./components/features/SupplierCommandCenter/SupplierCommandCenter'));
const Ledger = React.lazy(() => import('./components/features/Ledger'));
const Inventory = React.lazy(() => import('./components/features/Inventory'));
const Expenses = React.lazy(() => import('./components/features/Expenses'));
const LubePOS = React.lazy(() => import('./components/features/LubePOS'));
const Reports = React.lazy(() => import('./components/features/Reports'));
const LubeReports = React.lazy(() => import('./components/features/LubeReports'));
import LoadingScreen from './components/ui/LoadingScreen';
const DiscountsHub = React.lazy(() => import('./components/features/DiscountsHub'));
import { SplashSequence } from './components/features/SplashSequence';
import { LanguageSelect } from './components/features/Onboarding/LanguageSelect';
import { WelcomeCarousel } from './components/features/Onboarding/WelcomeCarousel';
import { NativeAuthProvider, useNativeAuth } from './contexts/NativeAuthContext';
import { SecurityScreen } from './components/features/SecurityScreen';
import { mobileEngine } from './services/mobile/MobileExperienceEngine';

const StaffPanel = React.lazy(() => import('./components/features/Staff'));
const SettingsPanel = React.lazy(() => import('./components/features/Settings'));

const OnboardingWizard = React.lazy(() => import('./components/features/OnboardingWizard'));
import AuthInterface from './components/layouts/AuthInterface'; // Kept static for immediate auth render
const SecurityHub = React.lazy(() => import('./components/features/SecurityHub'));
const SubscriptionHub = React.lazy(() => import('./components/features/SubscriptionHub'));
const LicenseManager = React.lazy(() => import('./components/features/LicenseManager'));
const BankCashPanel = React.lazy(() => import('./components/features/BankCashPanel'));
const DigitalCashPanel = React.lazy(() => import('./components/features/DigitalCashPanel'));
const PriceManagement = React.lazy(() => import('./components/features/PriceManagement'));
const EnterpriseHub = React.lazy(() => import('./components/features/EnterpriseHub'));
const DipCalculator = React.lazy(() => import('./components/features/DipCalculator/DipCalculator'));
const OGRAPriceSync = React.lazy(() => import('./components/features/OGRAPriceSync/OGRAPriceSync'));
const AIAssistant = React.lazy(() => import('./components/features/AIAssistant/AIAssistant'));
const CommunicationDashboard = React.lazy(() => import('./components/features/CommunicationCenter/CommunicationDashboard'));
const BIDashboard = React.lazy(() => import('./components/features/BIAnalytics/BIDashboard'));
const SyncCenter = React.lazy(() => import('./components/features/SyncCenter/SyncCenter'));

// AI Hub
const AIAnalyticsHub = React.lazy(() => import('./components/features/AIAnalyticsHub/AIAnalyticsHub'));
const RiskCenter = React.lazy(() => import('./components/features/RiskCenter/RiskCenter'));
const ExecutiveDashboard = React.lazy(() => import('./components/features/ExecutiveDashboard/ExecutiveDashboard'));
const TreasuryCenter = React.lazy(() => import('./components/features/TreasuryCenter/TreasuryCenter'));
import { PageTransition } from './components/shared/PageTransition';
import { GlobalSearchModal } from './components/shared/GlobalSearchModal';
import { SmartSuggestions } from './components/shared/SmartSuggestions';
import { useKeyboardShortcut, SHORTCUTS } from './hooks/useKeyboardShortcut';
import { buildSearchIndex, rebuildModuleIndex } from './services/searchService';
import { CrashCenter as ErrorBoundary } from './components/ui/CrashCenter';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { usePullToRefresh } from './hooks/usePullToRefresh';

import {
  Pump,
  Station
} from './types';

function MainApp() {
  // Navigation active view routing
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Centralized Auth Context connection
  const { user: authenticatedUser, checkingAuth, isSuperAdmin, logout } = useAuth();

  const { isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(async () => {
    // Short artificial delay for smooth UX and animation
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.reload();
  });

  const organization = useAuth().organization;
  const daysRemaining = React.useMemo(() => {
    if (!organization?.expiryDate && !organization?.trialEndDate) return 0;
    const end = new Date(organization.expiryDate || organization.trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [organization?.expiryDate, organization?.trialEndDate]);

  const isExpired = organization?.subscriptionStatus === 'expired' || (organization?.subscriptionStatus === 'trialing' && daysRemaining === 0);
  const activePlan = isExpired ? 'starter' : (organization?.subscriptionTier || 'trial');
  
  // Feature Restriction Logic
  const canAccessPremium = activePlan === 'professional' || activePlan === 'enterprise' || activePlan === 'trial';
  const canAccessEnterprise = activePlan === 'enterprise' || activePlan === 'trial';

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    setActiveView('dashboard');
  };

  const {
    activeStationId,
    stations,
    settings,
    staff,
    products,
    pumps,
    nozzles,
    customers,
    suppliers,
    shifts,
    banks,
    digitalAccounts,
    stockTxns,
    tanks,
    rateHistory,
    staffFinance,
    attendance,
    standaloneExpenses,
    lubePosSales,
    setStations,
    setSettings,
    setStaff,
    setProducts,
    setPumps,
    setNozzles,
    setCustomers,
    setSuppliers,
    setShifts,
    setBanks,
    setDigitalAccounts,
    setStockTxns,
    setTanks,
    setRateHistory,
    setStaffFinance,
    setAttendance,
    setStandaloneExpenses,
    handleAddStation,
    handleEditStation,
    handleDeleteStation,
    handleSwitchStation,
    handleUpdateSettings,
    handleAddStaff,
    handleUpdateStaff,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleAddSupplier,
    handleUpdateSupplier,
    handleDeleteSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddProduct,
    handleAddTank,
    handleUpdateTank,
    handleDeleteTank,
    handleAddNozzle,
    handleUpdateNozzle,
    handleDeleteNozzle,
    handleAddStaffFinance,
    handleAddShiftSalaryPayment,
    handleDeleteShiftSalaryPayment,
    handleAddAttendance,
    handleAddStandaloneExpense,
    handleAddLubePosSale,
    handleAddBank,
    handleUpdateBanks,
    handleAddDigitalAccount,
    handleUpdateDigitalAccounts,
    handleDeleteDebitEntry,
    handleDeleteRecoveryEntry,
    handleDeleteSupplierPayment,
    toast,
    confirmDialog,
    showToast,
    showConfirm,
    showAlert,
    closeConfirm
  } = useStation();

  const { requireBiometric } = useNativeAuth();

  // Single source of truth — always use activeStationId, never product sniffing
  const isLubeBusiness = activeStationId === 'st_lube';
  const resolveActiveView = React.useCallback(
    (view: string) => resolveViewForBusiness(view, activeStationId),
    [activeStationId]
  );
  
  const handleViewChange = React.useCallback(
    async (view: string) => {
      // Protected Views
      const protectedViews = ['treasury', 'configuration', 'setup_profile', 'setup_audit', 'security_hub'];
      if (protectedViews.includes(view)) {
        const authorized = await requireBiometric(`Access ${view.replace('_', ' ')}`);
        if (!authorized) return;
      }
      
      setActiveView(resolveActiveView(view));
    },
    [resolveActiveView, requireBiometric]
  );

  // Reset navigation to dashboard whenever the user switches stations
  // This prevents stale views (e.g. 'lube_pos') appearing on the wrong business
  React.useEffect(() => {
    setActiveView('dashboard');
    if (activeStationId) {
       migrateAccountsPayable(authenticatedUser?.uid).catch(console.error);
    }
  }, [activeStationId, authenticatedUser]);

  React.useEffect(() => {
    const nextView = resolveActiveView(activeView);
    if (nextView !== activeView) {
      setActiveView(nextView);
    }
  }, [activeView, resolveActiveView]);

  // Synchronize theme to document.documentElement (html tag)
  React.useEffect(() => {
    const root = document.documentElement;
    // Remove all previous theme classes
    root.classList.remove('theme-light', 'theme-white', 'theme-dark', 'theme-blue', 'theme-emerald', 'theme-orange', 'dark');
    
    const theme = settings.theme || 'light';
    root.classList.add(`theme-${theme}`);
    
    // Add the "dark" class if it's a dark-based theme, to enable Tailwind's dark: variants
    if (theme !== 'light' && theme !== 'white') {
      root.classList.add('dark');
    }
  }, [settings.theme]);

  // Ctrl+K opens global search
  useKeyboardShortcut(SHORTCUTS.GLOBAL_SEARCH, () => setSearchOpen(true));

  // Build search index when data loads
  React.useEffect(() => {
    buildSearchIndex({
      customers: customers,
      suppliers: suppliers,
      shifts: shifts,
      batches: stockTxns,
      expenses: standaloneExpenses,
      staff: staff,
    });
  }, []); // Initial build

  // Rebuild indices when specific data changes
  React.useEffect(() => { rebuildModuleIndex('customers', customers); }, [customers]);
  React.useEffect(() => { rebuildModuleIndex('suppliers', suppliers); }, [suppliers]);
  React.useEffect(() => { rebuildModuleIndex('shifts', shifts); }, [shifts]);
  React.useEffect(() => { rebuildModuleIndex('batches', stockTxns); }, [stockTxns]);
  React.useEffect(() => { rebuildModuleIndex('expenses', standaloneExpenses); }, [standaloneExpenses]);
  React.useEffect(() => { rebuildModuleIndex('staff', staff); }, [staff]);

  // Prevent screen sleep during active shifts
  React.useEffect(() => {
    const hasActiveShift = shifts.some(s => s.status === 'active');
    if (hasActiveShift || activeView === 'lube_pos') {
      mobileEngine.keepScreenAwake();
    } else {
      mobileEngine.allowScreenSleep();
    }
  }, [shifts, activeView]);

  // ==========================================
  // ROUTING VIEW CONTROLS
  // ==========================================

  const renderActiveComponent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            settings={settings}
            activeStationId={activeStationId}
            shifts={shifts}
            products={products}
            customers={customers}
            suppliers={suppliers}
            banks={banks}
            staff={staff}
            nozzles={nozzles}
            tanks={tanks}
            onNavigate={handleViewChange}
            lubePosSales={lubePosSales}
            onStartShiftQuick={() => handleViewChange(isLubeBusiness ? 'lube_pos' : 'shift_wizard')}
            rateHistory={rateHistory}
          />
        );

      case 'shift_wizard':
        if (isLubeBusiness) {
          return (
            <LubePOS
              settings={settings}
              staff={staff}
              products={products}
              customers={customers}
              banks={banks}
              digitalAccounts={digitalAccounts}
              lubePosSales={lubePosSales}
              onAddLubePosSale={handleAddLubePosSale}
              onNavigate={handleViewChange}
            />
          );
        }

        return (
          <ShiftWizard
            activeStationId={activeStationId}
            settings={settings}
            staff={staff}
            products={products}
            pumps={pumps}
            nozzles={nozzles}
            customers={customers}
            suppliers={suppliers}
            banks={banks}
            shifts={shifts}
            onAddShift={handleAddShift}
            onUpdateShift={handleUpdateShift}
            onNavigateToView={handleViewChange}
            onAddCustomer={handleAddCustomer}
            onAddSupplier={handleAddSupplier}
            onAddBank={handleAddBank}
            onAddShiftSalaryPayment={handleAddShiftSalaryPayment}
            onDeleteShiftSalaryPayment={handleDeleteShiftSalaryPayment}
          />
        );

      case 'shift_logs':
        return (
          <ShiftLogs
            shifts={shifts}
            staff={staff}
            customers={customers}
            suppliers={suppliers}
            banks={banks}
            digitalAccounts={digitalAccounts}
            products={products}
            tanks={tanks}
            nozzles={nozzles}
            settings={settings}
          />
        );

      case 'lube_pos':
        // Guard: Only Lube stations can access LubePOS — redirect Fuel stations to dashboard
        if (!isLubeBusiness) {
          return null;
        }
        return (
          <LubePOS
            settings={settings}
            staff={staff}
            products={products}
            customers={customers}
            banks={banks}
            digitalAccounts={digitalAccounts}
            lubePosSales={lubePosSales}
            onAddLubePosSale={handleAddLubePosSale}
            onNavigate={handleViewChange}
          />
        );

      case 'customers':
        return (
          <CustomerIntelligenceCenter
            settings={settings}
            activeStationId={activeStationId}
            customers={customers}
            shifts={shifts}
            products={products}
            lubePosSales={lubePosSales}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdateShift={handleUpdateShift}
            onDeleteDebitEntry={handleDeleteDebitEntry}
            onDeleteRecoveryEntry={handleDeleteRecoveryEntry}
          />
        );

      case 'suppliers':
        return (
          <SupplierCommandCenter
            settings={settings}
            suppliers={suppliers}
            shifts={shifts}
            products={products}
            banks={banks}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onDeleteSupplierPayment={handleDeleteSupplierPayment}
          />
        );

      case 'ledger':
        return (
          <Ledger
            settings={settings}
            customers={customers}
            suppliers={suppliers}
            shifts={shifts}
            products={products}
            lubePosSales={lubePosSales}
          />
        );

      case 'bank_cash':
        return (
          <BankCashPanel
            settings={settings}
            banks={banks}
            onAddBank={handleAddBank}
            onUpdateBanks={handleUpdateBanks}
            shifts={shifts}
            lubePosSales={lubePosSales}
          />
        );

      case 'digital_cash':
        return (
          <DigitalCashPanel
            settings={settings}
            digitalAccounts={digitalAccounts}
            onAddDigitalAccount={handleAddDigitalAccount}
            onUpdateDigitalAccounts={handleUpdateDigitalAccounts}
            shifts={shifts}
            lubePosSales={lubePosSales}
          />
        );

      case 'inventory':
        return (
          <Inventory
            settings={settings}
            activeStationId={activeStationId}
            products={products}
            suppliers={suppliers}
            stockTransactions={stockTxns}
            onAddStockTransaction={handleAddStockReceipt}
            onUpdateProductStock={handleUpdateProductStock}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
            tanks={tanks}
            rateHistory={rateHistory}
          />
        );

      case 'expenses':
        return (
          <Expenses
            settings={settings}
            activeStationId={activeStationId}
            shifts={shifts}
            standaloneExpenses={standaloneExpenses}
            onAddStandaloneExpense={handleAddStandaloneExpense}
          />
        );

      case 'reports':
        // Lube business → fully isolated Lube Reports ecosystem
        if (isLubeBusiness) {
          return (
            <LubeReports
              settings={settings}
              lubePosSales={lubePosSales}
              products={products}
              customers={customers}
              suppliers={suppliers}
              staff={staff}
              standaloneExpenses={standaloneExpenses}
            />
          );
        }
        // Fuel Station / CNG business → Fuel Station Reports
        return (
          <Reports
            activeStationId={activeStationId}
            settings={settings}
            shifts={shifts}
            products={products}
            customers={customers}
            suppliers={suppliers}
            standaloneExpenses={standaloneExpenses}
            tanks={tanks}
            rateHistory={rateHistory}
            staffFinance={staffFinance}
            attendance={attendance}
            staff={staff}
            nozzles={nozzles}
            banks={banks}
            digitalAccounts={digitalAccounts}
          />
        );

      case 'discounts':
        return (
          <DiscountsHub
            settings={settings}
            shifts={shifts}
            products={products}
          />
        );

      case 'staff':
        return (
          <StaffPanel
            settings={settings}
            staff={staff}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            staffFinance={staffFinance}
            onAddStaffFinance={handleAddStaffFinance}
            attendance={attendance}
            onAddAttendance={handleAddAttendance}
            shifts={shifts}
          />
        );

      case 'treasury':
        return (
          <TreasuryCenter />
        );

      case 'settings':
      case 'configuration':
      case 'setup_products':
      case 'setup_nozzles':
      case 'setup_tanks':
      case 'setup_rates':
      case 'setup_accounts':
      case 'setup_profile':
      case 'setup_audit': {
        const getTab = () => {
          switch (activeView) {
            case 'setup_products': return 'products';
            case 'setup_nozzles': return 'nozzles';
            case 'setup_tanks': return 'tanks';
            case 'setup_rates': return 'tariff';
            case 'setup_accounts': return 'accounts';
            case 'setup_audit': return 'audit';
            case 'settings':
            case 'configuration':
            case 'setup_profile':
            default: return 'profile';
          }
        };
        
        return (
          <SettingsPanel
            key={activeView} // Force remount on view change
            initialTab={getTab()}
            activeStationId={activeStationId}
            settings={settings}
            products={products}
            pumps={pumps}
            nozzles={nozzles}
            onUpdateSettings={handleUpdateSettings}
            onUpdateProductRate={handleUpdateProductRate}
            tanks={tanks}
            onAddTank={handleAddTank}
            onUpdateTank={handleUpdateTank}
            onDeleteTank={handleDeleteTank}
            onAddNozzle={handleAddNozzle}
            onUpdateNozzle={handleUpdateNozzle}
            onDeleteNozzle={handleDeleteNozzle}
            rateHistory={rateHistory}
            banks={banks}
            onUpdateBanks={setBanks}
            onUpdateProducts={setProducts}
            onUpdatePumps={setPumps}
            onNavigate={handleViewChange}
          />
        );
      }

      case 'security_hub':
        return (
          <SecurityHub
            settings={settings}
            user={authenticatedUser}
            onLogout={handleLogout}
          />
        );

      case 'subscription_hub':
        return <SubscriptionHub settings={settings} />;

      case 'license_manager':
        return <LicenseManager settings={settings} />;

      case 'price_management':
        return (
          <PriceManagement
            products={products}
            tanks={tanks}
            rateHistory={rateHistory}
            language={settings.language}
            settings={settings}
            onUpdateProductRate={handleUpdateProductRate}
            onLogAudit={(category, action, details) => { /* handled internally or stub for standalone view */ }}
            onUpdateProducts={setProducts}
          />
        );

      case 'fleet':
      case 'fuel_quality':
      case 'tanker_delivery':
      case 'loss_prevention':
      case 'loyalty':
      case 'maintenance':
      case 'erp_integration':
      case 'integrity_center':
      case 'cctv':
      case 'api_gateway':
      case 'enterprise_hub':
        if (!canAccessPremium) {
           return (
             <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
               <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle className="h-8 w-8" />
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Premium Feature Locked</h2>
               <p className="text-slate-500 mt-2 mb-6 max-w-md">This feature is only available on Professional or Enterprise plans. Please upgrade your subscription to access it.</p>
               <button onClick={() => handleViewChange('subscription_hub')} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold">Upgrade Now</button>
             </div>
           );
        }
        // Let EnterpriseHub handle the internal tab selection using the activeView
        return <EnterpriseHub settings={settings} activeModule={activeView === 'enterprise_hub' ? 'fleet' : activeView} onNavigate={handleViewChange} stationId={activeStationId} />;

      case 'dip_calculator':
        return (
          <DipCalculator
            settings={settings}
            tanks={tanks}
          />
        );

      case 'ogra_sync':
        return (
          <OGRAPriceSync
            settings={settings}
            products={products}
            onApplyRates={(updates) => {
              updates.forEach(u => handleUpdateProductRate(u.productId, u.newRate));
              showToast('OGRA rates applied successfully!', 'success');
              handleViewChange('inventory');

              if (settings.whatsappSettings?.enabled && settings.whatsappSettings?.alerts?.priceChange) {
                try {
                   let msg = "*🚨 Official Rate Change Alert*\n\nNew rates have been applied to the station:\n";
                   updates.forEach(u => {
                      const p = products.find(prod => prod.id === u.productId);
                      if (p) msg += `- ${p.name}: Rs ${u.newRate.toFixed(2)}\n`;
                   });
                   msg += `\n_Generated automatically by FuelPro ERP_`;
                   fetchWithAuth('/api/wa/send', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ number: settings.whatsappSettings.number, message: msg })
                   }).catch(() => {});
                } catch(e) {}
              }
            }}
          />
        );
      case 'communication_center':
        if (!canAccessPremium) return <div className="p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-orange-500 mb-4"/><h2 className="text-xl font-bold">Premium Feature</h2><button onClick={() => handleViewChange('subscription_hub')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg">Upgrade</button></div>;
        return <CommunicationDashboard />;

      case 'bi_analytics':
        if (!canAccessPremium) return <div className="p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-orange-500 mb-4"/><h2 className="text-xl font-bold">Premium Feature</h2><button onClick={() => handleViewChange('subscription_hub')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg">Upgrade</button></div>;
        return <BIDashboard />;
        
      case 'risk_center':
        if (!canAccessEnterprise) return <div className="p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-orange-500 mb-4"/><h2 className="text-xl font-bold">Enterprise Feature</h2><button onClick={() => handleViewChange('subscription_hub')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg">Upgrade</button></div>;
        return <RiskCenter />;
        
      case 'executive_dashboard':
        if (!canAccessPremium) return <div className="p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-orange-500 mb-4"/><h2 className="text-xl font-bold">Premium Feature</h2><button onClick={() => handleViewChange('subscription_hub')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg">Upgrade</button></div>;
        return <ExecutiveDashboard />;
        
      case 'demand_forecast':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
            <h2 className="text-xl font-bold text-slate-800">Forecasting Module (Standalone)</h2>
            <p className="text-sm text-slate-500 mt-2">Currently integrated inside the BI Analytics dashboard.</p>
          </div>
        );

      case 'ai_analytics':
        return (
          <AIAnalyticsHub 
            settings={settings}
            dataContext={{
              products,
              tanks,
              shifts: shifts.slice(-10),
              staff,
              nozzles
            }}
          />
        );

      case 'sync_center':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <SyncCenter settings={settings} />
          </React.Suspense>
        );

      default:
        return (
          <div className="flex h-64 items-center justify-center font-sans text-xs text-slate-400">
            Feature construction in progress...
          </div>
        );
    }
  };

  const showOnboarding = !isLubeBusiness && !settings.setupCompleted;

  // 1. Session verification loading splash screen
  if (checkingAuth) {
    return <LoadingScreen />;
  }

  // 2. Authentication lock wall
  if (!authenticatedUser) {
    return (
      <AuthInterface
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 3. Authenticated FuelPro active workspace
  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-[var(--color-accent)]/20 selection:text-[var(--color-accent)] transition-colors duration-500`}>
      <OfflineIndicator />
      <AutoUpdatePrompt />
      <LocalStorageMigrationWizard />
      {/* ALWAYS SHOW ONBOARDING WIZARD IF REQUESTED MANUALLY OR IF NEVER COMPLETED */}
      {(showOnboarding || activeView === 'onboarding') && (
        <React.Suspense fallback={<LoadingScreen />}>
          <OnboardingWizard
            currentLanguage={settings.language}
            onCancel={async () => {
              if (activeView === 'onboarding') {
                 handleViewChange('configuration');
                 return;
              }
              const newSettings = { ...settings, setupCompleted: true };
              setSettings(newSettings);
              const orgId = authenticatedUser?.orgId;
              if (orgId && activeStationId) {
                try {
                  const settingsRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'settings', 'global');
                  await setDoc(settingsRef, newSettings, { merge: true });
                } catch (err) {
                  console.error("Failed to skip setup", err);
                }
              }
            }}
            onComplete={async (completedData) => {
              setSettings(completedData.settings);
              setTanks(completedData.tanks);
              setNozzles(completedData.nozzles);
              setProducts(completedData.products);
            setStaff(completedData.staff);

            // Extract pumps that nozzles refer to and populate them automatically
            const uniquePumpIds = Array.from(new Set(completedData.nozzles.map(n => n.pumpId))) as string[];
            const generatedPumps: Pump[] = uniquePumpIds.map(pId => ({
              id: pId,
              name: `Dispenser ${pId.replace('pump_', '#')}`,
              status: 'active'
            }));
            setPumps(generatedPumps);

            const orgId = authenticatedUser?.orgId;
            if (orgId) {
              const bType = getBusinessTypeForStation(activeStationId);
              const scopedMeta = {
                orgId,
                stationId: activeStationId,
                businessId: activeStationId,
                businessType: bType,
                updatedAt: new Date().toISOString()
              };
              try {
                const batch = writeBatch(dbFS);
                
                // settings
                const settingsRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'settings', 'global');
                batch.set(settingsRef, { ...completedData.settings, ...scopedMeta }, { merge: true });
                
                // tanks
                completedData.tanks.forEach(tk => {
                  const tRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'tanks', tk.id);
                  batch.set(tRef, { ...tk, ...scopedMeta }, { merge: true });
                });
                
                // nozzles
                completedData.nozzles.forEach(nz => {
                  const nRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'nozzles', nz.id);
                  batch.set(nRef, { ...nz, ...scopedMeta }, { merge: true });
                });
                
                // products
                completedData.products.forEach(prod => {
                  const pRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'products', prod.id);
                  batch.set(pRef, { ...prod, ...scopedMeta }, { merge: true });
                });
                
                // staff
                completedData.staff.forEach(st => {
                  const sRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'staff', st.id);
                  batch.set(sRef, { ...st, ...scopedMeta }, { merge: true });
                });
                
                // pumps
                generatedPumps.forEach(pump => {
                  const puRef = doc(dbFS, 'organizations', orgId, 'stations', activeStationId, 'pumps', pump.id);
                  batch.set(puRef, { ...pump, ...scopedMeta }, { merge: true });
                });
                
                await batch.commit();
                
                if (activeView === 'onboarding') {
                  handleViewChange('configuration');
                  return;
                }
              } catch (err) {
                console.error("Failed to commit onboarding setup", err);
                throw err;
              }
            }

            // Re-route to dashboard to display fresh, populated layout
            handleViewChange('dashboard');
          }}
        />
        </React.Suspense>
      )}

      {/* Dynamic Premium Top Header */}
      <TopHeader
        settings={settings}
        onMenuClick={() => {
          setIsSidebarOpen(true);
        }}
        onLanguageToggle={() => {
          const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
          const currentIndex = languages.indexOf(settings.language || 'en');
          const nextIndex = (currentIndex + 1) % languages.length;
          setSettings({ ...settings, language: languages[nextIndex] });
        }}
        onThemeToggle={() => {
          const themes: ('light' | 'dark' | 'blue' | 'emerald' | 'orange' | 'white')[] = ['light', 'dark', 'blue', 'emerald', 'orange', 'white'];
          const currentIndex = themes.indexOf(settings.theme || 'light');
          const nextIndex = (currentIndex + 1) % themes.length;
          setSettings({ ...settings, theme: themes[nextIndex] as any });
        }}
        onSettingsClick={() => {
          handleViewChange('configuration');
        }}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onViewChange={handleViewChange}
        activeView={activeView}
        settings={settings}
        isLubeBusiness={isLubeBusiness}
        isSuperAdmin={isSuperAdmin}
        onLanguageToggle={() => {
          const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
          const currentIndex = languages.indexOf(settings.language || 'en');
          const nextIndex = (currentIndex + 1) % languages.length;
          setSettings({ ...settings, language: languages[nextIndex] });
        }}
        onThemeToggle={() => {
          const themes = ['light', 'white', 'dark'];
          const currentIndex = themes.indexOf(settings.theme || 'light');
          const nextIndex = (currentIndex + 1) % themes.length;
          setSettings({ ...settings, theme: themes[nextIndex] as any });
        }}
        onLogout={handleLogout}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(viewId, context) => {
          handleViewChange(viewId);
        }}
      />

      {/* Main Container Workspace */}
      <main 
        className="flex-1 w-full pt-[64px] pb-[80px] lg:pb-0 flex flex-col overflow-y-auto scroll-container relative bg-slate-50 dark:bg-[#151521]"
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
                Please renew to avoid losing access to premium features.
              </p>
            </div>
            <button onClick={() => handleViewChange('subscription_hub')} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 whitespace-nowrap">
              Renew Now
            </button>
          </div>
        )}
        
        {isRefreshing && (
          <div className="absolute top-16 left-0 right-0 flex justify-center py-4 z-50">
            <div className="bg-white shadow-xl rounded-full p-2 border border-slate-100 flex items-center justify-center">
               <RefreshCw className="h-6 w-6 text-orange-600 animate-spin" />
            </div>
          </div>
        )}
        <div className="p-4 lg:p-8 w-full max-w-[1800px] mx-auto flex-1 flex flex-col">
          <div className="flex-grow">
            <PageTransition viewKey={activeView}>
              <ErrorBoundary>
                <React.Suspense fallback={<LoadingScreen />}>
                  {renderActiveComponent()}
                </React.Suspense>
              </ErrorBoundary>
            </PageTransition>
          </div>


        </div>
      </main>

      {/* Dynamic Mobile Bottom Navigation */}
      <BottomNavigation 
        activeView={activeView} 
        onNavigate={handleViewChange}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* Premium Global Toast Popup Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-[calc(100%-2rem)] sm:w-full sm:max-w-sm z-55 pointer-events-none">
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
                toast.type === 'success' 
                  ? 'border-emerald-500/30 bg-[var(--bg-card)]/90 shadow-emerald-500/10'
                  : toast.type === 'error'
                    ? 'border-rose-500/30 bg-[var(--bg-card)]/90 shadow-rose-500/10'
                    : 'border-[var(--border-main)]/60 bg-[var(--bg-card)]/90 shadow-slate-950/10'
              }`}
            >
              {/* Top border color strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                toast.type === 'success' 
                  ? 'bg-emerald-500'
                  : toast.type === 'error'
                    ? 'bg-rose-500'
                    : 'bg-[var(--primary-accent)]'
              }`} />

              <div className="flex items-start gap-3 mt-1">
                <div className="mt-0.5 shrink-0">
                  {toast.type === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  {toast.type === 'error' && (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                  {toast.type === 'info' && (
                    <Info className="h-5 w-5 text-[var(--primary-accent)]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-sans text-xs font-bold text-[var(--text-main)] leading-relaxed">
                    {toast.message}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-main)]/40 pt-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    <span>{settings.language === 'ur' ? 'کامیابی سے مکمل ہوا' : 'Successfully processed'}</span>
                    <PoweredByUmarAli variant="compact" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Global Confirmation / Alert Modal */}
      <AnimatePresence>
        {confirmDialog.visible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={confirmDialog.isAlert ? undefined : confirmDialog.onCancel}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)]/95 backdrop-blur-md p-6 shadow-2xl z-10"
            >
              {/* Type indicator vertical accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                confirmDialog.isAlert
                  ? 'bg-[var(--primary-accent)]'
                  : 'bg-rose-500'
              }`} />

              <div className="flex items-start gap-4 mt-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  confirmDialog.isAlert 
                    ? 'bg-[var(--primary-accent)]/10 text-[var(--primary-accent)]' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {confirmDialog.isAlert ? (
                    <Info className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-sans text-sm font-black text-[var(--text-main)] uppercase tracking-wider">
                    {confirmDialog.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>
              
              {/* Footer Divider & Actions */}
              <div className="mt-6 pt-4 border-t border-[var(--border-main)]/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="font-mono text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-center w-full sm:w-auto mb-2 sm:mb-0">
                  <PoweredByUmarAli variant="compact" />
                </div>
                
                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                  {!confirmDialog.isAlert && (
                    <button
                      type="button"
                      onClick={confirmDialog.onCancel}
                      className="flex-1 sm:flex-none text-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 font-sans text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      {confirmDialog.cancelText || (settings.language === 'ur' ? 'منسوخ کریں' : 'Cancel')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={confirmDialog.onConfirm}
                    className={`flex-1 sm:flex-none text-center rounded-lg px-5 py-2 font-sans text-xs font-bold text-white transition-colors cursor-pointer shadow-md ${
                      confirmDialog.isAlert
                        ? 'bg-[var(--primary-accent)] hover:bg-[var(--primary-hover)] shadow-[var(--primary-accent)]/10'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    }`}
                  >
                    {confirmDialog.confirmText || (confirmDialog.isAlert ? (settings.language === 'ur' ? 'ٹھیک ہے' : 'OK') : (settings.language === 'ur' ? 'تصدیق کریں' : 'Confirm'))}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Context-Aware Smart Suggestions Panel */}
      <React.Suspense fallback={null}>
        <SmartSuggestions />
      </React.Suspense>

      {/* Global AI Assistant — floats on all pages */}
      <React.Suspense fallback={null}>
        <AIAssistant
          settings={settings}
          shifts={shifts}
          products={products}
          customers={customers}
          tanks={tanks}
          nozzles={nozzles}
          staff={staff}
        />
      </React.Suspense>

      {/* Global Toaster for feedback */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-main)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
        }} 
      />
    </div>
  );
}

const SecureApp = ({ children }: { children: React.ReactNode }) => {
  const { isLocked } = useNativeAuth();
  return (
    <>
      {isLocked && <SecurityScreen />}
      <div style={{ display: isLocked ? 'none' : 'block', height: '100%', width: '100%' }}>
        {children}
      </div>
    </>
  );
};

import { NativeFeedbackProvider } from './components/providers/NativeFeedbackProvider';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [carouselDone, setCarouselDone] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'en'|'ur'>('ur');

  useEffect(() => {
    initDatabase().then(() => setDbReady(true)).catch(console.error);
    mobileEngine.initialize();

    const savedLang = localStorage.getItem('fuelpro_language');
    if (savedLang) {
      setPreferredLang(savedLang as 'en'|'ur');
      setLanguageSelected(true);
    }
    const seenCarousel = localStorage.getItem('fuelpro_seen_carousel');
    if (seenCarousel) setCarouselDone(true);
  }, []);

  const handleLanguageSelect = (lang: 'en'|'ur') => {
    localStorage.setItem('fuelpro_language', lang);
    setPreferredLang(lang);
    setLanguageSelected(true);
  };

  const handleCarouselComplete = () => {
    localStorage.setItem('fuelpro_seen_carousel', 'true');
    setCarouselDone(true);
  };

  return (
    <>
      {!splashDone && <SplashSequence onComplete={() => setSplashDone(true)} />}
      
      {splashDone && !languageSelected && (
         <LanguageSelect onSelect={handleLanguageSelect} />
      )}

      {splashDone && languageSelected && !carouselDone && (
         <WelcomeCarousel language={preferredLang} onComplete={handleCarouselComplete} />
      )}

      {splashDone && languageSelected && carouselDone && !dbReady && <LoadingScreen />}
      
      {splashDone && languageSelected && carouselDone && dbReady && (
        <NativeFeedbackProvider>
          <AuthProvider>
            <NativeAuthProvider>
              <ScannerProvider>
                <SecureApp>
                  <StationProvider>
                    <MainApp />
                  </StationProvider>
                </SecureApp>
              </ScannerProvider>
            </NativeAuthProvider>
          </AuthProvider>
        </NativeFeedbackProvider>
      )}
    </>
  );
}

