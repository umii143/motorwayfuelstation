import React, { useState } from 'react';
import { GlobalSettings, Product, Supplier, StockTransaction, Tank, RateHistoryEntry } from '../../../types';
import { Activity, LayoutDashboard, Database, ArrowRightLeft, Package, BarChart3, Settings2 } from 'lucide-react';
import { InventoryDashboardTab } from './components/dashboard/InventoryDashboardTab';
import { TankFarmTab } from './components/tanks/TankFarmTab';
import { OperationsTab } from './components/operations/OperationsTab';
import { LubeWarehouseTab } from './components/warehouse/LubeWarehouseTab';
import { ValuationTab } from './components/analytics/ValuationTab';

export interface InventoryHubProps {
  settings: GlobalSettings;
  activeStationId: string;
  products: Product[];
  suppliers: Supplier[];
  stockTransactions: StockTransaction[];
  onAddStockTransaction: (txn: StockTransaction) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
}

type InventoryTab = 'dashboard' | 'tanks' | 'operations' | 'warehouse' | 'analytics';

export const InventoryHub: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';
  const [activeTab, setActiveTab] = useState<InventoryTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const TABS = [
    { id: 'dashboard' as const, label: isEn ? 'Dashboard' : 'ڈیش بورڈ', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tanks' as const, label: isEn ? 'Tank Farm' : 'ٹینک فارم', icon: <Database className="w-4 h-4" /> },
    { id: 'operations' as const, label: isEn ? 'Operations' : 'آپریشنز', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'warehouse' as const, label: isEn ? 'Lube Warehouse' : 'لُب گودام', icon: <Package className="w-4 h-4" /> },
    { id: 'analytics' as const, label: isEn ? 'Analytics' : 'تجزیات', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const MOBILE_BOTTOM_ACTIONS = [
    { id: 'dip', label: 'Dip', icon: <ArrowRightLeft className="w-5 h-5" />, action: () => setActiveTab('operations') },
    { id: 'stock_in', label: 'Stock In', icon: <Package className="w-5 h-5" />, action: () => setActiveTab('operations') },
    { id: 'transfer', label: 'Transfer', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('operations') },
    { id: 'tanks', label: 'Tanks', icon: <Database className="w-5 h-5" />, action: () => setActiveTab('tanks') },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:px-6 border-b border-border bg-card">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            {isEn ? 'Inventory Main Module' : 'انوینٹری مین ماڈیول'}
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold rounded-full ml-2">v2.0 Enterprise</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {isEn ? 'SSOT Compliant • Live Visualization • Flow Tracking' : 'ایس ایس او ٹی کمپلائنٹ • لائیو ویژولائزیشن • فلو ٹریکنگ'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-muted-foreground hover:text-foreground">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 p-2 px-4 sm:px-6 border-b border-border bg-muted/20 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-muted/10 pb-20 md:pb-0">
        <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {activeTab === 'dashboard' && <InventoryDashboardTab {...props} />}
          {activeTab === 'tanks' && <TankFarmTab {...props} />}
          {activeTab === 'operations' && <OperationsTab {...props} />}
          {activeTab === 'warehouse' && <LubeWarehouseTab {...props} />}
          {activeTab === 'analytics' && <ValuationTab {...props} />}
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 px-2 py-2 flex items-center justify-around">
        {MOBILE_BOTTOM_ACTIONS.map(action => (
           <button key={action.id} onClick={action.action} className="flex flex-col items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors">
             {action.icon}
             <span className="text-[10px] font-black mt-1">{action.label}</span>
           </button>
        ))}
        
        {/* More Actions Toggle */}
        <div className="relative">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className={`flex flex-col items-center justify-center p-2 transition-colors ${mobileMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Settings2 className="w-5 h-5" />
            <span className="text-[10px] font-black mt-1">More</span>
          </button>
          
          {mobileMenuOpen && (
            <div className="absolute bottom-16 right-0 w-48 bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-bottom-2">
              <button className="w-full text-left px-4 py-3 text-sm font-bold text-foreground hover:bg-muted rounded-xl transition-colors">Emergency Adjustment</button>
              <button className="w-full text-left px-4 py-3 text-sm font-bold text-foreground hover:bg-muted rounded-xl transition-colors">Meter Impact</button>
              <button className="w-full text-left px-4 py-3 text-sm font-bold text-foreground hover:bg-muted rounded-xl transition-colors">History</button>
              <button className="w-full text-left px-4 py-3 text-sm font-bold text-foreground hover:bg-muted rounded-xl transition-colors">Documents</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
