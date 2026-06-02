import { StationProvider, useStation } from './contexts/StationContext';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from './components/layouts/Navigation';
import Dashboard from './components/features/Dashboard';
import ShiftWizard from './components/features/ShiftWizard';
import Customers from './components/features/Customers';
import Suppliers from './components/features/Suppliers';
import Ledger from './components/features/Ledger';
import Inventory from './components/features/Inventory';
import Expenses from './components/features/Expenses';
import LubePOS from './components/features/LubePOS';
import Reports from './components/features/Reports';
import AdvancedReportsHub from './components/features/AdvancedReportsHub';
import DiscountsHub from './components/features/DiscountsHub';
import StaffPanel from './components/features/Staff';
import SettingsPanel from './components/features/Settings';
import OnboardingWizard from './components/features/OnboardingWizard';
import AuthInterface from './components/layouts/AuthInterface';
import SecurityHub from './components/features/SecurityHub';
import BankCashPanel from './components/features/BankCashPanel';
import DigitalCashPanel from './components/features/DigitalCashPanel';
import RateWizard from './components/features/Settings/RateWizard';
import { 
  FleetManagement, 
  TankerDelivery, 
  LossPrevention, 
  MaintenanceAssets,
  LoyaltyRewards, 
  BIAnalytics, 
  DemandForecast, 
  ERPIntegration, 
  CCTVIntegration, 
  APIGateway 
} from './components/features/EnterpriseModules';
import { RefreshCw } from 'lucide-react';

import {
  Staff,
  Product,
  Nozzle,
  Pump,
  Customer,
  Supplier,
  Shift,
  BankAccount,
  DigitalAccount,
  StockTransaction,
  GlobalSettings,
  ExpenseEntry,
  Tank,
  RateHistoryEntry,
  StaffFinanceEntry,
  AttendanceRecord,
  Station
} from './types';
import { db } from './data/db';

function MainApp() {
  // Navigation active view routing
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Security Context and session holders
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Validate session against database on launch
  useEffect(() => {
    const verifyTokenOnBoot = async () => {
      const storedToken = localStorage.getItem('fuelpro_auth_token');
      if (!storedToken) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            setAuthenticatedUser(data.user);
            setAuthToken(storedToken);
          } else {
            console.warn("Expected JSON but received non-JSON response on login verification.");
            throw new Error("Invalid Response Type");
          }
        } else {
          // Token expired, delete from memory
          localStorage.removeItem('fuelpro_auth_token');
          setAuthenticatedUser(null);
          setAuthToken(null);
        }
      } catch (err) {
        console.warn("Connection timeout checking authentication on Node backend server. Keeping session in pending state.");
      } finally {
        setCheckingAuth(false);
      }
    };
    verifyTokenOnBoot();
  }, []);

  const handleLoginSuccess = (userPayload: any, token: string) => {
    localStorage.setItem('fuelpro_auth_token', token);
    setAuthenticatedUser(userPayload);
    setAuthToken(token);
    setActiveView('dashboard');
  };

  const handleLogout = async () => {
    try {
      const storedToken = localStorage.getItem('fuelpro_auth_token');
      if (storedToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
      }
    } catch (err) {
      console.error("Express logout API failed.", err);
    } finally {
      localStorage.removeItem('fuelpro_auth_token');
      localStorage.removeItem('fuelpro_google_access_token');
      setAuthenticatedUser(null);
      setAuthToken(null);
      setActiveView('dashboard');
    }
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
    handleAddSupplier,
    handleUpdateSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
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
    handleUpdateDigitalAccounts
  } = useStation();
  const isLubeBusiness =
    products.some((product) => product.type === 'lube') &&
    !products.some((product) => product.type === 'fuel');
