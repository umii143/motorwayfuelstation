import React, { useState } from 'react';
import { 
  X, LayoutDashboard, RefreshCw, History, Users, Factory, 
  BookOpen, Landmark, Smartphone, Fuel, TrendingDown, 
  FileBarChart, Building, Building2, Wrench, DollarSign, Settings,
  Shield, CreditCard, MessageCircle, Database,
  Sun, Moon, Globe, LogOut, Users2, Tag, Droplets, ShieldCheck, 
  Sparkles, LineChart, Briefcase, ShieldAlert, BarChart3, Truck, ArrowRightLeft, Link, ChevronDown, Zap, Camera
} from 'lucide-react';
import { GlobalSettings, Station } from '../../types';
import { t } from '../../lib/translations';
import { useShiftStore } from '../../stores/useShiftStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCustomerStore } from '../../stores/useCustomerStore';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: string) => void;
  activeView: string;
  settings: GlobalSettings;
  isLubeBusiness: boolean;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  stations?: Station[];
  activeStationId?: string;
  onSwitchStation?: (id: string) => void;
  onCreateStation?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onViewChange, 
  activeView,
  settings,
  isLubeBusiness,
  onLanguageToggle,
  onThemeToggle,
  onLogout,
  isSuperAdmin = false,
  stations = [],
  activeStationId,
  onSwitchStation,
  onCreateStation
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);

  // Live Reactive Store Subscriptions
  const shifts = useShiftStore((state) => state.shifts);
  const tanks = useInventoryStore((state) => state.tanks);
  const customers = useCustomerStore((state) => state.customers);

  const activeShift = shifts.find(s => s.status === 'active');
  const lowStockTanksCount = tanks.filter(t => t.capacity > 0 && (t.currentStock / t.capacity) < 0.15).length;
  const overdueCustomersCount = customers.filter(c => c.balance > 0).length;

  const activeStation = stations.find(s => s.id === activeStationId) || stations[0];

  const allMenuItems = [
    // OPERATIONS
    { id: 'dashboard', section: 'operations', icon: LayoutDashboard, label: 'Dashboard', urdu: 'ڈیش بورڈ', showInLube: true },
    { id: isLubeBusiness ? 'lube_pos' : 'shift_wizard', section: 'operations', icon: RefreshCw, label: isLubeBusiness ? 'Lube POS Terminal' : 'Shift Wizard', urdu: isLubeBusiness ? 'لیوب پی او ایس' : 'شفٹ وزرڈ', showInLube: true, badge: activeShift ? 'LIVE' : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    { id: 'fuel_sales', section: 'operations', icon: Fuel, label: 'Fuel Sales Module', urdu: 'فیول سیلز', showInLube: false },
    { id: 'shift_logs', section: 'operations', icon: History, label: 'Shift Logs & Audit', urdu: 'شفٹ لاگز', showInLube: false },
    { id: 'price_management', section: 'operations', icon: DollarSign, label: 'Price Management', urdu: 'قیمتیں اور نرخ', showInLube: false },
    { id: 'discounts', section: 'operations', icon: Tag, label: 'Discounts', urdu: 'ڈسکاؤنٹس', showInLube: true },
    { id: 'expenses', section: 'operations', icon: TrendingDown, label: 'Expenses', urdu: 'اخراجات', showInLube: true },

    // FINANCIALS
    { id: 'ledger', section: 'financials', icon: BookOpen, label: 'Accounts & Billing', urdu: 'کھاتہ اور بلنگ', showInLube: true },
    { id: 'customers', section: 'financials', icon: Users, label: 'Customers Khata', urdu: 'گاہکوں کا کھاتہ', showInLube: true, badge: overdueCustomersCount > 0 ? `${overdueCustomersCount} Due` : undefined, badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' },
    { id: 'bank_cash', section: 'financials', icon: Landmark, label: 'Bank Cash', urdu: 'بینک کیش', showInLube: true },
    { id: 'digital_cash', section: 'financials', icon: Smartphone, label: 'Digital Cash', urdu: 'ڈیجیٹل کیش', showInLube: true },

    // INVENTORY & DEPOT
    { id: 'suppliers', section: 'inventory', icon: Factory, label: isLubeBusiness ? 'Suppliers' : 'Suppliers Depot', urdu: isLubeBusiness ? 'سپلائرز' : 'سپلائرز ڈپو', showInLube: true },
    { id: 'inventory', section: 'inventory', icon: isLubeBusiness ? Wrench : Fuel, label: isLubeBusiness ? 'Product & Parts Stock' : 'Fuel Stock', urdu: isLubeBusiness ? 'پروڈکٹ اسٹاک' : 'فیول اسٹاک', showInLube: true, badge: lowStockTanksCount > 0 ? `${lowStockTanksCount} Low` : undefined, badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' },
    { id: 'wet_stock_intelligence', section: 'inventory', icon: Fuel, label: 'Wet Stock Intelligence', urdu: 'ویٹ اسٹاک انٹیلی جنس', showInLube: false, badge: 'Phase 5', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'dip_calculator', section: 'inventory', icon: Droplets, label: 'Dip Chart Calculator', urdu: 'دپ چارٹ کیلکولیٹر', showInLube: false },

    // REPORTS & INTELLIGENCE
    { id: 'reports', section: 'reports', icon: FileBarChart, label: isLubeBusiness ? 'Lube Reports' : 'Business Center', urdu: isLubeBusiness ? 'لیوب رپورٹس' : 'بزنس سینٹر', showInLube: true },
    { id: 'ai_analytics', section: 'reports', icon: Sparkles, label: 'AI Analytics Hub', urdu: 'اے آئی اینالٹکس', showInLube: false },
    { 
      id: 'enterprise_hub', 
      section: 'reports',
      icon: Building, 
      label: 'Enterprise Modules', 
      urdu: 'انٹرپرائز ماڈیولز', 
      showInLube: false,
      children: [
        { id: 'bi_analytics', icon: LineChart, label: 'BI Analytics', urdu: 'بی آئی اینالٹکس', showInLube: false },
        { id: 'executive_dashboard', icon: Briefcase, label: 'Executive Insights', urdu: 'ایگزیکٹو ڈیش بورڈ', showInLube: false },
        { id: 'enterprise_dashboard', icon: Building2, label: 'Enterprise Dashboard', urdu: 'انٹرپرائز ڈیش بورڈ', showInLube: false, ownerOnly: true },
        { id: 'treasury', icon: Landmark, label: 'Treasury Center', urdu: 'ٹریژری سینٹر', showInLube: false },
        { id: 'risk_center', icon: ShieldAlert, label: 'Risk Center', urdu: 'رسک سینٹر', showInLube: false },
        { id: 'integrity_center', icon: ShieldCheck, label: 'Integrity Center', urdu: 'انٹیگریٹی سینٹر', showInLube: false },
        { id: 'demand_forecast', icon: BarChart3, label: 'Forecasting', urdu: 'فورکاسٹنگ', showInLube: false },
        { id: 'fleet', icon: Truck, label: 'Fleet Accounts', urdu: 'فلیٹ منیجمنٹ', showInLube: false },
        { id: 'tanker_delivery', icon: ArrowRightLeft, label: isLubeBusiness ? 'Supplier Deliveries' : 'Tankers & Delivery', urdu: isLubeBusiness ? 'سپلائر ڈیلیوری' : 'ٹینکر شیڈول', showInLube: false },
        { id: 'erp_integration', icon: Link, label: 'ERP Connect', urdu: 'ای آر پی کنیکٹ', showInLube: false },
        { id: 'fuel_quality', icon: Droplets, label: 'Fuel Quality', urdu: 'فیول کوالٹی', showInLube: false },
        { id: 'loss_prevention', icon: ShieldAlert, label: 'Loss Prevention', urdu: 'لاس پریوینشن', showInLube: false },
        { id: 'loyalty', icon: Tag, label: 'Loyalty Program', urdu: 'لائلٹی پروگرام', showInLube: false },
        { id: 'maintenance', icon: Wrench, label: 'Maintenance', urdu: 'مینٹیننس', showInLube: false },
        { id: 'price_intelligence', icon: Zap, label: 'Price Ledger', urdu: 'پرائس لیجر', showInLube: false },
        { id: 'cctv', icon: Camera, label: 'CCTV Integration', urdu: 'سی سی ٹی وی', showInLube: false },
        { id: 'api_gateway', icon: Database, label: 'API Gateway', urdu: 'اے پی آئی گیٹ وے', showInLube: false },
      ]
    },

    // ADMINISTRATION & SYSTEM
    { id: 'staff', section: 'system', icon: Users2, label: 'Staff & Payroll', urdu: 'اسٹاف اور تنخواہ', showInLube: true },
    { id: 'audit_center', section: 'system', icon: ShieldAlert, label: 'Audit Center', urdu: 'آڈٹ سینٹر', showInLube: true },
    { id: 'security_hub', section: 'system', icon: Shield, label: 'Security & Roles', urdu: 'سیکیورٹی ہب', showInLube: true },
    { id: 'subscription_hub', section: 'system', icon: CreditCard, label: 'Subscription & Billing', urdu: 'بلنگ اور پلان', showInLube: true },
    ...(isSuperAdmin ? [{ id: 'license_manager', section: 'system', icon: ShieldCheck, label: 'License Manager', urdu: 'لائسنس مینیجر', showInLube: true }] : []),
    { id: 'communication_center', section: 'system', icon: MessageCircle, label: 'Communication Center', urdu: 'مواصلاتی مرکز', showInLube: true },
    { id: 'sync_center', section: 'system', icon: RefreshCw, label: 'Sync Center', urdu: 'سنک سینٹر', showInLube: true },
    { id: 'settings', section: 'system', icon: Settings, label: 'Settings & Setup', urdu: 'سیٹنگز اور سیٹ اپ', showInLube: true },
    { id: 'about_me', section: 'system', icon: Sparkles, label: 'About Me', urdu: 'میرے بارے میں', showInLube: true }
  ];

  const visibleItems = isLubeBusiness
    ? allMenuItems.filter(item => item.showInLube)
    : allMenuItems;

  const handleItemClick = (id: string) => {
    onViewChange(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const sections = ['operations', 'financials', 'inventory', 'reports', 'system'];

  const sectionLabels: Record<string, { en: string; ur: string }> = {
    operations: { en: 'Operations', ur: 'آپریشنز' },
    financials: { en: 'Financials & Khata', ur: 'مالیات اور کھاتہ' },
    inventory: { en: 'Stock & Depot', ur: 'اسٹاک اور ڈیوپ' },
    reports: { en: 'Business Center', ur: 'بزنس سینٹر' },
    system: { en: 'Administration & System', ur: 'ایڈمنسٹریشن اور سسٹم' }
  };

  return (
    <>
      {/* Backdrop for mobile screen - tap to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] lg:hidden transition-opacity cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      )}
      
      {/* Drawer - Toggled on mobile, fixed on desktop */}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-[110] shadow-2xl lg:shadow-none flex flex-col overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <span className="font-extrabold tracking-wider text-foreground uppercase text-base">
            Navigation
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close Navigation"
            className="p-2 text-muted-foreground hover:text-orange-600 hover:bg-subtle rounded-full transition-colors lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Switcher */}
        <div className="px-4 py-3 border-b border-border shrink-0 relative z-50 bg-card">
          <button 
            onClick={() => setIsStationMenuOpen(!isStationMenuOpen)}
            className="flex w-full items-center justify-between gap-3 p-2.5 rounded-xl transition-colors hover:bg-subtle border border-border cursor-pointer"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeStation?.businessType === 'lube' ? 'from-blue-400 to-[#0055FF]' : 'from-orange-400 to-[#FF7A00]'} flex items-center justify-center shadow-md shrink-0`}>
                {activeStation?.businessType === 'lube' ? (
                  <Droplets className="w-4 h-4 text-white" />
                ) : (
                  <Fuel className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-bold text-foreground truncate">
                  {activeStation?.name || 'Select Business'}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {activeStation?.businessType === 'lube' ? 'Lube Business' : activeStation?.businessType === 'cng' ? 'CNG Station' : 'Fuel Station'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isStationMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStationMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 flex flex-col gap-1 p-2 bg-card rounded-xl border border-border shadow-xl z-[100]">
              {stations.map(station => (
                <button
                  key={station.id}
                  onClick={() => {
                    onSwitchStation?.(station.id);
                    setIsStationMenuOpen(false);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer ${station.id === activeStationId ? (station.businessType === 'lube' ? 'bg-blue-500/10' : 'bg-orange-500/10') : 'hover:bg-subtle'}`}
                >
                  {station.businessType === 'lube' ? (
                    <Droplets className={`w-4 h-4 shrink-0 ${station.id === activeStationId ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                  ) : (
                    <Fuel className={`w-4 h-4 shrink-0 ${station.id === activeStationId ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`} />
                  )}
                  <span className={`text-xs font-bold truncate ${station.id === activeStationId ? (station.businessType === 'lube' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400') : 'text-foreground'}`}>
                    {station.name}
                  </span>
                </button>
              ))}
              <div className="px-2 pt-2 pb-1 border-t border-border mt-1">
                <button
                  onClick={() => {
                    onCreateStation?.();
                    setIsStationMenuOpen(false);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-orange-600 hover:bg-orange-500/10 border border-dashed border-orange-500/30 text-xs font-bold cursor-pointer"
                >
                  <span>+ Add Business</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scroll-container pb-24">
          {sections.map(sectionKey => {
            const sectionItems = visibleItems.filter(item => item.section === sectionKey);
            if (sectionItems.length === 0) return null;
            const sectionTitle = sectionLabels[sectionKey] || { en: sectionKey, ur: sectionKey };

            return (
              <div key={`section_${sectionKey}`} className="space-y-1 mb-3">
                <div className="px-3 pt-2 pb-1 flex items-center">
                  <span className="text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
                    {t(sectionTitle.en, sectionTitle.ur, settings)}
                  </span>
                </div>
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  
                  if (item.children) {
                    const isChildActive = item.children.some(child => activeView === child.id);
                    const expanded = expandedMenus[item.id] !== undefined ? expandedMenus[item.id] : isChildActive;
                    
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => setExpandedMenus(prev => ({ ...prev, [item.id]: !expanded }))}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 font-sans text-base font-semibold transition-all cursor-pointer ${
                            isChildActive
                              ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-4 border-orange-600'
                              : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5.5 w-5.5 shrink-0 transition-transform hover:scale-110 ${isChildActive ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400'}`} />
                            <span className="flex-1 text-left whitespace-nowrap">{t(item.label, item.urdu, settings)}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isChildActive ? 'text-orange-600' : 'text-slate-400'}`} />
                        </button>
                        
                        {expanded && (
                          <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {item.children.map((child: any) => {
                              if (isLubeBusiness && !child.showInLube) return null;
                              if (child.ownerOnly && !isSuperAdmin) return null;
                              const childActive = activeView === child.id;
                              const ChildIcon = child.icon;
                              
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => handleItemClick(child.id)}
                                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-sans text-sm font-semibold transition-all cursor-pointer ${
                                    childActive
                                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-bold'
                                      : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
                                  }`}
                                >
                                  <ChildIcon className={`h-4.5 w-4.5 shrink-0 ${childActive ? 'text-orange-600' : 'text-slate-400'}`} />
                                  <span className="truncate">{t(child.label, child.urdu, settings)}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = activeView === item.id || (activeView.startsWith('setup_') && item.id === activeView);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 font-sans text-base font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-4 border-orange-600 font-bold'
                          : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      <Icon className={`h-5.5 w-5.5 shrink-0 transition-transform hover:scale-110 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className="flex-1 text-left">{t(item.label, item.urdu, settings)}</span>
                      {(item as any).badge && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-orange-500/20 text-orange-600'}`}>
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Bottom Toggles */}
        <div className="border-t border-border p-4 shrink-0 bg-subtle flex flex-col gap-2 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onLanguageToggle();
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-3 py-2.5 text-sm font-bold text-foreground hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs cursor-pointer"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              {settings.language === 'ur' ? 'اردو' : 'English'}
            </button>
            <button
              onClick={() => {
                onThemeToggle();
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-3 py-2.5 text-sm font-bold text-foreground hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs cursor-pointer"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
              {t('Theme', 'تھیم', settings)}
            </button>
          </div>
          <button
            onClick={() => {
              onLogout();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('Sign Out', 'لاگ آؤٹ', settings)}
          </button>
        </div>

      </div>
    </>
  );
};
