import { StationProvider, useStation } from './contexts/StationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LocalStorageMigrationWizard from './components/features/LocalStorageMigrationWizard';
import { firestoreDb } from './data/firestore';
import { writeBatch, doc, setDoc } from 'firebase/firestore';
import { dbFS } from './lib/firebase';
import { fetchWithAuth } from './lib/api';
import { migrateAccountsPayable } from './utils/migrations';
import { getBusinessTypeForStation, resolveViewForBusiness } from './lib/businessScope';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from './components/layouts/Navigation';
const Dashboard = React.lazy(() => import('./components/features/Dashboard'));
const ShiftWizard = React.lazy(() => import('./components/features/ShiftWizard'));
const ShiftLogs = React.lazy(() => import('./components/features/ShiftLogs'));
const Customers = React.lazy(() => import('./components/features/Customers'));
const Suppliers = React.lazy(() => import('./components/features/Suppliers'));
const Ledger = React.lazy(() => import('./components/features/Ledger'));
const Inventory = React.lazy(() => import('./components/features/Inventory'));
const Expenses = React.lazy(() => import('./components/features/Expenses'));
const LubePOS = React.lazy(() => import('./components/features/LubePOS'));
const Reports = React.lazy(() => import('./components/features/Reports'));
const LubeReports = React.lazy(() => import('./components/features/LubeReports'));
const LoadingScreen = React.lazy(() => import('./components/ui/LoadingScreen'));
const DiscountsHub = React.lazy(() => import('./components/features/DiscountsHub'));

const StaffPanel = React.lazy(() => import('./components/features/Staff'));
const SettingsPanel = React.lazy(() => import('./components/features/Settings'));

const OnboardingWizard = React.lazy(() => import('./components/features/OnboardingWizard'));
import AuthInterface from './components/layouts/AuthInterface'; // Kept static for immediate auth render
const SecurityHub = React.lazy(() => import('./components/features/SecurityHub'));
const SubscriptionHub = React.lazy(() => import('./components/features/SubscriptionHub'));
const BankCashPanel = React.lazy(() => import('./components/features/BankCashPanel'));
const DigitalCashPanel = React.lazy(() => import('./components/features/DigitalCashPanel'));
const RateWizard = React.lazy(() => import('./components/features/Settings/RateWizard'));
const EnterpriseHub = React.lazy(() => import('./components/features/EnterpriseHub'));
const DipCalculator = React.lazy(() => import('./components/features/DipCalculator/DipCalculator'));
const OGRAPriceSync = React.lazy(() => import('./components/features/OGRAPriceSync/OGRAPriceSync'));
const AIAssistant = React.lazy(() => import('./components/features/AIAssistant/AIAssistant'));
const AIAnalyticsHub = React.lazy(() => import('./components/features/AIAnalyticsHub/AIAnalyticsHub'));
const WhatsAppAlerts = React.lazy(() => import('./components/features/WhatsAppAlerts'));
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

import {
  Pump,
  Station
} from './types';

function MainApp() {
  // Navigation active view routing
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Centralized Auth Context connection
  const { user: authenticatedUser, checkingAuth, logout } = useAuth();

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

  // Single source of truth — always use activeStationId, never product sniffing
  const isLubeBusiness = activeStationId === 'st_lube';
  const resolveActiveView = React.useCallback(
    (view: string) => resolveViewForBusiness(view, activeStationId),
    [activeStationId]
  );
  const handleViewChange = React.useCallback(
    (view: string) => {
      setActiveView(resolveActiveView(view));
    },
    [resolveActiveView]
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
          <Customers
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
          <Suppliers
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

      case 'price_management':
        return (
          <RateWizard
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
      case 'bi_analytics':
      case 'demand_forecast':
      case 'erp_integration':
      case 'cctv':
      case 'api_gateway':
        // Let EnterpriseHub handle the internal tab selection using the activeView
        return <EnterpriseHub settings={settings} activeModule={activeView} onNavigate={handleViewChange} stationId={activeStationId} />;

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
      case 'whatsapp_alerts':
        return <WhatsAppAlerts settings={settings} onUpdateSettings={handleUpdateSettings} />;

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
    <div className={`min-h-screen w-full overflow-x-hidden bg-background text-foreground selection:bg-orange-500/10 selection:text-orange-600 pb-10 transition-colors duration-500 theme-${settings.theme || 'light'}`}>
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

      {/* Dynamic Bilingual Header and Responsive Drawer */}
      <Navigation
        activeView={activeView}
        onViewChange={handleViewChange}
        settings={settings}
        onSettingsUpdate={handleUpdateSettings}
        user={authenticatedUser}
        onLogout={handleLogout}
        stations={stations}
        activeStationId={activeStationId}
        onSwitchStation={handleSwitchStation}
        onAddStation={handleAddStation}
        onEditStation={handleEditStation}
        onDeleteStation={handleDeleteStation}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 w-full lg:pl-64 pt-[65px] flex flex-col min-h-screen">
        <div className="p-4 lg:p-8 w-full max-w-[1800px] mx-auto flex-1 flex flex-col">
          <div className="flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <ErrorBoundary>
                  <React.Suspense fallback={<LoadingScreen />}>
                    {renderActiveComponent()}
                  </React.Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* COMPLIANT FOOTER LAYOUT */}
          <footer className="mt-16 pt-6 border-t border-border/30 text-center font-sans text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              © 2026 {settings.stationName}. All rights reserved.
            </div>
            <div className="flex items-center justify-center gap-1.5 font-semibold">
              <span>Powered by Umar Ali</span>
              <a
                href="https://wa.me/923168432329"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold ml-1.5 transition-colors"
              >
                <svg className="h-4 w-4 fill-emerald-500" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.058 5.348 5.4 0 12.008 0c3.2 0 6.21 1.244 8.475 3.512 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.346 12.003-11.95 12.003-2.002-.001-3.968-.5-5.713-1.448L0 24zm6.59-4.817c1.661.988 3.287 1.477 4.912 1.478 5.483 0 9.95-4.466 9.953-9.95 0-2.657-1.035-5.155-2.914-7.034C16.711 1.797 14.198.761 11.53.761c-5.485 0-9.952 4.467-9.955 9.953-.001 1.944.512 3.844 1.487 5.534l-.98 3.578 3.665-.961zm11.332-6.526c-.347-.174-2.054-1.014-2.372-1.129-.317-.116-.549-.174-.78.174-.23.348-.895 1.129-1.096 1.359-.202.232-.404.261-.751.087-.348-.174-1.468-.541-2.798-1.728-1.034-.922-1.731-2.06-1.933-2.408-.202-.348-.022-.536.152-.709.157-.156.347-.406.52-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.028-.609-.087-.174-.78-1.884-1.069-2.58-.282-.677-.568-.584-.78-.595-.201-.01-.433-.012-.664-.012-.231 0-.606.087-.923.435-.317.348-1.211 1.188-1.211 2.9s1.24 3.362 1.413 3.593c.174.232 2.44 3.725 5.911 5.225.824.356 1.468.57 1.969.729.829.263 1.583.226 2.18.136.664-.1 2.053-.84 2.34-1.652.287-.812.287-1.507.202-1.651-.086-.144-.316-.231-.663-.405z"/>
                </svg>
                <span>WhatsApp Support</span>
              </a>
            </div>
          </footer>
        </div>
      </main>

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
                    <span className="font-black text-orange-500">Powered by Umar Ali</span>
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
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Powered by Umar Ali
                </span>
                
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StationProvider>
        <MainApp />
      </StationProvider>
    </AuthProvider>
  );
}
