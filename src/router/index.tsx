import React from 'react';
import { createBrowserRouter, Navigate, useOutletContext, useNavigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import LoadingScreen from '../components/ui/LoadingScreen';

// Lazy loading all feature components
const Dashboard = React.lazy(() => import('../components/features/Dashboard'));
const ShiftWizard = React.lazy(() => import('../components/features/ShiftWizard'));
const ShiftLogs = React.lazy(() => import('../components/features/ShiftLogs'));
const CustomerIntelligenceCenter = React.lazy(() => import('../components/features/CustomerIntelligenceCenter/CustomerIntelligenceCenter'));
const SupplierCommandCenter = React.lazy(() => import('../components/features/SupplierCommandCenter/SupplierCommandCenter'));
const Ledger = React.lazy(() => import('../components/features/Ledger'));
const InventoryHub = React.lazy(() => import('../components/features/inventory-v2/InventoryHub').then(m => ({ default: m.InventoryHub })));
const Expenses = React.lazy(() => import('../components/features/Expenses'));
const LubePOS = React.lazy(() => import('../components/features/LubePOS'));
// Legacy Reports module DEPRECATED — Architecture Reset Phase 1
// const Reports = React.lazy(() => import('../components/features/Reports'));
const LubeReports = React.lazy(() => import('../components/features/LubeReports'));
const EnterpriseReportsWorkspace = React.lazy(() => import('../components/features/reports-v2/EnterpriseReportsWorkspace'));
const DiscountsHub = React.lazy(() => import('../components/features/DiscountsHub'));
const StaffPanel = React.lazy(() => import('../components/features/Staff'));
const SettingsPanel = React.lazy(() => import('../components/features/Settings'));
const SecurityHub = React.lazy(() => import('../components/features/SecurityHub'));
const SubscriptionHub = React.lazy(() => import('../components/features/SubscriptionHub'));
const LicenseManager = React.lazy(() => import('../components/features/LicenseManager'));
const BankCashPanel = React.lazy(() => import('../components/features/BankCashPanel'));
const DigitalCashPanel = React.lazy(() => import('../components/features/DigitalCashPanel'));
const PriceManagement = React.lazy(() => import('../components/features/PriceManagement'));
const EnterpriseHub = React.lazy(() => import('../components/features/EnterpriseHub'));
const AuditCenter = React.lazy(() => import('../components/features/AuditCenter'));
const DipCalculator = React.lazy(() => import('../components/features/DipCalculator/DipCalculator'));
const CommunicationDashboard = React.lazy(() => import('../components/features/CommunicationCenter/CommunicationDashboard'));
const BIDashboard = React.lazy(() => import('../components/features/BIAnalytics/BIDashboard'));
const RiskCenter = React.lazy(() => import('../components/features/RiskCenter/RiskCenter'));
const ExecutiveDashboard = React.lazy(() => import('../components/features/ExecutiveDashboard/ExecutiveDashboard'));
const EnterpriseDashboard = React.lazy(() => import('../components/features/EnterpriseDashboard/EnterpriseDashboard'));
const TreasuryCenter = React.lazy(() => import('../components/features/TreasuryCenter/TreasuryCenter'));
const SyncCenter = React.lazy(() => import('../components/features/SyncCenter/SyncCenter'));
const AIAssistant = React.lazy(() => import('../components/features/AIAssistant/AIAssistant'));
const AboutMe = React.lazy(() => import('../components/features/AboutMe/AboutMe'));
const AIAnalyticsHub = React.lazy(() => import('../components/features/AIAnalyticsHub/AIAnalyticsHub'));
const WetStockIntelligenceHub = React.lazy(() => import('../components/features/WetStockIntelligence/WetStockIntelligenceHub').then(m => ({ default: m.WetStockIntelligenceHub })));
const FuelSalesModule = React.lazy(() => import('../components/features/FuelSales/FuelSalesModule').then(m => ({ default: m.FuelSalesModule })));

import { useAuth } from '../contexts/AuthContext';
// Type alias for the context injected by AppShell
import { useAppStoreProps } from '../hooks/useAppStoreProps';

const useProps = () => useOutletContext<ReturnType<typeof useAppStoreProps>>();

// Wrapper Components to map context to props without breaking existing contracts
const DashboardRoute = () => {
 const props = useProps();
 const navigate = useNavigate();
 return <Dashboard 
 settings={props.settings} activeStationId={props.activeStationId} shifts={props.shifts} products={props.products} customers={props.customers} suppliers={props.suppliers} banks={props.banks} staff={props.staff} nozzles={props.nozzles} tanks={props.tanks} 
 onNavigate={(path) => {
 let cleanPath = `/${path.replace(/_/g, '-')}`;
 if (path === 'dashboard') cleanPath = '/';
 navigate(cleanPath);
 }} 
 lubePosSales={props.lubePosSales} rateHistory={props.rateHistory} stockTxns={props.stockTxns} 
 onStartShiftQuick={() => {}} // Handle navigation
 />;
};

const ShiftWizardRoute = () => {
 const props = useProps();
 return <ShiftWizard 
 activeStationId={props.activeStationId} settings={props.settings} staff={props.staff} products={props.products} pumps={props.pumps} nozzles={props.nozzles} customers={props.customers} suppliers={props.suppliers} banks={props.banks} shifts={props.shifts}
 onAddShift={props.handleAddShift} onUpdateShift={props.handleUpdateShift} onNavigateToView={() => {}}
 onAddCustomer={props.handleAddCustomer} onAddSupplier={props.handleAddSupplier} onAddBank={props.handleAddBank} onAddShiftSalaryPayment={props.handleAddShiftSalaryPayment} onDeleteShiftSalaryPayment={props.handleDeleteShiftSalaryPayment}
 />;
};

const LubePOSRoute = () => {
 const props = useProps();
 const navigate = useNavigate();
 return <LubePOS 
 settings={props.settings} staff={props.staff} products={props.products} customers={props.customers} banks={props.banks} digitalAccounts={props.digitalAccounts} lubePosSales={props.lubePosSales} onAddLubePosSale={props.handleAddLubePosSale} 
 onNavigate={(path) => {
 let cleanPath = `/${path.replace(/_/g, '-')}`;
 if (path === 'dashboard') cleanPath = '/';
 navigate(cleanPath);
 }}
 />;
};

const ShiftLogsRoute = () => {
 const props = useProps();
 return <ShiftLogs shifts={props.shifts} staff={props.staff} customers={props.customers} suppliers={props.suppliers} banks={props.banks} digitalAccounts={props.digitalAccounts} products={props.products} tanks={props.tanks} nozzles={props.nozzles} settings={props.settings} />;
};

const CustomersRoute = () => {
 const props = useProps();
 return <CustomerIntelligenceCenter settings={props.settings} activeStationId={props.activeStationId} customers={props.customers} shifts={props.shifts} products={props.products} lubePosSales={props.lubePosSales} onAddCustomer={props.handleAddCustomer} onUpdateCustomer={props.handleUpdateCustomer} onDeleteCustomer={props.handleDeleteCustomer} onUpdateShift={props.handleUpdateShift} onDeleteDebitEntry={props.handleDeleteDebitEntry} onDeleteRecoveryEntry={props.handleDeleteRecoveryEntry} />;
};

const SuppliersRoute = () => {
 const props = useProps();
 return <SupplierCommandCenter settings={props.settings} suppliers={props.suppliers} shifts={props.shifts} products={props.products} banks={props.banks} onAddSupplier={props.handleAddSupplier} onUpdateSupplier={props.handleUpdateSupplier} onDeleteSupplier={props.handleDeleteSupplier} onDeleteSupplierPayment={props.handleDeleteSupplierPayment} />;
};

const LedgerRoute = () => {
 const props = useProps();
 return (
   <Ledger
     settings={props.settings}
     customers={props.customers}
     suppliers={props.suppliers}
     shifts={props.shifts}
     products={props.products}
     lubePosSales={props.lubePosSales}
     activeStationId={props.activeStationId}
     staff={props.staff}
     banks={props.banks}
     digitalAccounts={props.digitalAccounts}
     onUpdateCustomer={props.handleUpdateCustomer}
     onUpdateSupplier={props.handleUpdateSupplier}
     onUpdateShift={props.handleUpdateShift}
   />
 );
};

const BankCashRoute = () => {
 const props = useProps();
 return (
   <BankCashPanel
     settings={props.settings}
     banks={props.banks}
     onAddBank={props.handleAddBank}
     onUpdateBanks={props.handleUpdateBanks}
     shifts={props.shifts}
     lubePosSales={props.lubePosSales}
     activeStationId={props.activeStationId}
     staff={props.staff}
     onUpdateShift={props.handleUpdateShift}
   />
 );
};

const DigitalCashRoute = () => {
 const props = useProps();
 return <DigitalCashPanel settings={props.settings} digitalAccounts={props.digitalAccounts} onAddDigitalAccount={props.handleAddDigitalAccount} onUpdateDigitalAccounts={props.handleUpdateDigitalAccounts} shifts={props.shifts} lubePosSales={props.lubePosSales} />;
};

const InventoryRoute = () => {
 const props = useProps();
 return <InventoryHub settings={props.settings} activeStationId={props.activeStationId} products={props.products} suppliers={props.suppliers} stockTransactions={props.stockTxns} onAddStockTransaction={props.handleAddStockReceipt} onUpdateProductStock={props.handleUpdateProductStock} onUpdateProduct={props.handleUpdateProduct} onDeleteProduct={props.handleDeleteProduct} onAddProduct={props.handleAddProduct} tanks={props.tanks} rateHistory={props.rateHistory} />;
};

const ExpensesRoute = () => {
 const props = useProps();
 return (
   <Expenses
     settings={props.settings}
     activeStationId={props.activeStationId}
     shifts={props.shifts}
     standaloneExpenses={props.standaloneExpenses}
     onAddStandaloneExpense={props.handleAddStandaloneExpense}
     staff={props.staff}
     banks={props.banks}
     digitalAccounts={props.digitalAccounts}
     suppliers={props.suppliers}
     products={props.products}
     pumps={props.pumps}
     onUpdateShift={props.handleUpdateShift}
   />
 );
};

const ReportsRoute = () => {
 const props = useProps();
 const { user } = useAuth();
 const isLubeBusiness = props.stations.find(s => s.id === props.activeStationId)?.businessType === 'lube';
 if (isLubeBusiness) {
 return <LubeReports settings={props.settings} lubePosSales={props.lubePosSales} products={props.products} customers={props.customers} suppliers={props.suppliers} staff={props.staff} standaloneExpenses={props.standaloneExpenses} />;
 }
 // Enterprise Reports Platform v2.0 — real tenant context wired from auth
 return <EnterpriseReportsWorkspace
   settings={props.settings}
   activeStationId={props.activeStationId}
   orgId={user?.orgId}
   userRole={user?.role}
   userId={user?.uid}
   userName={user?.email}
 />;
};

const DiscountsRoute = () => {
 const props = useProps();
 return (
   <DiscountsHub
     settings={props.settings}
     activeStationId={props.activeStationId}
     shifts={props.shifts}
     products={props.products}
     customers={props.customers}
     staff={props.staff}
     pumps={props.pumps}
     nozzles={props.nozzles}
     lubePosSales={props.lubePosSales}
     onUpdateShift={props.handleUpdateShift}
   />
 );
};

const StaffRoute = () => {
 const props = useProps();
 return <StaffPanel settings={props.settings} staff={props.staff} onAddStaff={props.handleAddStaff} onUpdateStaff={props.handleUpdateStaff} staffFinance={props.staffFinance} onAddStaffFinance={props.handleAddStaffFinance} attendance={props.attendance} onAddAttendance={props.handleAddAttendance} shifts={props.shifts} />;
};

const SettingsRoute = () => {
 const props = useProps();
 const navigate = useNavigate();
 return <SettingsPanel initialTab="profile" activeStationId={props.activeStationId} settings={props.settings} products={props.products} pumps={props.pumps} nozzles={props.nozzles} onUpdateSettings={props.handleUpdateSettings} onUpdateProductRate={props.handleUpdateProductRate} tanks={props.tanks} onAddTank={props.handleAddTank} onUpdateTank={props.handleUpdateTank} onDeleteTank={props.handleDeleteTank} onAddNozzle={props.handleAddNozzle} onUpdateNozzle={props.handleUpdateNozzle} onDeleteNozzle={props.handleDeleteNozzle} rateHistory={props.rateHistory} banks={props.banks} onUpdateBanks={props.setBanks} onUpdateProducts={props.setProducts} onUpdatePumps={props.setPumps} onNavigate={(viewId) => {
 if (viewId === 'dashboard') {
 navigate('/');
 }
 }} />;
};

const PriceManagementRoute = () => {
 const props = useProps();
 return <PriceManagement products={props.products} tanks={props.tanks} rateHistory={props.rateHistory} language={props.settings.language} settings={props.settings} onUpdateProductRate={props.handleUpdateProductRate} onLogAudit={() => {}} onUpdateProducts={props.setProducts} />;
};

const EnterpriseHubRoute = () => {
 const props = useProps();
 const navigate = useNavigate();
 return <EnterpriseHub settings={props.settings} activeModule="fleet" 
 onNavigate={(path) => {
 let cleanPath = `/${path.replace(/_/g, '-')}`;
 if (path === 'dashboard') cleanPath = '/';
 navigate(cleanPath);
 }} 
 stationId={props.activeStationId} 
 />;
};

const EnterpriseDashboardRoute = () => {
 const navigate = useNavigate();
 return <EnterpriseDashboard onNavigate={(view) => {
 let cleanPath = `/${view.replace(/_/g, '-')}`;
 if (view === 'dashboard') cleanPath = '/';
 navigate(cleanPath);
 }} />;
};

const DipCalculatorRoute = () => {
 const props = useProps();
 return <DipCalculator settings={props.settings} tanks={props.tanks} />;
};

const SecurityHubRoute = () => {
 const props = useProps();
 const { user, logout } = useAuth();
 return <SecurityHub settings={props.settings} user={user as any} onLogout={logout} />;
};

const SubscriptionHubRoute = () => {
 const props = useProps();
 return <SubscriptionHub settings={props.settings} />;
};

const LicenseManagerRoute = () => {
 const props = useProps();
 return <LicenseManager settings={props.settings} />;
};

const AIAnalyticsHubRoute = () => {
  const props = useProps();
  return <AIAnalyticsHub settings={props.settings} dataContext={props} />;
};

const WetStockIntelligenceRoute = () => {
  const navigate = useNavigate();
  return <WetStockIntelligenceHub onNavigate={(view, ctx) => {
    let cleanPath = `/${view.replace(/_/g, '-')}`;
    if (view === 'dashboard') cleanPath = '/';
    navigate(cleanPath, { state: ctx });
  }} />;
};

const AuditCenterRoute = () => {
  return <AuditCenter />;
};

const SyncCenterRoute = () => {
  const props = useProps();
  return <SyncCenter settings={props.settings} />;
};

// Map routes
export const router = createBrowserRouter([
 {
 path: '/',
 element: <AppShell />,
 children: [
 { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: 'dashboard', element: <DashboardRoute /> },
  { path: 'shift-wizard', element: <ShiftWizardRoute /> },
  { path: 'fuel-sales', element: <FuelSalesModule /> },
  { path: 'shift-logs', element: <ShiftLogsRoute /> },
 { path: 'lube-pos', element: <LubePOSRoute /> },
 { path: 'customers', element: <CustomersRoute /> },
 { path: 'suppliers', element: <SuppliersRoute /> },
 { path: 'ledger', element: <LedgerRoute /> },
 { path: 'bank-cash', element: <BankCashRoute /> },
 { path: 'digital-cash', element: <DigitalCashRoute /> },
 { path: 'inventory', element: <InventoryRoute /> },
 { path: 'wet-stock', element: <WetStockIntelligenceRoute /> },
 { path: 'wet-stock-intelligence', element: <WetStockIntelligenceRoute /> },
 { path: 'expenses', element: <ExpensesRoute /> },
 { path: 'reports', element: <ReportsRoute /> },
 { path: 'discounts', element: <DiscountsRoute /> },
 { path: 'staff', element: <StaffRoute /> },
 { path: 'ai-analytics', element: <AIAnalyticsHubRoute /> },
 { path: 'dip-calculator', element: <DipCalculatorRoute /> }, 
 { path: 'audit-center', element: <AuditCenterRoute /> },
 { path: 'sync-center', element: <SyncCenterRoute /> },
 
 // Basic Protected settings
 { path: 'settings', element: <SettingsRoute /> },
 { path: 'configuration', element: <SettingsRoute /> },
 { path: 'security-hub', element: <SecurityHubRoute /> },
 { path: 'subscription-hub', element: <SubscriptionHubRoute /> },
 { path: 'price-management', element: <PriceManagementRoute /> },
 { path: 'price-intelligence', element: <PriceManagementRoute /> },
 { path: 'price-ledger', element: <PriceManagementRoute /> },
 { path: 'price-revision', element: <PriceManagementRoute /> },
 { path: 'price-revision-register', element: <PriceManagementRoute /> },
 { path: 'about-me', element: <AboutMe /> },

 // Super Admin Only
 {
 element: <ProtectedRoute requireSuperAdmin />,
 children: [
 { path: 'license-manager', element: <LicenseManagerRoute /> }
 ]
 },

 // Premium/Enterprise Only
 {
 element: <ProtectedRoute requirePremium />,
 children: [
 { path: 'communication-center', element: <CommunicationDashboard /> },
 { path: 'bi-analytics', element: <BIDashboard /> },
 { path: 'executive-dashboard', element: <ExecutiveDashboard /> },
 { path: 'enterprise-hub', element: <EnterpriseHubRoute /> },
 { path: 'integrity-center', element: <EnterpriseHubRoute /> },
 { path: 'demand-forecast', element: <EnterpriseHubRoute /> },
 { path: 'fleet', element: <EnterpriseHubRoute /> },
 { path: 'tanker-delivery', element: <EnterpriseHubRoute /> },
 { path: 'erp-integration', element: <EnterpriseHubRoute /> },
 { path: 'fuel-quality', element: <EnterpriseHubRoute /> },
 { path: 'loss-prevention', element: <EnterpriseHubRoute /> },
 { path: 'loyalty', element: <EnterpriseHubRoute /> },
 { path: 'maintenance', element: <EnterpriseHubRoute /> },
 { path: 'cctv', element: <EnterpriseHubRoute /> },
 { path: 'api-gateway', element: <EnterpriseHubRoute /> }
 ]
 },
 
 // Enterprise Only
 {
 element: <ProtectedRoute requireEnterprise />,
 children: [
 { path: 'risk-center', element: <RiskCenter /> },
 { path: 'enterprise-dashboard', element: <EnterpriseDashboardRoute /> },
 { path: 'treasury', element: <TreasuryCenter /> }
 ]
 },

 { path: '*', element: <Navigate to="/dashboard" replace /> }
 ]
 }
]);