// ==========================================
  // ROUTING VIEW CONTROLS
  // ==========================================

  const renderActiveComponent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            settings={settings}
            shifts={shifts}
            products={products}
            customers={customers}
            suppliers={suppliers}
            banks={banks}
            staff={staff}
            nozzles={nozzles}
            onNavigate={setActiveView}
            lubePosSales={lubePosSales}
            onStartShiftQuick={() => setActiveView(isLubeBusiness ? 'lube_pos' : 'shift_wizard')}
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
              onNavigate={setActiveView}
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
            onNavigateToView={setActiveView}
            onAddCustomer={handleAddCustomer}
            onAddSupplier={handleAddSupplier}
            onAddBank={handleAddBank}
            onAddShiftSalaryPayment={handleAddShiftSalaryPayment}
            onDeleteShiftSalaryPayment={handleDeleteShiftSalaryPayment}
          />
        );

      case 'lube_pos':
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
            onNavigate={setActiveView}
          />
        );

      case 'customers':
        return (
          <Customers
            settings={settings}
            customers={customers}
            shifts={shifts}
            products={products}
            lubePosSales={lubePosSales}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateShift={handleUpdateShift}
          />
        );

      case 'suppliers':
        return (
          <Suppliers
            settings={settings}
            suppliers={suppliers}
            shifts={shifts}
            products={products}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
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
            products={products}
            suppliers={suppliers}
            stockTransactions={stockTxns}
            onAddStockTransaction={handleAddStockReceipt}
            onUpdateProductStock={handleUpdateProductStock}
            tanks={tanks}
            rateHistory={rateHistory}
          />
        );

      case 'expenses':
        return (
          <Expenses
            settings={settings}
            shifts={shifts}
            standaloneExpenses={standaloneExpenses}
            onAddStandaloneExpense={handleAddStandaloneExpense}
          />
        );

      case 'reports':
        return (
          <AdvancedReportsHub
            settings={settings}
            shifts={shifts}
            products={products}
            staff={staff}
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

      case 'settings':
        return (
          <SettingsPanel
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
          />
        );

      case 'security_hub':
        return (
          <SecurityHub
            settings={settings}
            user={authenticatedUser}
            onLogout={handleLogout}
          />
        );

      case 'price_management':
        return (
          <RateWizard
            products={products}
            tanks={tanks}
            rateHistory={rateHistory}
            language={settings.language}
            onUpdateProductRate={handleUpdateProductRate}
            onLogAudit={(category, action, details) => { /* handled internally or stub for standalone view */ }}
            onUpdateProducts={setProducts}
          />
        );

      case 'fleet':
        return <FleetManagement settings={settings} />;
      case 'tanker_delivery':
        return <TankerDelivery settings={settings} />;
      case 'loss_prevention':
        return <LossPrevention settings={settings} />;
      case 'loyalty':
        return <LoyaltyRewards settings={settings} />;
      case 'maintenance':
        return <MaintenanceAssets settings={settings} />;
      case 'bi_analytics':
        return <BIAnalytics settings={settings} />;
      case 'demand_forecast':
        return <DemandForecast settings={settings} />;
      case 'erp_integration':
        return <ERPIntegration settings={settings} />;
      case 'cctv':
        return <CCTVIntegration settings={settings} />;
      case 'api_gateway':
        return <APIGateway settings={settings} />;

      default:
        return (
          <div className="flex h-64 items-center justify-center font-sans text-xs text-slate-400">
            Feature construction in progress...
          </div>
        );
    }
  };

  const showOnboarding = tanks.length === 0 || nozzles.length === 0 || staff.length === 0 || products.length === 0;

  // 1. Session verification loading splash screen
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center font-sans text-xs text-orange-500 gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-orange-500" />
        <span className="font-mono uppercase font-extrabold tracking-widest text-[9px] text-slate-400">
          Decrypting Security Vault...
        </span>
      </div>
    );
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
      {showOnboarding && (
        <OnboardingWizard
          currentLanguage={settings.language}
          onComplete={(completedData) => {
            setSettings(completedData.settings);
            setTanks(completedData.tanks);
            setNozzles(completedData.nozzles);
            setProducts(completedData.products);
            setStaff(completedData.staff);
            
            // Extract pumps that nozzles refer to and populate them automatically
            const uniquePumpIds = Array.from(new Set(completedData.nozzles.map(n => n.pumpId)));
            const generatedPumps: Pump[] = uniquePumpIds.map(pId => ({
              id: pId,
              name: `Dispenser ${pId.replace('pump_', '#')}`,
              status: 'active'
            }));
            setPumps(generatedPumps);
            
            // Re-route to dashboard to display fresh, populated layout
            setActiveView('dashboard');
          }}
        />
      )}

      {/* Dynamic Bilingual Header and Responsive Drawer */}
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
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
                {renderActiveComponent()}
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
    </div>
  );
}

export default function App() {
  return (
    <StationProvider>
      <MainApp />
    </StationProvider>
  );
}
