import React, { useState } from 'react';
import { 
  X, LayoutDashboard, RefreshCw, History, Users, Factory, 
  BookOpen, Landmark, Smartphone, Fuel, TrendingDown, 
  FileBarChart, Building, Wrench, DollarSign, Settings,
  Shield, CreditCard, MessageCircle, Database, AlertTriangle,
  Sun, Moon, Globe, LogOut, Users2, Tag, Droplets, ShieldCheck, 
  Sparkles, LineChart, Briefcase, ShieldAlert, BarChart3, Truck, ArrowRightLeft, Link, ChevronDown, Zap, Camera
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t } from '../../lib/translations';

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
  isSuperAdmin = false
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const allMenuItems = [
    // MAIN
    { id: 'dashboard', section: 'main', icon: LayoutDashboard, label: 'Dashboard', urdu: 'ڈیش بورڈ', showInLube: true },
    { id: isLubeBusiness ? 'lube_pos' : 'shift_wizard', section: 'main', icon: RefreshCw, label: isLubeBusiness ? 'Lube POS Terminal' : 'Shift Wizard', urdu: isLubeBusiness ? 'لیوب پی او ایس' : 'شفٹ وزرڈ', showInLube: true },
    { id: 'shift_logs', section: 'main', icon: History, label: 'Shift Logs & Audit', urdu: 'شفٹ لاگز', showInLube: false },
    { id: 'price_management', section: 'main', icon: DollarSign, label: 'Price Management', urdu: 'قیمتیں اور نرخ', showInLube: false },
    { id: 'ledger', section: 'main', icon: BookOpen, label: 'Accounts & Billing', urdu: 'کھاتہ اور بلنگ', showInLube: true },
    { id: 'customers', section: 'main', icon: Users, label: 'Customers Khata', urdu: 'گاہکوں کا کھاتہ', showInLube: true },
    { id: 'suppliers', section: 'main', icon: Factory, label: isLubeBusiness ? 'Suppliers' : 'Suppliers Depot', urdu: isLubeBusiness ? 'سپلائرز' : 'سپلائرز ڈپو', showInLube: true },
    { id: 'inventory', section: 'main', icon: isLubeBusiness ? Wrench : Fuel, label: isLubeBusiness ? 'Product & Parts Stock' : 'Fuel Stock', urdu: isLubeBusiness ? 'پروڈکٹ اسٹاک' : 'فیول اسٹاک', showInLube: true },
    { id: 'bank_cash', section: 'main', icon: Landmark, label: 'Bank Cash', urdu: 'بینک کیش', showInLube: true },
    { id: 'digital_cash', section: 'main', icon: Smartphone, label: 'Digital Cash', urdu: 'ڈیجیٹل کیش', showInLube: true },
    { 
      id: 'enterprise_hub', 
      section: 'main',
      icon: Building, 
      label: 'Enterprise Modules', 
      urdu: 'انٹرپرائز ماڈیولز', 
      showInLube: true,
      children: [
        { id: 'bi_analytics', icon: LineChart, label: 'BI Analytics', urdu: 'بی آئی اینالٹکس', showInLube: true },
        { id: 'executive_dashboard', icon: Briefcase, label: 'Executive Insights', urdu: 'ایگزیکٹو ڈیش بورڈ', showInLube: true },
        { id: 'treasury', icon: Landmark, label: 'Treasury Center', urdu: 'ٹریژری سینٹر', showInLube: true },
        { id: 'risk_center', icon: ShieldAlert, label: 'Risk Center', urdu: 'رسک سینٹر', showInLube: true },
        { id: 'integrity_center', icon: ShieldCheck, label: 'Integrity Center', urdu: 'انٹیگریٹی سینٹر', showInLube: true },
        { id: 'demand_forecast', icon: BarChart3, label: 'Forecasting', urdu: 'فورکاسٹنگ', showInLube: true },
        { id: 'fleet', icon: Truck, label: 'Fleet Accounts', urdu: 'فلیٹ منیجمنٹ', showInLube: false },
        { id: 'tanker_delivery', icon: ArrowRightLeft, label: isLubeBusiness ? 'Supplier Deliveries' : 'Tankers & Delivery', urdu: isLubeBusiness ? 'سپلائر ڈیلیوری' : 'ٹینکر شیڈول', showInLube: false },
        { id: 'erp_integration', icon: Link, label: 'ERP Connect', urdu: 'ای آر پی کنیکٹ', showInLube: true },
        { id: 'fuel_quality', icon: Droplets, label: 'Fuel Quality', urdu: 'فیول کوالٹی', showInLube: false },
        { id: 'loss_prevention', icon: ShieldAlert, label: 'Loss Prevention', urdu: 'لاس پریوینشن', showInLube: true },
        { id: 'loyalty', icon: Tag, label: 'Loyalty Program', urdu: 'لائلٹی پروگرام', showInLube: true },
        { id: 'maintenance', icon: Wrench, label: 'Maintenance', urdu: 'مینٹیننس', showInLube: true },
        { id: 'price_intelligence', icon: Zap, label: 'Price Ledger', urdu: 'پرائس لیجر', showInLube: true },
        { id: 'cctv', icon: Camera, label: 'CCTV Integration', urdu: 'سی سی ٹی وی', showInLube: true },
        { id: 'api_gateway', icon: Database, label: 'API Gateway', urdu: 'اے پی آئی گیٹ وے', showInLube: true },
      ]
    },
    { id: 'staff', section: 'main', icon: Users2, label: 'Staff & Payroll', urdu: 'اسٹاف اور تنخواہ', showInLube: true },
    // OPERATIONS
    { id: 'discounts', section: 'operations', icon: Tag, label: 'Discounts', urdu: 'ڈسکاؤنٹس', showInLube: true },
    { id: 'expenses', section: 'operations', icon: TrendingDown, label: 'Expenses', urdu: 'اخراجات', showInLube: true },
    // ANALYTICS
    { id: 'reports', section: 'analytics', icon: FileBarChart, label: isLubeBusiness ? 'Lube Reports' : 'Advanced Reports (104)', urdu: isLubeBusiness ? 'لیوب رپورٹس' : 'ایڈوانسڈ رپورٹس', showInLube: true },
    { id: 'dip_calculator', section: 'analytics', icon: Droplets, label: 'Dip Chart Calculator', urdu: 'دپ چارٹ کیلکولیٹر', showInLube: false },

    { id: 'ai_analytics', section: 'analytics', icon: Sparkles, label: 'AI Analytics Hub', urdu: 'اے آئی اینالٹکس', showInLube: true },
    // SYSTEM / SETUP
    { id: 'settings', section: 'system', icon: Settings, label: 'Settings & Setup', urdu: 'سیٹنگز اور سیٹ اپ', showInLube: true },
    { id: 'security_hub', section: 'system', icon: Shield, label: 'Security & Roles', urdu: 'سیکیورٹی ہب', showInLube: true },
    { id: 'subscription_hub', section: 'system', icon: CreditCard, label: 'Subscription & Billing', urdu: 'بلنگ اور پلان', showInLube: true },
    ...(isSuperAdmin ? [{ id: 'license_manager', section: 'system', icon: ShieldCheck, label: 'License Manager', urdu: 'لائسنس مینیجر', showInLube: true }] : []),
    { id: 'communication_center', section: 'system', icon: MessageCircle, label: 'Communication Center', urdu: 'مواصلاتی مرکز', showInLube: true },
    { id: 'sync_center', section: 'system', icon: RefreshCw, label: 'Sync Center', urdu: 'سنک سینٹر', showInLube: true }
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

  const sections = ['main', 'operations', 'analytics', 'setup', 'system'];

  return (
    <>
      {/* Backdrop for mobile only */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] lg:hidden transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer - Always visible on lg screens, toggled on mobile */}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#151521] border-r border-slate-200 dark:border-white/5 z-[110] shadow-2xl lg:shadow-none flex flex-col overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-white/5 shrink-0">
          <span className="font-black tracking-tight text-slate-800 dark:text-white uppercase text-lg">
            Navigation
          </span>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-white/5 rounded-full transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scroll-container pb-24">
          {sections.map(sectionKey => {
            const sectionItems = visibleItems.filter(item => item.section === sectionKey);
            if (sectionItems.length === 0) return null;

            return (
              <div key={`section_${sectionKey}`} className="space-y-1">
                <div className="px-3 py-2 flex items-center">
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                  <span className="px-2 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                    {t(sectionKey.toUpperCase(), sectionKey === 'main' ? 'مین' : sectionKey === 'operations' ? 'آپریشنز' : sectionKey === 'analytics' ? 'رپورٹس' : sectionKey === 'setup' ? 'سیٹ اپ' : 'سسٹم', settings)}
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
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
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 font-sans text-sm font-semibold transition-all cursor-pointer ${
                            isChildActive
                              ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-4 border-orange-600'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 shrink-0 ${isChildActive ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400'}`} />
                            <span className="flex-1 text-left whitespace-nowrap">{t(item.label, item.urdu, settings)}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isChildActive ? 'text-orange-600' : 'text-slate-400'}`} />
                        </button>
                        
                        {expanded && (
                          <div className="mt-1 ml-4 space-y-1 border-l border-slate-200 dark:border-white/10 pl-2">
                            {item.children.map((child: any) => {
                              if (isLubeBusiness && !child.showInLube) return null;
                              const childActive = activeView === child.id;
                              const ChildIcon = child.icon;
                              
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => handleItemClick(child.id)}
                                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
                                    childActive
                                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-bold'
                                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  <ChildIcon className={`h-4 w-4 shrink-0 ${childActive ? 'text-orange-600' : 'text-slate-400'}`} />
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
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-l-4 border-orange-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span>{t(item.label, item.urdu, settings)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Bottom Toggles */}
        <div className="border-t border-slate-100 dark:border-white/5 p-4 shrink-0 bg-slate-50 dark:bg-white/5 flex flex-col gap-2 z-10">
          <div className="flex gap-2">
            <button
              onClick={onLanguageToggle}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              {settings.language === 'ur' ? 'اردو' : 'English'}
            </button>
            <button
              onClick={onThemeToggle}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              {t('Theme', 'تھیم', settings)}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            {t('Sign Out', 'لاگ آؤٹ', settings)}
          </button>
        </div>

      </div>
    </>
  );
};

